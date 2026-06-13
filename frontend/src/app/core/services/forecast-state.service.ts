import { Injectable, signal, computed } from '@angular/core';
import { ForecastResult, WinnerInfo } from '../models/forecast.model';
import { Scenario } from '../models/scenario.model';
import { Developer, Allocation } from '../models/developer.model';

@Injectable({ providedIn: 'root' })
export class ForecastStateService {
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
}
