import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AI_PROVIDER } from './providers/ai-provider.token';
import { GeminiProvider } from './providers/gemini.provider';
import { OpenAIProvider } from './providers/openai.provider';
import { AIService } from './ai.service';

@Module({
  providers: [
    GeminiProvider,
    OpenAIProvider,
    {
      provide: AI_PROVIDER,
      inject: [ConfigService, GeminiProvider, OpenAIProvider],
      useFactory: (cs: ConfigService, gemini: GeminiProvider, openai: OpenAIProvider) => {
        const which = cs.get<string>('AI_PROVIDER') ?? process.env.AI_PROVIDER ?? 'gemini';
        return which === 'openai' ? openai : gemini;
      },
    },
    AIService,
  ],
  exports: [AIService, AI_PROVIDER],
})
export class AiModule {}
