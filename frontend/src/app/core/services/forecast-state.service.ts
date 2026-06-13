import { Injectable, signal, computed } from '@angular/core';
import { DataStatus } from '../models/data-status.model';
import { Scenario } from '../models/scenario.model';
import { Developer, Allocation } from '../models/developer.model';
import { ForecastResult, WinnerInfo } from '../models/forecast.model';
import { DebateResult, DebateProgress } from '../models/debate.model';

@Injectable({ providedIn: 'root' })
export class ForecastStateService {
  readonly dataStatus = signal<DataStatus | null>(null);
  readonly scenarios = signal<Scenario[]>([]);
  readonly activeScenarioIds = signal<string[]>([]);
  readonly activeScenarios = computed(() =>
    this.scenarios().filter(s => this.activeScenarioIds().includes(s.externalId))
  );
  readonly developers = signal<Developer[]>([]);
  readonly benchDevelopers = computed(() =>
    this.developers().filter(d => (d.availablePercent ?? (100 - d.currentAllocation.percent)) > 0)
  );
  readonly priorityPressure = signal(1.0);
  readonly scopePercent = signal(100);
  readonly contingencyBuffer = signal(0.10);
  readonly allocations = signal<Allocation[]>([]);
  readonly forecastResults = signal<ForecastResult[]>([]);
  readonly winner = signal<WinnerInfo | null>(null);
  readonly debateResults = signal<Map<string, DebateResult>>(new Map());
  readonly identityMap = signal<Map<string, { realName: string; email: string }> | null>(null);
  readonly showRealNames = signal(false);
  readonly isForecastLoading = signal(false);
  readonly isDebateLoading = signal(false);
  readonly isIngestionLoading = signal(false);
  readonly debateProgress = signal<DebateProgress | null>(null);

  readonly resolvedName = computed(() => {
    const map = this.identityMap();
    const show = this.showRealNames();
    return (pseudonym: string) => (show && map?.get(pseudonym)?.realName) || pseudonym;
  });
}
