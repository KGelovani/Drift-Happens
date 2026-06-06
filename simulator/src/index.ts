import * as amqp from 'amqplib';
import axios from 'axios';

interface DeltaEvent {
  segmentId: string;
  delta: {
    id: string;
    type: 'ADDED' | 'REMOVED';
    customerIds: string[];
    count: number;
  };
  timestamp: string;
}

class CampaignSimulator {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.API_URL || 'http://localhost:3000';
  }

  async start(): Promise<void> {
    console.log('🚀 Campaign Simulator starting...');

    try {
      await this.connectToRabbitMQ();
      await this.subscribeToDeltas();
      console.log('✅ Simulator ready and listening for segment deltas');
    } catch (error) {
      console.error('❌ Failed to start simulator:', error);
      process.exit(1);
    }
  }

  private async connectToRabbitMQ(): Promise<void> {
    const url = process.env.RABBITMQ_URL || 'amqp://localhost';
    this.connection = await amqp.connect(url);
    this.channel = await this.connection.createChannel();

    await this.channel.assertExchange('segment-delta', 'topic', {
      durable: true,
    });

    console.log('✅ Connected to RabbitMQ');
  }

  private async subscribeToDeltas(): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }

    const queueName = 'segment-delta.campaigns';
    await this.channel.assertQueue(queueName, { durable: true });
    await this.channel.bindQueue(queueName, 'segment-delta', 'segment.delta.*');

    await this.channel.consume(queueName, async (msg) => {
      if (msg) {
        const deltaEvent: DeltaEvent = JSON.parse(msg.content.toString());
        await this.handleDeltaEvent(deltaEvent);
        this.channel?.ack(msg);
      }
    });

    console.log(`📢 Subscribed to queue: ${queueName}`);
  }

  private async handleDeltaEvent(event: DeltaEvent): Promise<void> {
    console.log('\n📬 Delta Event Received!');
    console.log(`   Segment: ${event.segmentId}`);
    console.log(`   Type: ${event.delta.type}`);
    console.log(`   Count: ${event.delta.count}`);

    const { type, customerIds, count } = event.delta;

    if (type === 'ADDED') {
      await this.simulateCampaignNotification(customerIds);
    } else if (type === 'REMOVED') {
      await this.simulateCampaignUnsubscribe(customerIds);
    }
  }

  private async simulateCampaignNotification(
    customerIds: string[],
  ): Promise<void> {
    console.log(`\n📧 CAMPAIGN ACTION: Sending notification to ${customerIds.length} new members`);

    for (const customerId of customerIds) {
      console.log(`   ✉️  → Notification sent to customer ${customerId}`);
      // Simulate API call to send notification
      await this.simulateDelay(100);
    }

    console.log(`✅ Campaign notifications sent to ${customerIds.length} customers`);
  }

  private async simulateCampaignUnsubscribe(
    customerIds: string[],
  ): Promise<void> {
    console.log(
      `\n❌ CAMPAIGN ACTION: Removing ${customerIds.length} members from campaign`,
    );

    for (const customerId of customerIds) {
      console.log(`   🚫 → Unsubscribed customer ${customerId}`);
      await this.simulateDelay(50);
    }

    console.log(`✅ Campaign unsubscriptions processed for ${customerIds.length} customers`);
  }

  private simulateDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async stop(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
    console.log('🛑 Simulator stopped');
  }
}

// Main execution
const simulator = new CampaignSimulator();

simulator.start().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹️  Shutdown signal received');
  await simulator.stop();
  process.exit(0);
});
