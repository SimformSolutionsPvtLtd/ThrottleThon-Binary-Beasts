import { Injectable } from '@nestjs/common';
import { CostCalculator, DeveloperCost } from './cost-calculator';
import { TimelineCalculator, TimelineInput } from './timeline-calculator';
import { RiskMultiplierEngine, RiskFactors } from './risk-multiplier.engine';

export interface ScenarioComputeInput {
  developers: DeveloperCost[];
  timeline: TimelineInput;
  risk: RiskFactors;
}

export interface ScenarioComputeResult {
  timelineDays: number;
  cost: number;
  riskAdjustedCost: number;
  riskMultiplier: number;
  confidence: number;
  breakdown: {
    perDeveloper: number[];
    contingencyPct: number;
  };
}

@Injectable()
export class ScenarioEngine {
  constructor(
    private readonly cost: CostCalculator,
    private readonly timeline: TimelineCalculator,
    private readonly risk: RiskMultiplierEngine,
  ) {}

  compute(input: ScenarioComputeInput): ScenarioComputeResult {
    const timelineDays = this.timeline.estimateDays(input.timeline);
    const baseCost = this.cost.total(input.developers);
    const multiplier = this.risk.multiplier(input.risk);
    const riskAdjustedCost = Math.round(baseCost * multiplier * 100) / 100;
    const confidence = Math.max(0.5, Math.min(0.99, 1 / multiplier));

    return {
      timelineDays,
      cost: baseCost,
      riskAdjustedCost,
      riskMultiplier: multiplier,
      confidence: Math.round(confidence * 1000) / 1000,
      breakdown: {
        perDeveloper: input.developers.map((d) => this.cost.forDeveloper(d)),
        contingencyPct: input.risk.contingencyPct ?? 0.1,
      },
    };
  }
}
