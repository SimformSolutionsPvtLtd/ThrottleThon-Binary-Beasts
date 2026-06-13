import { Injectable, signal, computed } from '@angular/core';
import { ForecastResult, WinnerInfo } from '../models/forecast.model';
import { Scenario } from '../models/scenario.model';
import { Developer, Allocation } from '../models/developer.model';
import { DataStatus } from '../models/data-status.model';
import { DebateResult, DebateProgress } from '../models/debate.model';

@Injectable({ providedIn: 'root' })
export class ForecastStateService {
  // NOTE: forecast recompute is wired in ParameterSlidersComponent, which reacts
  // to changes in allocations()/activeScenarioIds()/params via toObservable. Any
  // mutation of the allocations() signal below propagates to that recompute.
  // Slider parameters
  readonly priorityPressure = signal<number>(1.0);
  readonly scopePercent = signal<number>(100);
  readonly contingencyBuffer = signal<number>(10);

  // Scenario selection
  readonly allScenarios = signal<Scenario[]>([]);
  readonly activeScenarioIds = signal<string[]>([]);

  // Developers
  readonly developers = signal<Developer[]>([]);

  // Allocations
  readonly allocations = signal<Allocation[]>([]);

  // Forecast results
  readonly forecastResults = signal<ForecastResult[]>([]);
  readonly winner = signal<WinnerInfo | null>(null);
  readonly isForecastLoading = signal<boolean>(false);

  // Data source status (Git/Jira/HRMS)
  readonly dataStatus = signal<DataStatus | null>(null);

  // AI debate
  readonly debateResults = signal<Map<string, DebateResult>>(new Map());
  readonly debateProgress = signal<DebateProgress | null>(null);
  readonly isDebateLoading = signal<boolean>(false);

  // Ingestion
  readonly isIngestionLoading = signal<boolean>(false);

  // Identity / display
  readonly showRealNames = signal<boolean>(false);
  readonly identityMap = signal<Record<string, { realName: string; email: string }>>({});
  readonly resolvedName = computed(() => (pseudonym: string) =>
    this.showRealNames()
      ? (this.identityMap()[pseudonym]?.realName ?? pseudonym)
      : pseudonym
  );

  readonly activeScenarios = computed(() => {
    const ids = this.activeScenarioIds();
    return this.allScenarios().filter(s => ids.includes(s.externalId));
  });

  readonly resultsByScenarioId = computed(() => {
    const map = new Map<string, ForecastResult>();
    for (const r of this.forecastResults()) {
      map.set(r.scenarioId, r);
    }
    return map;
  });

  /** Sum of allocation percent for a developer across all scenarios. */
  readonly allocatedPercentByDev = computed(() => {
    const map = new Map<string, number>();
    for (const a of this.allocations()) {
      map.set(a.devPseudonym, (map.get(a.devPseudonym) ?? 0) + a.allocationPercent);
    }
    return map;
  });

  /** Remaining allocatable capacity (0–100) for a developer. */
  availableForDev(pseudonym: string): number {
    return Math.max(0, 100 - (this.allocatedPercentByDev().get(pseudonym) ?? 0));
  }

  /** Developers with remaining capacity (>0%), eligible for the bench column. */
  readonly benchDevelopers = computed(() => {
    const allocated = this.allocatedPercentByDev();
    return this.developers()
      .map(dev => ({ ...dev, availablePercent: Math.max(0, 100 - (allocated.get(dev.pseudonym) ?? 0)) }))
      .filter(dev => dev.availablePercent > 0);
  });

  /** Allocations for a given scenario, newest-relevant order preserved. */
  allocationsForScenario(scenarioExternalId: string): Allocation[] {
    return this.allocations().filter(a => a.scenarioExternalId === scenarioExternalId);
  }
}
