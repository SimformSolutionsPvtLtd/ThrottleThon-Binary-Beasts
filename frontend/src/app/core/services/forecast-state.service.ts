import { Injectable, signal, computed } from '@angular/core';
import { ForecastResult, WinnerInfo } from '../models/forecast.model';
import { Scenario } from '../models/scenario.model';
import { Allocation } from '../models/developer.model';

@Injectable({ providedIn: 'root' })
export class ForecastStateService {
  // Slider parameters
  readonly priorityPressure = signal<number>(1.0);
  readonly scopePercent = signal<number>(100);
  readonly contingencyBuffer = signal<number>(10);

  // Scenario selection
  readonly allScenarios = signal<Scenario[]>([]);
  readonly activeScenarioIds = signal<string[]>([]);

  // Allocations
  readonly allocations = signal<Allocation[]>([]);

  // Forecast results
  readonly forecastResults = signal<ForecastResult[]>([]);
  readonly winner = signal<WinnerInfo | null>(null);
  readonly isForecastLoading = signal<boolean>(false);

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
