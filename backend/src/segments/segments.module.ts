import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SegmentsController } from './segments.controller';
import { SegmentsService } from './segments.service';
import { Segment } from './entities/segment.entity';
import { SegmentMembership } from './entities/segment-membership.entity';
import { SegmentDelta } from './entities/segment-delta.entity';
import { DeltaCalculationService } from '../delta/delta-calculation.service';
import { BatchingService } from '../delta/batching.service';
import { MessagingService } from '../messaging/messaging.service';
import { Customer } from '../customers/entities/customer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Segment,
      SegmentMembership,
      SegmentDelta,
      Customer,
    ]),
  ],
  controllers: [SegmentsController],
  providers: [
    SegmentsService,
    DeltaCalculationService,
    BatchingService,
    MessagingService,
  ],
  exports: [SegmentsService, DeltaCalculationService, MessagingService],
})
export class SegmentsModule implements OnModuleInit {
  private readonly logger = require('@nestjs/common').Logger;
  
  constructor(private messagingService: MessagingService) {}

  async onModuleInit() {
    this.messagingService.connect().catch((err: any) => {
      console.warn('RabbitMQ connection failed (optional):', err.message);
    });
  }
}
