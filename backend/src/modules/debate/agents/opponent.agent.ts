import { Injectable } from '@nestjs/common';
import { AIService } from '../../ai/ai.service';
import { OpponentPrompt } from '../prompts';

@Injectable()
export class OpponentAgent {
  constructor(private readonly ai: AIService) {}

  async run(context: string, researcherRaw: string) {
    const r = await this.ai.run<{ critiques: string[]; counterEvidence: string[] }>({
      prompt: OpponentPrompt(context, researcherRaw),
      purpose: 'debate.opponent',
    });
    return {
      critiques: r.output?.critiques ?? [],
      counterEvidence: r.output?.counterEvidence ?? [],
      raw: r.raw,
    };
  }
}
