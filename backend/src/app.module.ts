import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SegmentsModule } from './segments/segments.module';
import { AppController } from './app.controller';
import { Segment } from './segments/entities/segment.entity';
import { SegmentMembership } from './segments/entities/segment-membership.entity';
import { SegmentDelta } from './segments/entities/segment-delta.entity';
import { Customer } from './customers/entities/customer.entity';

const isProduction = process.env.NODE_ENV === 'production';

const typeOrmConfig = isProduction
  ? {
      type: 'postgres' as const,
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      username: process.env.DATABASE_USER || 'drift_user',
      password: process.env.DATABASE_PASSWORD || 'drift_password',
      database: process.env.DATABASE_NAME || 'drift_db',
      entities: [Segment, SegmentMembership, SegmentDelta, Customer],
      synchronize: false,
      logging: false,
    }
  : {
      type: 'sqlite' as const,
      database: ':memory:',
      entities: [Segment, SegmentMembership, SegmentDelta, Customer],
      synchronize: true,
      logging: process.env.NODE_ENV === 'development',
    };

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    SegmentsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
