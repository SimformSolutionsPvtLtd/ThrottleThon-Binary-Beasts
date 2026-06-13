import { computeForecast, compareForecasts, ForecastInput } from './forecast-engine';

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const M: ForecastInput['multipliers'] = {
  labelOverrunMultipliers: { frontend: 1.15, backend: 1.05, angular: 1.25 },
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

const BASE_SCENARIO: ForecastInput['scenario'] = {
  externalId: 'test-scenario',
  baseEffortPoints: 100,
  applicableLabels: ['frontend'],
};

const DEV_C3: ForecastInput['allocations'][number] = {
  devPseudonym: 'DEV_01',
  costBand: 'C3',
  allocationPercent: 100,
  skills: [{ tech: 'typescript', proficiency: 4 }],
};

const BASE_SLIDERS: ForecastInput['sliders'] = {
  priorityPressure: 1.0,
  scopePercent: 100,
  contingencyBuffer: 0.15,
};

const BASE_DEBATE: ForecastInput['debateOutput'] = {
  frictionFactor: 1.0,
  confidenceScore: 0.8,
};

function makeInput(overrides: Partial<ForecastInput> = {}): ForecastInput {
  return {
    scenario: BASE_SCENARIO,
    allocations: [DEV_C3],
    multipliers: M,
    sliders: BASE_SLIDERS,
    debateOutput: BASE_DEBATE,
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('forecast-engine — determinism & correctness', () => {
  // 1. Determinism: same input → identical result across 100 runs
  it('1: same inputs produce bit-identical output across 100 iterations', () => {
    const input = makeInput();
    const results = Array.from({ length: 100 }, () => computeForecast(input));
    const canonical = JSON.stringify(results[0]);
    expect(results.every((r) => JSON.stringify(r) === canonical)).toBe(true);
  });

  // 2. Determinism: different base values still fully deterministic
  it('2: determinism holds with different base values (100 iterations)', () => {
    const input = makeInput({
      scenario: { externalId: 'angular-migration-full', baseEffortPoints: 540, applicableLabels: ['angular', 'frontend'] },
      debateOutput: { frictionFactor: 0.62, confidenceScore: 0.71 },
    });
    const results = Array.from({ length: 100 }, () => computeForecast(input));
    const canonical = JSON.stringify(results[0]);
    expect(results.every((r) => JSON.stringify(r) === canonical)).toBe(true);
  });

  // 3. Zero allocations → graceful error, not NaN/Infinity
  it('3: zero allocations → throws an Error (not NaN or Infinity)', () => {
    expect(() => computeForecast(makeInput({ allocations: [] }))).toThrow(
      /allocation/i,
    );
  });

  // 4. Single dev at 100% → positive finite values
  it('4: single dev at 100% → all output values are positive and finite', () => {
    const result = computeForecast(makeInput());
    expect(isFinite(result.adjustedEffortPoints)).toBe(true);
    expect(result.adjustedEffortPoints).toBeGreaterThan(0);
    expect(isFinite(result.projectTimelineWeeks)).toBe(true);
    expect(result.projectTimelineWeeks).toBeGreaterThan(0);
    expect(isFinite(result.projectCost)).toBe(true);
    expect(result.projectCost).toBeGreaterThan(0);
    expect(isFinite(result.riskAdjustedCost)).toBe(true);
    expect(result.riskAdjustedCost).toBeGreaterThan(0);
  });

  // 5. All devs at 100% → minimum timeline (more capacity = shorter)
  it('5: five devs at 100% each → shorter timeline than one dev at 100%', () => {
    const oneDevResult = computeForecast(makeInput());
    const fiveDevs: ForecastInput['allocations'] = Array.from({ length: 5 }, (_, i) => ({
      devPseudonym: `DEV_0${i + 1}`,
      costBand: 'C3' as const,
      allocationPercent: 100,
      skills: [{ tech: 'typescript', proficiency: 4 }],
    }));
    const fiveDevsResult = computeForecast(makeInput({ allocations: fiveDevs }));
    expect(fiveDevsResult.projectTimelineWeeks).toBeLessThan(oneDevResult.projectTimelineWeeks);
  });

  // 6. contingencyBuffer=0 → riskAdjustedCost depends on confidence only
  it('6: contingencyBuffer=0 → adjustedEffort has no contingency uplift', () => {
    const withBuffer = computeForecast(makeInput({ sliders: { ...BASE_SLIDERS, contingencyBuffer: 0.15 } }));
    const withZero = computeForecast(makeInput({ sliders: { ...BASE_SLIDERS, contingencyBuffer: 0 } }));
    // effort with buffer > effort without buffer
    expect(withBuffer.adjustedEffortPoints).toBeGreaterThan(withZero.adjustedEffortPoints);
    // riskAdjustedCost with 0 contingency = projectCost × (1 + (1 - 0.8) × 0.5) = × 1.1
    const expectedRisk = Math.round(withZero.projectCost * 1.1 * 100) / 100;
    expect(withZero.riskAdjustedCost).toBeCloseTo(expectedRisk, 0);
  });

  // 7. priorityPressure=2.0 → doubles adjustedEffort vs 1.0
  it('7: priorityPressure=2.0 → adjustedEffortPoints ≈ 2× that of priorityPressure=1.0', () => {
    const base = computeForecast(makeInput({ sliders: { ...BASE_SLIDERS, priorityPressure: 1.0 } }));
    const doubled = computeForecast(makeInput({ sliders: { ...BASE_SLIDERS, priorityPressure: 2.0 } }));
    const ratio = doubled.adjustedEffortPoints / base.adjustedEffortPoints;
    expect(Math.abs(ratio - 2.0)).toBeLessThan(0.02);
  });

  // 8. scopePercent=50 → halves adjustedEffort vs 100
  it('8: scopePercent=50 → adjustedEffortPoints ≈ ½ of scopePercent=100', () => {
    const full = computeForecast(makeInput({ sliders: { ...BASE_SLIDERS, scopePercent: 100 } }));
    const half = computeForecast(makeInput({ sliders: { ...BASE_SLIDERS, scopePercent: 50 } }));
    const ratio = half.adjustedEffortPoints / full.adjustedEffortPoints;
    expect(Math.abs(ratio - 0.5)).toBeLessThan(0.02);
  });

  // 9. frictionFactor=1.0 → same as baseline (no friction distortion)
  it('9: frictionFactor=1.0 → adjustedEffort equals base (no friction penalty)', () => {
    const noFriction = computeForecast(makeInput({ debateOutput: { frictionFactor: 1.0, confidenceScore: 0.8 } }));
    const withFriction = computeForecast(makeInput({ debateOutput: { frictionFactor: 1.5, confidenceScore: 0.8 } }));
    // noFriction should be lower than withFriction
    expect(noFriction.adjustedEffortPoints).toBeLessThan(withFriction.adjustedEffortPoints);
    // And frictionFactor 1.0 means the multiplier is neutral
    expect(noFriction.breakdown.frictionFactor).toBe(1.0);
  });

  // 10. frictionFactor=2.1 → adjustedEffort ≈ 2.1× that of frictionFactor=1.0
  it('10: frictionFactor=2.1 → adjustedEffortPoints ≈ 2.1× baseline', () => {
    const base = computeForecast(makeInput({ debateOutput: { frictionFactor: 1.0, confidenceScore: 0.8 } }));
    const high = computeForecast(makeInput({ debateOutput: { frictionFactor: 2.1, confidenceScore: 0.8 } }));
    const ratio = high.adjustedEffortPoints / base.adjustedEffortPoints;
    expect(Math.abs(ratio - 2.1)).toBeLessThan(0.05);
  });

  // 11. All C5 devs cost more than all C1 (C5 is senior → shorter timeline but 4× rate)
  it('11: all-C5 team has higher projectCost than all-C1 team (rate dominates over efficiency)', () => {
    const c1Dev: ForecastInput['allocations'][number] = { devPseudonym: 'D1', costBand: 'C1', allocationPercent: 100, skills: [] };
    const c5Dev: ForecastInput['allocations'][number] = { devPseudonym: 'D1', costBand: 'C5', allocationPercent: 100, skills: [] };
    const c1Result = computeForecast(makeInput({ allocations: [c1Dev] }));
    const c5Result = computeForecast(makeInput({ allocations: [c5Dev] }));
    // C5 has a better seniorRatio → shorter timeline due to lower teamCapacityFactor
    // But C5 rate ($17,500/mo) >> C1 rate ($4,000/mo), so projectCost is still higher
    expect(c5Result.breakdown.monthlyTeamCost).toBeGreaterThan(c1Result.breakdown.monthlyTeamCost);
    expect(c5Result.projectCost).toBeGreaterThan(c1Result.projectCost);
    expect(c5Result.riskAdjustedCost).toBeGreaterThan(c1Result.riskAdjustedCost);
  });

  // 12. Adding a dev reduces timeline
  it('12: adding a second dev reduces projectTimelineWeeks', () => {
    const oneDev = [DEV_C3];
    const twoDev = [
      DEV_C3,
      { devPseudonym: 'DEV_02', costBand: 'C3' as const, allocationPercent: 100, skills: [] },
    ];
    const oneResult = computeForecast(makeInput({ allocations: oneDev }));
    const twoResult = computeForecast(makeInput({ allocations: twoDev }));
    expect(twoResult.projectTimelineWeeks).toBeLessThan(oneResult.projectTimelineWeeks);
  });

  // 13. Removing a dev increases timeline
  it('13: removing a dev from two-dev team increases projectTimelineWeeks', () => {
    const twoDev = [
      DEV_C3,
      { devPseudonym: 'DEV_02', costBand: 'C3' as const, allocationPercent: 100, skills: [] },
    ];
    const oneDev = [DEV_C3];
    const twoResult = computeForecast(makeInput({ allocations: twoDev }));
    const oneResult = computeForecast(makeInput({ allocations: oneDev }));
    expect(oneResult.projectTimelineWeeks).toBeGreaterThan(twoResult.projectTimelineWeeks);
  });

  // 14. Two scenarios → compareForecasts identifies the cheaper one
  it('14: compareForecasts picks scenario with lower riskAdjustedCost as winner', () => {
    const cheap = computeForecast(
      makeInput({ scenario: { externalId: 'scenario-a', baseEffortPoints: 50, applicableLabels: [] } }),
    );
    const expensive = computeForecast(
      makeInput({ scenario: { externalId: 'scenario-b', baseEffortPoints: 200, applicableLabels: [] } }),
    );
    const { winner } = compareForecasts([expensive, cheap]);
    expect(winner.scenarioId).toBe('scenario-a');
    expect(cheap.riskAdjustedCost).toBeLessThan(expensive.riskAdjustedCost);
  });

  // 15. allocationPercent=1 → very long timeline but no crash
  it('15: allocationPercent=1 → produces a very large but finite timeline (no crash)', () => {
    const tinyAlloc: ForecastInput['allocations'] = [
      { devPseudonym: 'DEV_01', costBand: 'C3', allocationPercent: 1, skills: [] },
    ];
    const result = computeForecast(makeInput({ allocations: tinyAlloc }));
    expect(isFinite(result.projectTimelineWeeks)).toBe(true);
    expect(isNaN(result.projectTimelineWeeks)).toBe(false);
    expect(result.projectTimelineWeeks).toBeGreaterThan(0);
    // Should be much longer than a full 100% allocation
    const fullResult = computeForecast(makeInput());
    expect(result.projectTimelineWeeks).toBeGreaterThan(fullResult.projectTimelineWeeks * 50);
  });
});
