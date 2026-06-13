import { Injectable } from '@nestjs/common';
import { AIService } from '../../ai/ai.service';
import { SynthesizerPrompt } from '../prompts';

export interface SynthesizerOutput {
  summary: string;
  confidenceScore: number;
  frictionFactor: number;
  topRisks: string[];
  decisionRecommendation: string;
}

@Injectable()
export class SynthesizerAgent {
  constructor(private readonly ai: AIService) {}

  async run(
    context: string,
    researcher: string,
    opponent: string,
    worst: string,
  ): Promise<SynthesizerOutput & { raw: string }> {
    const r = await this.ai.run<SynthesizerOutput>({
      prompt: SynthesizerPrompt(context, researcher, opponent, worst),
      purpose: 'debate.synthesizer',
    });
    const o = r.output ?? ({} as SynthesizerOutput);
    return {
      summary: o.summary ?? '',
      confidenceScore: clamp(o.confidenceScore ?? 0.6, 0, 1),
      frictionFactor: clamp(o.frictionFactor ?? 0.4, 0, 1),
      topRisks: o.topRisks ?? [],
      decisionRecommendation: o.decisionRecommendation ?? '',
      raw: r.raw,
    };
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}
