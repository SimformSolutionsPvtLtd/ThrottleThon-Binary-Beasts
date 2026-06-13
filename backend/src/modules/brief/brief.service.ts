import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ForecastService } from '../forecast/forecast.service';
import { AuthUser } from '../../common/types/auth-user';
import { Permissions } from '../../common/constants/permissions';
import { BriefRequestDto } from './dto/brief-request.dto';

const SEVERITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

@Injectable()
export class BriefService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly forecastService: ForecastService,
  ) {}

  async generate(tenantId: string, dto: BriefRequestDto, user: AuthUser) {
    const { scenarioExternalId, includeRealNames = false } = dto;

    if (includeRealNames && !user.permissions.includes(Permissions.IDENTITY_MAP_READ)) {
      throw new ForbiddenException('identity-map:read permission is required to include real names');
    }

    const [tenant, scenario, latestDebate] = await Promise.all([
      this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true, brandName: true, logoUrl: true } }),
      this.prisma.scenario.findUnique({
        where: { tenantId_externalId: { tenantId, externalId: scenarioExternalId } },
      }),
      this.prisma.debateResult.findFirst({
        where: { tenantId, scenarioExternalId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    if (!scenario) throw new NotFoundException(`Scenario '${scenarioExternalId}' not found`);
    if (!tenant) throw new NotFoundException('Tenant not found');

    const forecast = await this.forecastService.computeScenarioForecast(tenantId, scenarioExternalId);

    const dbAllocations = await this.prisma.allocation.findMany({
      where: { tenantId, scenarioExternalId },
    });

    const teamMembers = await Promise.all(
      dbAllocations.map(async (alloc) => {
        const dev = await this.prisma.developer.findUnique({
          where: { tenantId_pseudonym: { tenantId, pseudonym: alloc.devPseudonym } },
        });

        const skills = this.extractTopSkills(dev?.skills, 3);

        const member: Record<string, unknown> = {
          pseudonym: alloc.devPseudonym,
          role: dev?.role ?? 'Unknown',
          costBand: dev?.costBand ?? 'C3',
          allocationPercent: alloc.allocationPercent,
          topSkills: skills,
        };

        if (includeRealNames) {
          const idMap = await this.prisma.pseudonymMap.findUnique({
            where: { tenantId_pseudonym: { tenantId, pseudonym: alloc.devPseudonym } },
            select: { realName: true },
          });
          member['realName'] = idMap?.realName ?? alloc.devPseudonym;
        }

        return member;
      }),
    );

    const risks = latestDebate
      ? this.extractTopRisks(latestDebate.keyRisks, 5)
      : [];

    const debateSummary = latestDebate
      ? this.synthesizeDebateSummary(latestDebate.debateLog)
      : 'No debate run yet';

    const recommendation = await this.buildRecommendation(tenantId, scenarioExternalId);

    return {
      generatedAt: new Date().toISOString(),
      tenant: { name: tenant.name, brandName: tenant.brandName, logoUrl: tenant.logoUrl },
      scenario: {
        name: scenario.name,
        description: scenario.description,
        category: scenario.category,
        externalId: scenario.externalId,
      },
      forecast: forecast
        ? {
            timelineWeeks: forecast.projectTimelineWeeks,
            projectCost: forecast.projectCost,
            riskAdjustedCost: forecast.riskAdjustedCost,
            confidenceScore: forecast.confidenceScore,
            frictionFactor: latestDebate?.frictionFactor ?? 1.0,
            breakdown: forecast.breakdown,
          }
        : null,
      team: teamMembers,
      risks,
      debateSummary,
      recommendation,
    };
  }

  private extractTopSkills(raw: unknown, limit: number): string[] {
    if (!raw || !Array.isArray(raw)) return [];
    return raw
      .map((s) => (typeof s === 'string' ? s : typeof s === 'object' && s !== null && 'tech' in s ? String((s as Record<string, unknown>)['tech']) : null))
      .filter((s): s is string => s !== null)
      .slice(0, limit);
  }

  private extractTopRisks(raw: unknown, limit: number): unknown[] {
    if (!raw || !Array.isArray(raw)) return [];
    return [...raw]
      .sort((a, b) => {
        const aS = (SEVERITY_ORDER[(a as Record<string, string>)['severity']] ?? 99);
        const bS = (SEVERITY_ORDER[(b as Record<string, string>)['severity']] ?? 99);
        return aS - bS;
      })
      .slice(0, limit);
  }

  private synthesizeDebateSummary(raw: unknown): string {
    if (!raw || !Array.isArray(raw)) return 'Debate completed — no log available';
    const synthEntry = (raw as Array<Record<string, unknown>>).find(
      (e) => typeof e['agent'] === 'string' && e['agent'].toLowerCase().includes('synthesizer'),
    );
    if (synthEntry && typeof synthEntry['argument'] === 'string') return synthEntry['argument'];
    const last = (raw as Array<Record<string, unknown>>).at(-1);
    if (last && typeof last['argument'] === 'string') return last['argument'];
    return 'Debate completed';
  }

  private async buildRecommendation(
    tenantId: string,
    currentScenarioId: string,
  ): Promise<{ scenarioId: string; reason: string } | null> {
    const allScenarios = await this.prisma.scenario.findMany({
      where: { tenantId, isActive: true },
      select: { externalId: true },
    });
    if (allScenarios.length < 2) return null;

    const forecasts = await Promise.all(
      allScenarios.map(async (s) => {
        const f = await this.forecastService.computeScenarioForecast(tenantId, s.externalId);
        return f ? { scenarioId: s.externalId, cost: f.riskAdjustedCost } : null;
      }),
    );

    const valid = forecasts.filter((f): f is { scenarioId: string; cost: number } => f !== null);
    if (valid.length < 2) return null;

    const winner = valid.reduce((a, b) => (a.cost <= b.cost ? a : b));
    const runnerUp = valid.filter((f) => f.scenarioId !== winner.scenarioId)[0];
    const savings = runnerUp ? ` (saves $${(runnerUp.cost - winner.cost).toFixed(0)} vs ${runnerUp.scenarioId})` : '';

    return {
      scenarioId: winner.scenarioId,
      reason: `Lowest risk-adjusted cost at $${winner.cost.toFixed(0)}${savings}`,
    };
  }
}
