import { Module } from '@nestjs/common';
import { AgentHubService } from './agent-hub.service';
import { DebateService } from './debate.service';
import { DebateController } from './debate.controller';

@Module({
  controllers: [DebateController],
  providers: [AgentHubService, DebateService],
})
export class DebateModule {}
