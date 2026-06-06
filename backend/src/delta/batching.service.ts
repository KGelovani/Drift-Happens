import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SegmentDelta } from '../segments/entities/segment-delta.entity';
import { createClient } from 'redis';

@Injectable()
export class BatchingService implements OnModuleInit {
  private readonly logger = new Logger(BatchingService.name);
  private redisClient: any;
  private batchMap: Map<string, any[]> = new Map();
  private batchTimer: NodeJS.Timeout;
  private readonly BATCH_SIZE = 100;
  private readonly BATCH_TIMEOUT = 5000;

  constructor(
    @InjectRepository(SegmentDelta)
    private deltaRepository: Repository<SegmentDelta>,
  ) {}

  async onModuleInit(): Promise<void> {
    this.initRedis().catch((err) => {
      this.logger.warn('Redis connection failed (optional):', err.message);
    });
  }

  private async initRedis(): Promise<void> {
    try {
      this.redisClient = createClient({
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
        },
      });

      this.redisClient.on('error', (err: any) => {
        this.logger.warn('Redis error (optional):', err);
      });

      await this.redisClient.connect();
      this.logger.log('Redis connected successfully');
    } catch (err: any) {
      this.logger.warn('Redis not available, batching service will operate without Redis');
    }
  }

  async queueDelta(segmentId: string, delta: SegmentDelta): Promise<void> {
    const key = `delta:${segmentId}`;

    if (!this.batchMap.has(key)) {
      this.batchMap.set(key, []);
    }

    this.batchMap.get(key).push(delta);

    if (this.batchMap.get(key).length >= this.BATCH_SIZE) {
      await this.flushBatch(segmentId);
    } else {
      this.resetBatchTimer();
    }
  }

  private async flushBatch(segmentId: string): Promise<void> {
    const key = `delta:${segmentId}`;
    const deltas = this.batchMap.get(key) || [];

    if (deltas.length === 0) {
      return;
    }

    this.logger.log(`Flushing batch of ${deltas.length} deltas for segment ${segmentId}`);

    await this.storeInRedis(key, deltas);
    await this.publishToQueue(segmentId, deltas);
    this.batchMap.delete(key);
  }

  private async storeInRedis(
    key: string,
    deltas: SegmentDelta[],
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.redisClient.setex(
        key,
        3600,
        JSON.stringify(deltas),
        (err) => {
          if (err) reject(err);
          else resolve();
        },
      );
    });
  }

  private async publishToQueue(
    segmentId: string,
    deltas: SegmentDelta[],
  ): Promise<void> {
    this.logger.debug(
      `Publishing ${deltas.length} deltas to queue for segment ${segmentId}`,
    );
  }

  private resetBatchTimer(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    this.batchTimer = setTimeout(async () => {
      for (const [key] of this.batchMap.entries()) {
        const segmentId = key.replace('delta:', '');
        await this.flushBatch(segmentId);
      }
    }, this.BATCH_TIMEOUT);
  }

  async flushAllBatches(): Promise<void> {
    for (const [key] of this.batchMap.entries()) {
      const segmentId = key.replace('delta:', '');
      await this.flushBatch(segmentId);
    }
  }
}
