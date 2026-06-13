import { Injectable } from '@nestjs/common';
import { RiskSeverity } from '@prisma/client';
import { AIService } from '../../ai/ai.service';
import { WorstCasePrompt } from '../prompts';

export interface DebateRisk {
  title: string;
  description: string;
  severity: RiskSeverity;
  likelihood: number;
  impact: number;
}

@Injectable()
export class WorstCaseAgent {
  constructor(private readonly ai: AIService) {}

  async run(context: string): Promise<{ risks: DebateRisk[]; raw: string }> {
    const r = await this.ai.run<{ risks: DebateRisk[] }>({
      prompt: WorstCasePrompt(context),
      purpose: 'debate.worstCase',
    });
    return { risks: r.output?.risks ?? [], raw: r.raw };
  }
}
