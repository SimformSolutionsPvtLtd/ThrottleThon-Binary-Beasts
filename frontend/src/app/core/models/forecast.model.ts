import { Allocation } from './developer.model';

export interface ForecastInput {
  scenarioIds: string[];
  priorityPressure: number;
  scopePercent: number;
  contingencyBuffer: number;
  allocations: Allocation[];
}

export interface ForecastResult {
  scenarioId: string;
  adjustedEffortPoints: number;
  projectTimelineWeeks: number;
  projectCost: number;
  riskAdjustedCost: number;
  confidenceScore: number;
  breakdown: ForecastBreakdown;
}

export interface ForecastBreakdown {
  baseEffort: number;
  labelMultiplier: number;
  complexityMultiplier: number;
  teamCapacityFactor: number;
  frictionFactor: number;
  priorityPressure: number;
  scopeMultiplier: number;
  contingencyMultiplier: number;
  sprintCapacity: number;
  monthlyTeamCost: number;
}

export interface WinnerInfo {
  scenarioId: string;
  reason: string;
}
