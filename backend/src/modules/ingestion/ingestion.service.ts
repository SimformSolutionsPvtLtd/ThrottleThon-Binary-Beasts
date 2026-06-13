import { BadRequestException, Injectable } from '@nestjs/common';
import { AiCacheType } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { AiCacheService } from '../ai/ai-cache.service';
import { JiraIngestionSchema } from '../ai/schemas/jira-ingestion.schema';
import { GitIngestionSchema } from '../ai/schemas/git-ingestion.schema';
import { HrmsIngestionSchema } from '../ai/schemas/hrms-ingestion.schema';
import { z } from 'zod';

export const VALID_SOURCES = ['jira', 'git', 'hrms'] as const;
export type IngestionSource = (typeof VALID_SOURCES)[number];

const SCHEMA_MAP: Record<IngestionSource, z.ZodSchema> = {
  jira: JiraIngestionSchema,
  git: GitIngestionSchema,
  hrms: HrmsIngestionSchema,
};

const SOURCE_TO_CACHE_TYPE: Record<IngestionSource, AiCacheType> = {
  jira: AiCacheType.INGESTION_JIRA,
  git: AiCacheType.INGESTION_GIT,
  hrms: AiCacheType.INGESTION_HRMS,
};

@Injectable()
export class IngestionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly aiCacheService: AiCacheService,
  ) {}

  assertValidSource(source: string): asserts source is IngestionSource {
    if (!VALID_SOURCES.includes(source as IngestionSource)) {
      throw new BadRequestException(`Invalid source "${source}". Must be one of: ${VALID_SOURCES.join(', ')}`);
    }
  }

  async ingest(tenantId: string, source: IngestionSource, forceRefresh = false) {
    const rawData = await this.loadRawData(tenantId, source);
    const result = await this.aiService.parseIngestion(tenantId, source, rawData, SCHEMA_MAP[source], forceRefresh);
    return {
      source,
      mode: result.mode,
      cachedAt: result.cachedAt ?? null,
      data: result.data,
    };
  }

  async getParsed(tenantId: string, source: IngestionSource) {
    const cacheKey = `ingestion:${source}`;
    const cached = await this.aiCacheService.get(tenantId, cacheKey);
    if (cached) {
      return { source, mode: 'cached' as const, cachedAt: cached.createdAt, data: cached.data };
    }

    const fixture = await this.aiCacheService.getByType(tenantId, SOURCE_TO_CACHE_TYPE[source]);
    if (fixture) {
      return { source, mode: 'fixture' as const, cachedAt: fixture.createdAt, data: fixture.data };
    }

    return { source, mode: 'fixture' as const, cachedAt: null, data: null };
  }

  async ingestAll(tenantId: string) {
    const [jira, git, hrms] = await Promise.all([
      this.ingest(tenantId, 'jira').catch((e) => ({ source: 'jira', mode: 'error', error: (e as Error).message })),
      this.ingest(tenantId, 'git').catch((e) => ({ source: 'git', mode: 'error', error: (e as Error).message })),
      this.ingest(tenantId, 'hrms').catch((e) => ({ source: 'hrms', mode: 'error', error: (e as Error).message })),
    ]);
    return { jira, git, hrms };
  }

  private async loadRawData(tenantId: string, source: IngestionSource): Promise<unknown> {
    switch (source) {
      case 'jira':
        return this.prisma.jiraTicket.findMany({ where: { tenantId } });
      case 'git':
        return this.prisma.gitRepository.findMany({ where: { tenantId } });
      case 'hrms':
        return this.prisma.developer.findMany({
          where: { tenantId, isActive: true },
          select: {
            pseudonym: true,
            role: true,
            department: true,
            tenureYears: true,
            costBand: true,
            skills: true,
          },
        });
    }
  }
}
