import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import {
  AI_PROVIDER,
  AIProvider,
  AIRequestInput,
  AIResponse,
} from './providers/ai-provider.token';
import { AIProviderKind } from '@prisma/client';

@Injectable()
export class AIService {
  constructor(
    @Inject(AI_PROVIDER) private readonly provider: AIProvider,
    private readonly prisma: PrismaService,
  ) {}

  async run<T>(input: AIRequestInput): Promise<AIResponse<T>> {
    const kind = process.env.AI_PROVIDER === 'openai' ? AIProviderKind.OPENAI : AIProviderKind.GEMINI;
    const req = await this.prisma.aIRequest.create({
      data: {
        provider: kind,
        model: kind === AIProviderKind.GEMINI ? 'gemini-1.5-pro' : 'gpt-4o',
        purpose: input.purpose ?? 'general',
        prompt: input.prompt,
      },
    });
    const result = await this.provider.generateStructuredResponse<T>(input);
    await this.prisma.aIResponse.create({
      data: {
        requestId: req.id,
        output: result.raw,
        latencyMs: result.latencyMs,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        finishReason: result.finishReason,
      },
    });
    return result;
  }

  getProvider(): AIProvider {
    return this.provider;
  }
}
