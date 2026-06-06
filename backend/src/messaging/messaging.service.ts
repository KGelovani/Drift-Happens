import { Injectable, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);
  private connection: amqp.Connection;
  private channel: amqp.Channel;

  async connect(): Promise<void> {
    try {
      const url = process.env.RABBITMQ_URL || 'amqp://localhost';
      this.connection = (await amqp.connect(url)) as any;
      this.channel = await (this.connection as any).createChannel();
      await this.declareExchangesAndQueues();
      this.logger.log('RabbitMQ connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  private async declareExchangesAndQueues(): Promise<void> {
    const exchange = 'segment-delta';
    const queues = [
      'segment-delta.ui',
      'segment-delta.campaigns',
      'segment-delta.analytics',
    ];
    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    for (const queue of queues) {
      await this.channel.assertQueue(queue, { durable: true });
      await this.channel.bindQueue(queue, exchange, 'segment.delta.*');
    }
  }

  async publishDelta(segmentId: string, delta: any): Promise<void> {
    if (!this.channel) {
      await this.connect();
    }

    const exchange = 'segment-delta';
    const routingKey = `segment.delta.${segmentId}`;
    const message = JSON.stringify({
      segmentId,
      delta,
      timestamp: new Date().toISOString(),
    });

    this.channel.publish(
      exchange,
      routingKey,
      Buffer.from(message),
      { persistent: true },
    );

    this.logger.debug(`Published delta to ${routingKey}`);
  }

  async subscribeToDelta(
    queueName: string,
    callback: (msg: any) => void,
  ): Promise<void> {
    if (!this.channel) {
      await this.connect();
    }

    await this.channel.consume(queueName, (msg) => {
      if (msg) {
        const content = JSON.parse(msg.content.toString());
        callback(content);
        this.channel.ack(msg);
      }
    });

    this.logger.log(`Subscribed to ${queueName}`);
  }

  async close(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await (this.connection as any).close();
    }
  }
}
