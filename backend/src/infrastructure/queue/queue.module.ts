import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

export const QUEUES = {
  AI: 'ai',
  DEBATE: 'debate',
  FORECAST: 'forecast',
  REPORTS: 'reports',
  INTEGRATIONS: 'integrations',
} as const;

@Module({
  imports: [
    BullModule.registerQueue(
      { name: QUEUES.AI },
      { name: QUEUES.DEBATE },
      { name: QUEUES.FORECAST },
      { name: QUEUES.REPORTS },
      { name: QUEUES.INTEGRATIONS },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}
