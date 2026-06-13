import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

export const QUEUES = {
  AI: 'ai',
  INGESTION: 'ingestion',
  DEBATE: 'debate',
  FORECAST: 'forecast',
} as const;

@Module({
  imports: [
    BullModule.registerQueue(
      { name: QUEUES.AI },
      { name: QUEUES.INGESTION },
      { name: QUEUES.DEBATE },
      { name: QUEUES.FORECAST },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}
