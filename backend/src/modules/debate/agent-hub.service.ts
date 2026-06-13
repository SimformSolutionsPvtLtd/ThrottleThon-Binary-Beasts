import { Injectable, Logger } from '@nestjs/common';
import { AiCacheType } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { AiCacheService } from '../ai/ai-cache.service';
import { DebateResultSchema, DebateResultOutput } from '../ai/schemas/debate-result.schema';
import { RESEARCHER_PROMPT } from '../ai/prompts/researcher.prompt';
import { OPPOSER_PROMPT } from '../ai/prompts/opposer.prompt';
import { WORST_CASE_PROMPT } from '../ai/prompts/worst-case.prompt';
import { SYNTHESIZER_PROMPT } from '../ai/prompts/synthesizer.prompt';
import { z } from 'zod';

interface AgentRound {
  agent: string;
  prompt: string;
  position?: string;
  argument?: string;
  evidenceCited?: string[];
}

@Injectable()
export class AgentHubService {
  private readonly logger = new Logger(AgentHubService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly aiCacheService: AiCacheService,
  ) {}

  async runDebate(
    tenantId: string,
    scenarioExternalId: string,
  ): Promise<{ result: DebateResultOutput; meta: { mode: string; totalDurationMs: number; roundsCompleted: number } }> {
    const t0 = Date.now();
    const evidence = await this.buildEvidence(tenantId, scenarioExternalId);
    const evidenceStr = JSON.stringify(evidence, null, 2);

    let r1FailCount = 0;
    const round1: AgentRound[] = [];

    // Round 1 — sequential
    const r1Researcher = await this.callAgent(tenantId, RESEARCHER_PROMPT, `Evidence:\n${evidenceStr}`)
      .catch(() => { r1FailCount++; return null; });
    if (r1FailCount > 2) return this.fixtureResult(tenantId, Date.now() - t0);
    if (r1Researcher) round1.push({ agent: 'Researcher', prompt: RESEARCHER_PROMPT, ...r1Researcher });

    const r1Opposer = await this.callAgent(
      tenantId,
      OPPOSER_PROMPT,
      `Evidence:\n${evidenceStr}\n\nResearcher Analysis (R1):\n${JSON.stringify(r1Researcher)}`,
    ).catch(() => { r1FailCount++; return null; });
    if (r1FailCount > 2) return this.fixtureResult(tenantId, Date.now() - t0);
    if (r1Opposer) round1.push({ agent: 'Opposer', prompt: OPPOSER_PROMPT, ...r1Opposer });

    const r1WorstCase = await this.callAgent(
      tenantId,
      WORST_CASE_PROMPT,
      `Evidence:\n${evidenceStr}\n\nResearcher Analysis (R1):\n${JSON.stringify(r1Researcher)}\n\nOpposer Analysis (R1):\n${JSON.stringify(r1Opposer)}`,
    ).catch(() => { r1FailCount++; return null; });
    if (r1FailCount > 2) return this.fixtureResult(tenantId, Date.now() - t0);
    if (r1WorstCase) round1.push({ agent: 'WorstCase', prompt: WORST_CASE_PROMPT, ...r1WorstCase });

    const fullR1Str = JSON.stringify({ researcher: r1Researcher, opposer: r1Opposer, worstCase: r1WorstCase });

    // Round 2 — if any fail, synthesizer uses R1 only
    let roundsCompleted = 1;
    let round2Str = '';

    try {
      const r2Researcher = await this.callAgent(
        tenantId,
        RESEARCHER_PROMPT,
        `Evidence:\n${evidenceStr}\n\nRound 1 Debate:\n${fullR1Str}`,
      );

      const r2Opposer = await this.callAgent(
        tenantId,
        OPPOSER_PROMPT,
        `Evidence:\n${evidenceStr}\n\nRound 1 Debate:\n${fullR1Str}\n\nResearcher Analysis (R2):\n${JSON.stringify(r2Researcher)}`,
      );

      const r2WorstCase = await this.callAgent(
        tenantId,
        WORST_CASE_PROMPT,
        `Evidence:\n${evidenceStr}\n\nRound 1 Debate:\n${fullR1Str}\n\nResearcher Analysis (R2):\n${JSON.stringify(r2Researcher)}\n\nOpposer Analysis (R2):\n${JSON.stringify(r2Opposer)}`,
      );

      round2Str = JSON.stringify({ researcher: r2Researcher, opposer: r2Opposer, worstCase: r2WorstCase });
      roundsCompleted = 2;
    } catch (err) {
      this.logger.warn(`Round 2 incomplete, synthesizing from R1 only: ${(err as Error).message}`);
    }

    // Synthesis
    const synthContext = [
      `Evidence:\n${evidenceStr}`,
      `Round 1 Debate:\n${fullR1Str}`,
      roundsCompleted === 2 ? `Round 2 Debate:\n${round2Str}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    const synthResult = await this.aiService.chat(
      tenantId,
      SYNTHESIZER_PROMPT,
      synthContext,
      DebateResultSchema,
    );

    const result = synthResult.content as DebateResultOutput;
    const mode = synthResult.meta.mode;

    return {
      result,
      meta: { mode, totalDurationMs: Date.now() - t0, roundsCompleted },
    };
  }

  private async callAgent(tenantId: string, systemPrompt: string, userContent: string): Promise<Record<string, unknown>> {
    const result = await this.aiService.chat(tenantId, systemPrompt, userContent, z.record(z.unknown()));
    return result.content as Record<string, unknown>;
  }

  private async buildEvidence(tenantId: string, scenarioExternalId: string): Promise<Record<string, unknown>> {
    const [scenario, jiraData, gitData, hrmsData] = await Promise.all([
      this.prisma.scenario.findUnique({
        where: { tenantId_externalId: { tenantId, externalId: scenarioExternalId } },
      }),
      this.aiCacheService.getByType(tenantId, AiCacheType.INGESTION_JIRA),
      this.aiCacheService.getByType(tenantId, AiCacheType.INGESTION_GIT),
      this.aiCacheService.getByType(tenantId, AiCacheType.INGESTION_HRMS),
    ]);

    return {
      scenario: scenario ?? { externalId: scenarioExternalId },
      jiraAnalysis: jiraData?.data ?? null,
      gitAnalysis: gitData?.data ?? null,
      hrmsAnalysis: hrmsData?.data ?? null,
    };
  }

  private async fixtureResult(
    tenantId: string,
    totalDurationMs: number,
  ): Promise<{ result: DebateResultOutput; meta: { mode: string; totalDurationMs: number; roundsCompleted: number } }> {
    const fixtureChat = await this.aiService.chat(tenantId, SYNTHESIZER_PROMPT, 'Return fixture debate result', DebateResultSchema);
    return {
      result: fixtureChat.content as DebateResultOutput,
      meta: { mode: 'fixture', totalDurationMs, roundsCompleted: 0 },
    };
  }
}
