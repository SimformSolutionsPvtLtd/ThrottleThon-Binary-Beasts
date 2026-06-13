import { Injectable } from '@nestjs/common';
import { AIService } from '../../ai/ai.service';
import { ResearcherPrompt } from '../prompts';

@Injectable()
export class ResearcherAgent {
  constructor(private readonly ai: AIService) {}

  async run(context: string): Promise<{ findings: string[]; confidenceSignals: string[]; raw: string }> {
    const r = await this.ai.run<{ findings: string[]; confidenceSignals: string[] }>({
      prompt: ResearcherPrompt(context),
      purpose: 'debate.researcher',
    });
    return {
      findings: r.output?.findings ?? [],
      confidenceSignals: r.output?.confidenceSignals ?? [],
      raw: r.raw,
    };
  }
}
