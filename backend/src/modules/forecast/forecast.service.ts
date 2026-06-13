import { Injectable, NotFoundException } from '@nestjs/common';
import { Forecast } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ScenarioEngine } from './engines/scenario.engine';
import { RunForecastDto } from './dto/run-forecast.dto';

@Injectable()
export class ForecastService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly engine: ScenarioEngine,
  ) {}

  async run(dto: RunForecastDto): Promise<Forecast> {
    const scenario = await this.prisma.scenario.findUnique({
      where: { id: dto.scenarioId },
      include: { allocations: { include: { developer: true } } },
    });
    if (!scenario) throw new NotFoundException(`Scenario ${dto.scenarioId} not found`);

    const assumptions = (scenario.assumptions ?? {}) as Record<string, number>;
    const durationDays = computeDuration(scenario.allocations);

    const developers = scenario.allocations.map((a) => ({
      hourlyRate: a.developer.hourlyRate,
      allocationPercent: a.allocationPercent,
      durationDays,
    }));

    const result = this.engine.compute({
      developers,
      timeline: {
        scopeStoryPoints: assumptions.scopeStoryPoints ?? 200,
        velocityPerSprint: assumptions.velocityPerSprint ?? 30,
        sprintLengthDays: assumptions.sprintLengthDays ?? 14,
        parallelTeams: assumptions.parallelTeams ?? 1,
      },
      risk: {
        contingencyPct: assumptions.contingencyPct ?? 0.15,
        unknowns: assumptions.unknowns,
        externalDependencies: assumptions.externalDependencies,
        teamChurn: assumptions.teamChurn,
        regulatoryComplexity: assumptions.regulatoryComplexity,
      },
    });

    return this.prisma.forecast.create({
      data: {
        scenarioId: scenario.id,
        timelineDays: result.timelineDays,
        cost: result.cost,
        riskAdjustedCost: result.riskAdjustedCost,
        confidence: result.confidence,
        breakdown: result.breakdown,
      },
    });
  }
}

function computeDuration(allocations: { startDate: Date; endDate: Date }[]): number {
  if (!allocations.length) return 0;
  const start = Math.min(...allocations.map((a) => a.startDate.getTime()));
  const end = Math.max(...allocations.map((a) => a.endDate.getTime()));
  return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
}
