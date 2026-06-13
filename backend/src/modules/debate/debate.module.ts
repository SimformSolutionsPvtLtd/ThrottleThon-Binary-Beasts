import { Module } from '@nestjs/common';
import { DebateController } from './debate.controller';
import { DebateOrchestrator } from './debate.orchestrator';
import { ResearcherAgent } from './agents/researcher.agent';
import { OpponentAgent } from './agents/opponent.agent';
import { WorstCaseAgent } from './agents/worst-case.agent';
import { SynthesizerAgent } from './agents/synthesizer.agent';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [DebateController],
  providers: [
    DebateOrchestrator,
    ResearcherAgent,
    OpponentAgent,
    WorstCaseAgent,
    SynthesizerAgent,
  ],
  exports: [DebateOrchestrator],
})
export class DebateModule {}
