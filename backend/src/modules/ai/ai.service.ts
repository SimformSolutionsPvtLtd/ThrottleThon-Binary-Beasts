import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiCacheType } from '@prisma/client';
import { z } from 'zod';
import { PiiSanitiserService } from '../../common/services/pii-sanitiser.service';
import { AuditLogService } from '../../common/services/audit-log.service';
import { AiMeta } from './interfaces/ai-provider.interface';
import { AiCacheService } from './ai-cache.service';
import { GeminiProvider } from './providers/gemini.provider';
import { FixtureProvider } from './providers/fixture.provider';

const SOURCE_TO_CACHE_TYPE: Record<'jira' | 'git' | 'hrms', AiCacheType> = {
  jira: AiCacheType.INGESTION_JIRA,
  git: AiCacheType.INGESTION_GIT,
  hrms: AiCacheType.INGESTION_HRMS,
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  readonly hasGeminiKey: boolean;

  constructor(
    private readonly config: ConfigService,
    private readonly aiCacheService: AiCacheService,
    private readonly geminiProvider: GeminiProvider,
    private readonly fixtureProvider: FixtureProvider,
    private readonly piiSanitiser: PiiSanitiserService,
    private readonly auditLog: AuditLogService,
  ) {
    this.hasGeminiKey = !!config.get<string>('GEMINI_API_KEY');
  }

  async parseIngestion(
    tenantId: string,
    source: 'jira' | 'git' | 'hrms',
    rawData: unknown,
    schema: z.ZodSchema,
    forceRefresh = false,
  ): Promise<{ data: unknown; mode: AiMeta['mode']; cachedAt?: Date; meta: AiMeta }> {
    const cacheKey = `ingestion:${source}`;
    const cacheType = SOURCE_TO_CACHE_TYPE[source];

    if (!forceRefresh) {
      const cached = await this.aiCacheService.get(tenantId, cacheKey);
      if (cached) {
        return { data: cached.data, mode: 'cached', cachedAt: cached.createdAt, meta: { mode: 'cached', durationMs: 0 } };
      }
    }

    const t0 = Date.now();
    const { sanitisedPayload, report } = await this.piiSanitiser.sanitise(rawData, tenantId);
    await this.auditLog.log({
      tenantId,
      action: 'ai.ingestion.sanitise',
      resource: `ingestion:${source}`,
      details: { source, piiReport: report } as never,
      piiSanitised: true,
    });

    if (this.hasGeminiKey) {
      try {
        const result = await this.geminiProvider.parseIngestion(source, sanitisedPayload, null);
        const validated = schema.parse(result.data);
        await this.aiCacheService.set(tenantId, cacheKey, cacheType, validated);
        await this.auditLog.log({
          tenantId,
          action: 'ai.ingestion.complete',
          resource: `ingestion:${source}`,
          details: { mode: 'live', durationMs: Date.now() - t0, tokensUsed: result.meta.tokensUsed } as never,
          piiSanitised: true,
        });
        return { data: validated, mode: 'live', meta: { ...result.meta, durationMs: Date.now() - t0 } };
      } catch (err) {
        this.logger.warn(`Gemini parseIngestion [${source}] failed: ${(err as Error).message}`);
      }
    }

    const fixture = await this.aiCacheService.getByType(tenantId, cacheType);
    if (fixture) {
      return { data: fixture.data, mode: 'fixture', cachedAt: fixture.createdAt, meta: { mode: 'fixture', durationMs: 0 } };
    }

    const fallback = await this.fixtureProvider.parseIngestion(source, sanitisedPayload, null);
    return { data: fallback.data, mode: 'fixture', meta: fallback.meta };
  }

  async chat(
    tenantId: string,
    systemPrompt: string,
    userContent: string,
    schema: z.ZodSchema = z.any(),
    cacheKey?: string,
  ): Promise<{ content: unknown; meta: AiMeta }> {
    if (cacheKey) {
      const cached = await this.aiCacheService.get(tenantId, cacheKey);
      if (cached) return { content: cached.data, meta: { mode: 'cached', durationMs: 0 } };
    }

    if (this.hasGeminiKey) {
      try {
        const result = await this.geminiProvider.chat(systemPrompt, userContent, null);
        const validated = schema.parse(result.content);
        if (cacheKey) {
          await this.aiCacheService.set(tenantId, cacheKey, AiCacheType.DEBATE, validated);
        }
        return { content: validated, meta: result.meta };
      } catch (err) {
        this.logger.warn(`Gemini chat failed: ${(err as Error).message}`);
      }
    }

    return this.fixtureProvider.chat(systemPrompt, userContent, null);
  }
}
