import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AIProvider,
  AIRequestInput,
  AIResponse,
  DebatePrompt,
  ForecastInsightInput,
} from './ai-provider.token';

@Injectable()
export class OpenAIProvider implements AIProvider {
  private readonly logger = new Logger(OpenAIProvider.name);
  constructor(private readonly cs: ConfigService) {}

  async generateStructuredResponse<T = unknown>(input: AIRequestInput): Promise<AIResponse<T>> {
    // Placeholder — wire in @openai/openai SDK when needed
    this.logger.warn('OpenAIProvider placeholder — set AI_PROVIDER=gemini for live calls');
    return {
      output: { placeholder: true, prompt: input.prompt } as unknown as T,
      raw: '{"placeholder":true}',
      latencyMs: 0,
    };
  }

  generateDebate(input: DebatePrompt): Promise<AIResponse<unknown>> {
    return this.generateStructuredResponse({ prompt: JSON.stringify(input), purpose: 'debate' });
  }

  generateForecastInsights(input: ForecastInsightInput): Promise<AIResponse<unknown>> {
    return this.generateStructuredResponse({
      prompt: JSON.stringify(input),
      purpose: 'forecast-insight',
    });
  }
}
