import { AppDataSource } from './data-source';
import { Customer } from '../customers/entities/customer.entity';
import { Segment, SegmentType, SegmentRule } from '../segments/entities/segment.entity';
import { SegmentMembership } from '../segments/entities/segment-membership.entity';

async function seed() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const customerRepository = AppDataSource.getRepository(Customer);
    const segmentRepository = AppDataSource.getRepository(Segment);
    const membershipRepository = AppDataSource.getRepository(SegmentMembership);

    console.log('🌱 Starting seed...');

    const customers = await customerRepository.save([
      {
        email: 'john@example.com',
        name: 'John Doe',
        status: 'ACTIVE',
        totalPurchases: 5500,
        lastTransactionAt: new Date('2026-05-20'),
        lastActivityAt: new Date('2026-06-01'),
      },
      {
        email: 'jane@example.com',
        name: 'Jane Smith',
        status: 'ACTIVE',
        totalPurchases: 3000,
        lastTransactionAt: new Date('2026-05-25'),
        lastActivityAt: new Date('2026-06-02'),
      },
      {
        email: 'bob@example.com',
        name: 'Bob Wilson',
        status: 'ACTIVE',
        totalPurchases: 2000,
        lastTransactionAt: new Date('2026-04-10'),
        lastActivityAt: new Date('2026-06-03'),
      },
      {
        email: 'alice@example.com',
        name: 'Alice Brown',
        status: 'INACTIVE',
        totalPurchases: 1000,
        lastTransactionAt: new Date('2026-02-01'),
        lastActivityAt: new Date('2026-02-15'),
      },
      {
        email: 'charlie@example.com',
        name: 'Charlie Davis',
        status: 'ACTIVE',
        totalPurchases: 6000,
        lastTransactionAt: new Date('2026-05-28'),
        lastActivityAt: new Date('2026-06-04'),
      },
    ]);

    console.log(`✅ Created ${customers.length} customers`);

    const activeBuyers = await segmentRepository.save({
      name: 'Active Buyers',
      description: 'Customers with at least one transaction in the last 30 days',
      type: SegmentType.DYNAMIC,
      rules: [
        {
          field: 'lastTransactionDaysAgo',
          operator: '<=',
          value: 30,
        },
      ],
      isActive: true,
    });

    const vipClients = await segmentRepository.save({
      name: 'VIP Clients',
      description: 'Customers with total purchases exceeding 5000 GEL in last 60 days',
      type: SegmentType.DYNAMIC,
      rules: [
        {
          field: 'totalPurchases',
          operator: '>',
          value: 5000,
        },
      ],
      isActive: true,
    });

    const riskGroup = await segmentRepository.save({
      name: 'Risk Group',
      description: 'Customers inactive for 90 days but were previously active',
      type: SegmentType.DYNAMIC,
      rules: [
        {
          field: 'lastTransactionDaysAgo',
          operator: '>=',
          value: 90,
        },
        {
          field: 'status',
          operator: '=',
          value: 'INACTIVE',
        },
      ],
      isActive: true,
    });

    const marchCampaign = await segmentRepository.save({
      name: 'March Campaign Audience',
      description: 'Fixed audience for March campaign',
      type: SegmentType.STATIC,
      rules: [
        {
          field: 'totalPurchases',
          operator: '>',
          value: 2000,
        },
      ],
      isActive: true,
    });

    const vipAtRisk = await segmentRepository.save({
      name: 'VIP At Risk',
      description: 'VIP customers in risk group (dependent segment)',
      type: SegmentType.DYNAMIC,
      parentSegmentId: vipClients.id,
      rules: [
        {
          field: 'lastTransactionDaysAgo',
          operator: '>=',
          value: 30,
        },
      ],
      isActive: true,
    });

    console.log('✅ Created 5 segments (4 dynamic, 1 static, 1 dependent)');

    const activeBuyerMembers = [customers[0], customers[1], customers[2], customers[4]];
    for (const customer of activeBuyerMembers) {
      await membershipRepository.save({
        segmentId: activeBuyers.id,
        customerId: customer.id,
      });
    }

    const vipMembers = [customers[0], customers[4]];
    for (const customer of vipMembers) {
      await membershipRepository.save({
        segmentId: vipClients.id,
        customerId: customer.id,
      });
    }

    const riskMembers = [customers[3]];
    for (const customer of riskMembers) {
      await membershipRepository.save({
        segmentId: riskGroup.id,
        customerId: customer.id,
      });
    }

    const campaignMembers = [customers[0], customers[1], customers[4]];
    for (const customer of campaignMembers) {
      await membershipRepository.save({
        segmentId: marchCampaign.id,
        customerId: customer.id,
      });
    }

    console.log('✅ Created initial memberships');
    console.log('🎉 Seed completed successfully!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
