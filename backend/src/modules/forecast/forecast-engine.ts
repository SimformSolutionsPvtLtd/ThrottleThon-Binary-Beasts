// ZERO NestJS imports. ZERO injected services. Pure exported functions only.

export interface ForecastInput {
  scenario: {
    externalId: string;
    baseEffortPoints: number;
    applicableLabels: string[];
  };
  allocations: Array<{
    devPseudonym: string;
    costBand: 'C1' | 'C2' | 'C3' | 'C4' | 'C5';
    allocationPercent: number;
    skills: Array<{ tech: string; proficiency: number }>;
  }>;
  multipliers: {
    labelOverrunMultipliers: Record<string, number>;
    complexityMultipliers: Record<string, number>;
    teamCapacityFactors: {
      seniorRatio: Record<string, number>;
      signalsExperiencePresent: number;
      signalsExperienceAbsent: number;
      domainExpertOnTeam: number;
      noDomainExpert: number;
    };
    costBandMonthlyRates: Record<string, number>;
    sprintCapacityPointsPerDev: number;
    weeksPerSprint: number;
  };
  sliders: {
    priorityPressure: number;
    scopePercent: number;
    contingencyBuffer: number;
  };
  debateOutput: {
    frictionFactor: number;
    confidenceScore: number;
  };
}

export interface ForecastResult {
  scenarioId: string;
  adjustedEffortPoints: number;
  projectTimelineWeeks: number;
  projectCost: number;
  riskAdjustedCost: number;
  confidenceScore: number;
  breakdown: {
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
  };
}

/** Deterministic rounding to 2 decimal places — applied at every intermediate step. */
const r = (x: number): number => Math.round(x * 100) / 100;

function computeLabelMultiplier(labels: string[], lom: Record<string, number>): number {
  if (!labels.length) return 1.0;
  const sum = labels.reduce((acc, l) => acc + (lom[l] ?? 1.0), 0);
  return r(sum / labels.length);
}

function computeComplexityMultiplier(externalId: string, cm: Record<string, number>): number {
  const eid = externalId.toLowerCase();
  let product = 1.0;
  if (eid.includes('full')) {
    product = r(product * (cm['multiMajorVersionJump'] ?? 1.0));
  } else if (eid.includes('interim')) {
    product = r(product * (cm['singleMajorVersionJump'] ?? 1.0));
  }
  product = r(product * (cm['lowTestCoverage'] ?? 1.0));
  product = r(product * (cm['circularDependencyHigh'] ?? 1.0));
  return product;
}

function computeTeamCapacityFactor(
  allocations: ForecastInput['allocations'],
  applicableLabels: string[],
  tcf: ForecastInput['multipliers']['teamCapacityFactors'],
): number {
  if (!allocations.length) return 1.0;

  const totalDevs = allocations.length;
  const seniorDevs = allocations.filter((a) => a.costBand === 'C4' || a.costBand === 'C5').length;
  const seniorRatio = seniorDevs / totalDevs;

  let srFactor: number;
  if (seniorRatio > 0.6) srFactor = tcf.seniorRatio['above60pct'] ?? 1.0;
  else if (seniorRatio >= 0.4) srFactor = tcf.seniorRatio['40to60pct'] ?? 1.0;
  else srFactor = tcf.seniorRatio['below40pct'] ?? 1.0;

  const hasSignals = allocations.some((a) =>
    a.skills.some((s) => s.tech.toLowerCase().includes('angular signals')),
  );
  const signalsFactor = hasSignals ? tcf.signalsExperiencePresent : tcf.signalsExperienceAbsent;

  const hasDomainExpert =
    applicableLabels.length > 0 &&
    allocations.some((a) =>
      a.skills.some((s) =>
        applicableLabels.some((l) => s.tech.toLowerCase().includes(l.toLowerCase())),
      ),
    );
  const domainFactor = hasDomainExpert ? tcf.domainExpertOnTeam : tcf.noDomainExpert;

  let factor = r(srFactor);
  factor = r(factor * r(signalsFactor));
  factor = r(factor * r(domainFactor));
  return factor;
}

export function computeForecast(input: ForecastInput): ForecastResult {
  const { scenario, allocations, multipliers, sliders, debateOutput } = input;

  if (!allocations.length) {
    throw new Error('At least one allocation is required to compute sprint capacity');
  }

  const labelMultiplier = computeLabelMultiplier(
    scenario.applicableLabels,
    multipliers.labelOverrunMultipliers,
  );
  const complexityMultiplier = computeComplexityMultiplier(
    scenario.externalId,
    multipliers.complexityMultipliers,
  );
  const teamCapacityFactor = computeTeamCapacityFactor(
    allocations,
    scenario.applicableLabels,
    multipliers.teamCapacityFactors,
  );

  const scopeMultiplier = r(sliders.scopePercent / 100);
  const contingencyMultiplier = r(1 + sliders.contingencyBuffer);

  // adjustedEffort — multiply each factor in sequence, rounding after each step
  let effort = scenario.baseEffortPoints;
  effort = r(effort * labelMultiplier);
  effort = r(effort * complexityMultiplier);
  effort = r(effort * teamCapacityFactor);
  effort = r(effort * debateOutput.frictionFactor);
  effort = r(effort * sliders.priorityPressure);
  effort = r(effort * scopeMultiplier);
  effort = r(effort * contingencyMultiplier);
  const adjustedEffortPoints = effort;

  // sprintCapacity = sum of each dev's proportional points
  const sprintCapacity = r(
    allocations.reduce(
      (sum, a) => sum + (a.allocationPercent / 100) * multipliers.sprintCapacityPointsPerDev,
      0,
    ),
  );

  if (sprintCapacity <= 0) {
    throw new Error('Sprint capacity is zero — ensure allocation percentages are positive');
  }

  const projectTimelineWeeks = r(r(adjustedEffortPoints / sprintCapacity) * multipliers.weeksPerSprint);

  const monthlyTeamCost = r(
    allocations.reduce((sum, a) => {
      const rate = multipliers.costBandMonthlyRates[a.costBand] ?? 0;
      return sum + r(rate * (a.allocationPercent / 100));
    }, 0),
  );

  const projectCost = r(monthlyTeamCost * r(projectTimelineWeeks / 4.33));

  const riskFactor = r(1 + r((1 - debateOutput.confidenceScore) * 0.5));
  const riskAdjustedCost = r(projectCost * riskFactor);

  return {
    scenarioId: scenario.externalId,
    adjustedEffortPoints,
    projectTimelineWeeks,
    projectCost,
    riskAdjustedCost,
    confidenceScore: debateOutput.confidenceScore,
    breakdown: {
      baseEffort: scenario.baseEffortPoints,
      labelMultiplier,
      complexityMultiplier,
      teamCapacityFactor,
      frictionFactor: debateOutput.frictionFactor,
      priorityPressure: sliders.priorityPressure,
      scopeMultiplier,
      contingencyMultiplier,
      sprintCapacity,
      monthlyTeamCost,
    },
  };
}

export function compareForecasts(
  results: ForecastResult[],
): { winner: { scenarioId: string; reason: string } } {
  if (!results.length) throw new Error('No forecast results to compare');

  const sorted = [...results].sort((a, b) => a.riskAdjustedCost - b.riskAdjustedCost);
  const winner = sorted[0];
  const runnerUp = sorted[1];

  let reason = `Lowest risk-adjusted cost ($${winner.riskAdjustedCost.toFixed(0)})`;
  if (runnerUp) {
    const savings = (runnerUp.riskAdjustedCost - winner.riskAdjustedCost).toFixed(0);
    reason += `, saving $${savings} vs ${runnerUp.scenarioId}`;
  }

  return { winner: { scenarioId: winner.scenarioId, reason } };
}
