import { DataSource } from 'typeorm';
import { Segment } from '../segments/entities/segment.entity';
import { SegmentMembership } from '../segments/entities/segment-membership.entity';
import { SegmentDelta } from '../segments/entities/segment-delta.entity';
import { Customer } from '../customers/entities/customer.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER || 'drift_user',
  password: process.env.DATABASE_PASSWORD || 'drift_password',
  database: process.env.DATABASE_NAME || 'drift_db',
  entities: [Segment, SegmentMembership, SegmentDelta, Customer],
  migrations: ['src/database/migrations/*.ts'],
  subscribers: [],
  synchronize: false,
});
