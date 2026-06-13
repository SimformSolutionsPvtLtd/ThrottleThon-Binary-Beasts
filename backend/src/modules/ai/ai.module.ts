import { Global, Module } from '@nestjs/common';
import { GeminiProvider } from './providers/gemini.provider';
import { FixtureProvider } from './providers/fixture.provider';
import { AiCacheService } from './ai-cache.service';
import { AiService } from './ai.service';

@Global()
@Module({
  providers: [GeminiProvider, FixtureProvider, AiCacheService, AiService],
  exports: [AiService, AiCacheService],
})
export class AiModule {}
