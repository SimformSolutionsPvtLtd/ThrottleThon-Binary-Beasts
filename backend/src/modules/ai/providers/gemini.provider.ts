import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  AIProvider,
  AIRequestInput,
  AIResponse,
  DebatePrompt,
  ForecastInsightInput,
} from './ai-provider.token';

@Injectable()
export class GeminiProvider implements AIProvider {
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly endpoint =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';

  constructor(private readonly cs: ConfigService) {}

  async generateStructuredResponse<T = unknown>(input: AIRequestInput): Promise<AIResponse<T>> {
    const apiKey = this.cs.get<string>('GEMINI_API_KEY') ?? process.env.GEMINI_API_KEY;
    const start = Date.now();

    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY missing — returning stub');
      return {
        output: { stub: true, prompt: input.prompt } as unknown as T,
        raw: '{"stub":true}',
        latencyMs: 0,
      };
    }

    const body = {
      contents: [{ role: 'user', parts: [{ text: input.prompt }] }],
      generationConfig: {
        temperature: input.temperature ?? 0.4,
        maxOutputTokens: input.maxTokens ?? 2048,
        responseMimeType: 'application/json',
      },
    };

    try {
      const { data } = await axios.post(`${this.endpoint}?key=${apiKey}`, body, {
        timeout: 30_000,
      });
      const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
      const parsed = this.tryParse(text);
      return {
        output: parsed as T,
        raw: text,
        latencyMs: Date.now() - start,
        inputTokens: data?.usageMetadata?.promptTokenCount,
        outputTokens: data?.usageMetadata?.candidatesTokenCount,
        finishReason: data?.candidates?.[0]?.finishReason,
      };
    } catch (err) {
      this.logger.error('Gemini error', err as Error);
      throw err;
    }
  }

  generateDebate(input: DebatePrompt): Promise<AIResponse<unknown>> {
    return this.generateStructuredResponse({
      prompt: `You are a debate orchestrator. Produce structured JSON debate for scenario "${input.scenarioName}" given assumptions ${JSON.stringify(input.assumptions)} and baseline ${JSON.stringify(input.baseline)}. Return shape: {researcher, opponent, worstCase, synthesizer, risks: []}.`,
      purpose: 'debate',
    });
  }

  generateForecastInsights(input: ForecastInsightInput): Promise<AIResponse<unknown>> {
    return this.generateStructuredResponse({
      prompt: `Provide qualitative insights on forecast metrics ${JSON.stringify(input.metrics)} for scenario "${input.scenarioName}". JSON: {summary, narrative, callouts: []}.`,
      purpose: 'forecast-insight',
    });
  }

  private tryParse(text: string): unknown {
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  }
}
