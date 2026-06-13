import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AiMeta, AiProvider } from '../interfaces/ai-provider.interface';
import { JIRA_PARSER_PROMPT } from '../prompts/jira-parser.prompt';
import { GIT_PARSER_PROMPT } from '../prompts/git-parser.prompt';
import { HRMS_PARSER_PROMPT } from '../prompts/hrms-parser.prompt';

const TIMEOUT_MS = 15_000;
const MODEL = 'gemini-2.0-flash';

@Injectable()
export class GeminiProvider implements AiProvider {
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly client: GoogleGenerativeAI;

  constructor(private readonly config: ConfigService) {
    const apiKey = config.get<string>('GEMINI_API_KEY') ?? '';
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async parseIngestion(
    source: 'jira' | 'git' | 'hrms',
    sanitisedData: unknown,
    _schema: unknown,
  ): Promise<{ data: unknown; meta: AiMeta }> {
    const systemPrompt =
      source === 'jira' ? JIRA_PARSER_PROMPT : source === 'git' ? GIT_PARSER_PROMPT : HRMS_PARSER_PROMPT;
    const t0 = Date.now();
    const { content, tokensUsed } = await this.call(systemPrompt, JSON.stringify(sanitisedData, null, 2));
    return {
      data: content,
      meta: { mode: 'live', durationMs: Date.now() - t0, tokensUsed, model: MODEL },
    };
  }

  async chat(
    systemPrompt: string,
    userContent: string,
    _responseSchema: unknown,
  ): Promise<{ content: unknown; meta: AiMeta }> {
    const t0 = Date.now();
    const { content, tokensUsed } = await this.call(systemPrompt, userContent);
    return {
      content,
      meta: { mode: 'live', durationMs: Date.now() - t0, tokensUsed, model: MODEL },
    };
  }

  private async call(systemPrompt: string, userContent: string): Promise<{ content: unknown; tokensUsed?: number }> {
    const model = this.client.getGenerativeModel({
      model: MODEL,
      systemInstruction: systemPrompt,
      generationConfig: { responseMimeType: 'application/json' },
    });

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Gemini timed out after ${TIMEOUT_MS}ms`)), TIMEOUT_MS),
    );

    const response = await Promise.race([model.generateContent(userContent), timeout]);
    const text = response.response.text();
    const content: unknown = JSON.parse(text);
    const tokensUsed = response.response.usageMetadata?.totalTokenCount;
    return { content, tokensUsed };
  }
}
