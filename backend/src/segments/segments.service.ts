import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Segment, SegmentType, SegmentRule } from './entities/segment.entity';
import { SegmentMembership } from './entities/segment-membership.entity';
import { SegmentDelta } from './entities/segment-delta.entity';
import { DeltaCalculationService } from '../delta/delta-calculation.service';
import { BatchingService } from '../delta/batching.service';
import { MessagingService } from '../messaging/messaging.service';

@Injectable()
export class SegmentsService {
  constructor(
    @InjectRepository(Segment)
    private segmentRepository: Repository<Segment>,
    @InjectRepository(SegmentMembership)
    private membershipRepository: Repository<SegmentMembership>,
    @InjectRepository(SegmentDelta)
    private deltaRepository: Repository<SegmentDelta>,
    private deltaCalculationService: DeltaCalculationService,
    private batchingService: BatchingService,
    private messagingService: MessagingService,
  ) {}

  async createSegment(
    name: string,
    description: string,
    type: SegmentType,
    rules: SegmentRule[],
    parentSegmentId?: string,
  ): Promise<Segment> {
    const segment = this.segmentRepository.create({
      name,
      description,
      type,
      rules,
      parentSegmentId,
      isActive: true,
    });

    return await this.segmentRepository.save(segment);
  }

  async getSegment(id: string): Promise<Segment> {
    return await this.segmentRepository.findOne({
      where: { id },
      relations: ['memberships', 'deltas'],
    });
  }

  async getAllSegments(): Promise<Segment[]> {
    return await this.segmentRepository.find({
      relations: ['memberships'],
    });
  }

  async evaluateSegment(segmentId: string): Promise<SegmentDelta[]> {
    return await this.deltaCalculationService.evaluateSegmentAndCalculateDelta(
      segmentId,
    );
  }

  async getSegmentMembers(
    segmentId: string,
    limit: number = 100,
    offset: number = 0,
  ) {
    const memberships = await this.membershipRepository.find({
      where: { segmentId },
      relations: ['customer'],
      take: limit,
      skip: offset,
    });

    const total = await this.membershipRepository.count({
      where: { segmentId },
    });

    return {
      data: memberships.map((m) => m.customer),
      total,
      limit,
      offset,
    };
  }

  async getSegmentDeltas(segmentId: string) {
    return await this.deltaRepository.find({
      where: { segmentId },
      order: { createdAt: 'DESC' },
    });
  }

  async deleteSegment(id: string): Promise<void> {
    await this.segmentRepository.delete(id);
  }

  async triggerCascadingUpdate(changedSegmentId: string): Promise<void> {
    const dependents = await this.segmentRepository.find({
      where: { parentSegmentId: changedSegmentId },
    });

    for (const dependent of dependents) {
      const deltas = await this.evaluateSegment(dependent.id);

      for (const delta of deltas) {
        await this.messagingService.publishDelta(dependent.id, delta);
      }

      await this.triggerCascadingUpdate(dependent.id);
    }
  }
}
