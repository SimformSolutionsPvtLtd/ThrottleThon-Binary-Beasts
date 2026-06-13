import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { Developer } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import {
  ForecastInput,
  ForecastResult,
  computeForecast,
  compareForecasts,
} from './forecast-engine';
import { ForecastRequestDto } from './dto/forecast-request.dto';

const DEFAULT_MULTIPLIERS: ForecastInput['multipliers'] = {
  labelOverrunMultipliers: {
    frontend: 1.15,
    backend: 1.05,
    angular: 1.25,
    migration: 1.3,
    devops: 1.1,
    qa: 1.05,
  },
  complexityMultipliers: {
    multiMajorVersionJump: 1.4,
    singleMajorVersionJump: 1.2,
    lowTestCoverage: 1.15,
    circularDependencyHigh: 1.1,
  },
  teamCapacityFactors: {
    seniorRatio: { above60pct: 0.85, '40to60pct': 1.0, below40pct: 1.15 },
    signalsExperiencePresent: 0.9,
    signalsExperienceAbsent: 1.1,
    domainExpertOnTeam: 0.9,
    noDomainExpert: 1.1,
  },
  costBandMonthlyRates: { C1: 4000, C2: 6500, C3: 9500, C4: 13000, C5: 17500 },
  sprintCapacityPointsPerDev: 10,
  weeksPerSprint: 2,
};

@Injectable()
export class ForecastService implements OnModuleInit {
  private readonly logger = new Logger(ForecastService.name);
  private multiplierCache = new Map<string, ForecastInput['multipliers']>();
  private devCache = new Map<string, Developer[]>();

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      const [configs, devs] = await Promise.all([
        this.prisma.multiplierConfig.findMany({ where: { isActive: true } }),
        this.prisma.developer.findMany({ where: { isActive: true } }),
      ]);

      for (const cfg of configs) {
        this.multiplierCache.set(cfg.tenantId, this.buildMultipliers(cfg.config));
      }

      for (const dev of devs) {
        const arr = this.devCache.get(dev.tenantId) ?? [];
        arr.push(dev);
        this.devCache.set(dev.tenantId, arr);
      }

      this.logger.log(`Loaded multiplier configs for ${configs.length} tenant(s)`);
    } catch (e) {
      this.logger.warn(`Could not pre-load forecast cache on init: ${(e as Error).message}`);
    }
  }

  async invalidateCache(tenantId: string): Promise<void> {
    const [cfg, devs] = await Promise.all([
      this.prisma.multiplierConfig.findFirst({
        where: { tenantId, isActive: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.developer.findMany({ where: { tenantId, isActive: true } }),
    ]);

    if (cfg) this.multiplierCache.set(tenantId, this.buildMultipliers(cfg.config));
    this.devCache.set(tenantId, devs);
  }

  async runForecast(
    tenantId: string,
    dto: ForecastRequestDto,
  ): Promise<{ results: ForecastResult[]; winner: { scenarioId: string; reason: string } }> {
    const multipliers = await this.getMultipliers(tenantId);
    const results: ForecastResult[] = [];

    for (const scenarioExternalId of dto.scenarioIds) {
      const [scenario, debateResult] = await Promise.all([
        this.prisma.scenario.findUnique({
          where: { tenantId_externalId: { tenantId, externalId: scenarioExternalId } },
        }),
        this.prisma.debateResult.findFirst({
          where: { tenantId, scenarioExternalId },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      if (!scenario) throw new NotFoundException(`Scenario '${scenarioExternalId}' not found`);

      const scenarioAllocations = dto.allocations.filter(
        (a) => a.scenarioExternalId === scenarioExternalId,
      );

      const allocationsWithDevData = await Promise.all(
        scenarioAllocations.map(async (a) => {
          const dev = await this.lookupDev(tenantId, a.devPseudonym);
          return {
            devPseudonym: a.devPseudonym,
            costBand: (dev?.costBand ?? 'C3') as ForecastInput['allocations'][number]['costBand'],
            allocationPercent: a.allocationPercent,
            skills: this.normalizeSkills(dev?.skills),
          };
        }),
      );

      const config = (scenario.config ?? {}) as Record<string, unknown>;
      const applicableLabels = (config['applicableLabels'] as string[] | undefined) ?? [];

      const forecastInput: ForecastInput = {
        scenario: {
          externalId: scenarioExternalId,
          baseEffortPoints: scenario.baseEffortPoints,
          applicableLabels,
        },
        allocations: allocationsWithDevData,
        multipliers,
        sliders: {
          priorityPressure: dto.priorityPressure,
          scopePercent: dto.scopePercent,
          contingencyBuffer: dto.contingencyBuffer,
        },
        debateOutput: {
          frictionFactor: debateResult?.frictionFactor ?? 1.0,
          confidenceScore: debateResult?.confidenceScore ?? 0.8,
        },
      };

      try {
        results.push(computeForecast(forecastInput));
      } catch (e) {
        throw new BadRequestException(
          `Forecast failed for '${scenarioExternalId}': ${(e as Error).message}`,
        );
      }
    }

    const { winner } = compareForecasts(results);
    return { results, winner };
  }

  /** Compute a forecast for a scenario using its current DB allocations + default sliders. */
  async computeScenarioForecast(
    tenantId: string,
    scenarioExternalId: string,
  ): Promise<ForecastResult | null> {
    const [scenario, dbAllocations, debateResult] = await Promise.all([
      this.prisma.scenario.findUnique({
        where: { tenantId_externalId: { tenantId, externalId: scenarioExternalId } },
      }),
      this.prisma.allocation.findMany({ where: { tenantId, scenarioExternalId } }),
      this.prisma.debateResult.findFirst({
        where: { tenantId, scenarioExternalId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    if (!scenario || !dbAllocations.length) return null;

    const multipliers = await this.getMultipliers(tenantId);

    const allocationsWithDevData = await Promise.all(
      dbAllocations.map(async (a) => {
        const dev = await this.lookupDev(tenantId, a.devPseudonym);
        return {
          devPseudonym: a.devPseudonym,
          costBand: (dev?.costBand ?? 'C3') as ForecastInput['allocations'][number]['costBand'],
          allocationPercent: a.allocationPercent,
          skills: this.normalizeSkills(dev?.skills),
        };
      }),
    );

    const config = (scenario.config ?? {}) as Record<string, unknown>;
    const applicableLabels = (config['applicableLabels'] as string[] | undefined) ?? [];

    const forecastInput: ForecastInput = {
      scenario: {
        externalId: scenarioExternalId,
        baseEffortPoints: scenario.baseEffortPoints,
        applicableLabels,
      },
      allocations: allocationsWithDevData,
      multipliers,
      sliders: { priorityPressure: 1.0, scopePercent: 100, contingencyBuffer: 0.15 },
      debateOutput: {
        frictionFactor: debateResult?.frictionFactor ?? 1.0,
        confidenceScore: debateResult?.confidenceScore ?? 0.8,
      },
    };

    try {
      return computeForecast(forecastInput);
    } catch {
      return null;
    }
  }

  private async getMultipliers(tenantId: string): Promise<ForecastInput['multipliers']> {
    if (this.multiplierCache.has(tenantId)) {
      return this.multiplierCache.get(tenantId)!;
    }

    const cfg = await this.prisma.multiplierConfig.findFirst({
      where: { tenantId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    const built = this.buildMultipliers(cfg?.config ?? null);
    this.multiplierCache.set(tenantId, built);
    return built;
  }

  private buildMultipliers(raw: unknown): ForecastInput['multipliers'] {
    const cfg = (raw ?? {}) as Record<string, unknown>;
    return {
      labelOverrunMultipliers:
        (cfg['labelOverrunMultipliers'] as Record<string, number>) ??
        DEFAULT_MULTIPLIERS.labelOverrunMultipliers,
      complexityMultipliers:
        (cfg['complexityMultipliers'] as Record<string, number>) ??
        DEFAULT_MULTIPLIERS.complexityMultipliers,
      teamCapacityFactors:
        (cfg['teamCapacityFactors'] as ForecastInput['multipliers']['teamCapacityFactors']) ??
        DEFAULT_MULTIPLIERS.teamCapacityFactors,
      costBandMonthlyRates:
        (cfg['costBandMonthlyRates'] as Record<string, number>) ??
        DEFAULT_MULTIPLIERS.costBandMonthlyRates,
      sprintCapacityPointsPerDev:
        typeof cfg['sprintCapacityPointsPerDev'] === 'number'
          ? cfg['sprintCapacityPointsPerDev']
          : DEFAULT_MULTIPLIERS.sprintCapacityPointsPerDev,
      weeksPerSprint:
        typeof cfg['weeksPerSprint'] === 'number'
          ? cfg['weeksPerSprint']
          : DEFAULT_MULTIPLIERS.weeksPerSprint,
    };
  }

  private async lookupDev(tenantId: string, pseudonym: string): Promise<Developer | undefined> {
    const cached = (this.devCache.get(tenantId) ?? []).find((d) => d.pseudonym === pseudonym);
    if (cached) return cached;

    const dev = await this.prisma.developer.findUnique({
      where: { tenantId_pseudonym: { tenantId, pseudonym } },
    });
    if (dev) {
      const arr = this.devCache.get(tenantId) ?? [];
      arr.push(dev);
      this.devCache.set(tenantId, arr);
    }
    return dev ?? undefined;
  }

  private normalizeSkills(raw: unknown): Array<{ tech: string; proficiency: number }> {
    if (!raw || !Array.isArray(raw)) return [];
    return raw.map((s) => {
      if (typeof s === 'string') return { tech: s, proficiency: 3 };
      if (typeof s === 'object' && s !== null && 'tech' in s) {
        const obj = s as Record<string, unknown>;
        return { tech: String(obj['tech']), proficiency: Number(obj['proficiency'] ?? 3) };
      }
      return { tech: String(s), proficiency: 3 };
    });
  }
}
