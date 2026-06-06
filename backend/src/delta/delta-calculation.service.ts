import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Segment, SegmentRule } from '../segments/entities/segment.entity';
import { SegmentMembership } from '../segments/entities/segment-membership.entity';
import { SegmentDelta, DeltaType } from '../segments/entities/segment-delta.entity';
import { Customer } from '../customers/entities/customer.entity';

@Injectable()
export class DeltaCalculationService {
  private readonly logger = new Logger(DeltaCalculationService.name);

  constructor(
    @InjectRepository(Segment)
    private segmentRepository: Repository<Segment>,
    @InjectRepository(SegmentMembership)
    private membershipRepository: Repository<SegmentMembership>,
    @InjectRepository(SegmentDelta)
    private deltaRepository: Repository<SegmentDelta>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) {}

  async evaluateSegmentAndCalculateDelta(
    segmentId: string,
  ): Promise<SegmentDelta[]> {
    const segment = await this.segmentRepository.findOne({
      where: { id: segmentId },
      relations: ['memberships'],
    });

    if (!segment) {
      throw new Error(`Segment ${segmentId} not found`);
    }

    if (
      segment.type === 'STATIC' &&
      segment.lastEvaluatedAt &&
      !this.isManualRefresh()
    ) {
      this.logger.debug(`Segment ${segmentId} is static and locked`);
      return [];
    }

    const newMembers = await this.evaluateRules(segment.rules, segment);
    const newMemberIds = new Set(newMembers.map((c) => c.id));

    const currentMemberships = await this.membershipRepository.find({
      where: { segmentId },
    });
    const currentMemberIds = new Set(
      currentMemberships.map((m) => m.customerId),
    );

    const added = Array.from(newMemberIds).filter(
      (id) => !currentMemberIds.has(id),
    );
    const removed = Array.from(currentMemberIds).filter(
      (id) => !newMemberIds.has(id),
    );

    const deltas: SegmentDelta[] = [];

    if (added.length > 0) {
      const addedDelta = this.deltaRepository.create({
        segmentId,
        customerIds: added,
        type: DeltaType.ADDED,
        count: added.length,
        metadata: { timestamp: new Date().toISOString() },
      });
      deltas.push(await this.deltaRepository.save(addedDelta));

      for (const customerId of added) {
        const membership = this.membershipRepository.create({
          segmentId,
          customerId,
        });
        await this.membershipRepository.save(membership);
      }
    }

    if (removed.length > 0) {
      const removedDelta = this.deltaRepository.create({
        segmentId,
        customerIds: removed,
        type: DeltaType.REMOVED,
        count: removed.length,
        metadata: { timestamp: new Date().toISOString() },
      });
      deltas.push(await this.deltaRepository.save(removedDelta));

      await this.membershipRepository.delete({
        segmentId,
        customerId: removed as any,
      });
    }

    segment.memberCount = newMemberIds.size;
    segment.lastEvaluatedAt = new Date();
    await this.segmentRepository.save(segment);

    this.logger.log(
      `Segment ${segmentId} delta: +${added.length} -${removed.length}`,
    );

    return deltas;
  }

  private async evaluateRules(
    rules: SegmentRule[],
    segment: Segment,
  ): Promise<Customer[]> {
    let query = this.customerRepository.createQueryBuilder('customer');

    if (segment.parentSegmentId) {
      const parentMembers = await this.membershipRepository.find({
        where: { segmentId: segment.parentSegmentId },
      });
      const parentMemberIds = parentMembers.map((m) => m.customerId);
      query = query.andWhere('customer.id IN (:...parentMemberIds)', {
        parentMemberIds,
      });
    }

    for (const rule of rules) {
      query = this.applyRule(query, rule);
    }

    return await query.getMany();
  }

  private applyRule(query: any, rule: SegmentRule): any {
    const { field, operator, value } = rule;

    switch (field) {
      case 'lastTransactionDaysAgo':
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - value);
        if (operator === '>=') {
          query = query.andWhere('customer.lastTransactionAt >= :date', {
            date: daysAgo,
          });
        } else if (operator === '<=') {
          query = query.andWhere('customer.lastTransactionAt <= :date', {
            date: daysAgo,
          });
        }
        break;

      case 'totalPurchases':
        if (operator === '>') {
          query = query.andWhere(
            'CAST(customer.totalPurchases AS DECIMAL) > :value',
            { value },
          );
        } else if (operator === '<') {
          query = query.andWhere(
            'CAST(customer.totalPurchases AS DECIMAL) < :value',
            { value },
          );
        } else if (operator === '=') {
          query = query.andWhere(
            'CAST(customer.totalPurchases AS DECIMAL) = :value',
            { value },
          );
        }
        break;

      case 'status':
        if (operator === '=') {
          query = query.andWhere('customer.status = :status', {
            status: value,
          });
        }
        break;

      default:
        break;
    }

    return query;
  }

  private isManualRefresh(): boolean {
    return false;
  }
}
