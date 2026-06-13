import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { ForecastStateService } from '../../core/services/forecast-state.service';
import { DataStatusBarComponent } from './components/data-status-bar/data-status-bar.component';
import { ScenarioCardComponent } from './components/scenario-card/scenario-card.component';
import { AllocationBoardComponent } from '../allocations/allocation-board/allocation-board.component';

@Component({
  selector: 'ss-dashboard',
  standalone: true,
  imports: [CommonModule, DataStatusBarComponent, ScenarioCardComponent, AllocationBoardComponent],
  template: `
    @if (loading()) {
      <!-- Full-page skeleton -->
      <div class="space-y-4">
        <!-- Status bar skeleton -->
        <div class="bg-surface-raised rounded-xl p-4 flex gap-4">
          @for (i of [1,2,3]; track i) {
            <div class="flex items-center gap-3 flex-1">
              <div class="w-6 h-6 rounded bg-surface-overlay animate-pulse"></div>
              <div class="space-y-1.5 flex-1">
                <div class="h-3 w-20 rounded bg-surface-overlay animate-pulse"></div>
                <div class="h-2.5 w-28 rounded bg-surface-overlay animate-pulse"></div>
              </div>
            </div>
          }
        </div>
        <!-- Scenario cards skeleton -->
        <div class="grid grid-cols-2 gap-4">
          @for (i of [1,2]; track i) {
            <div class="bg-surface-raised rounded-xl p-6 space-y-4">
              <div class="h-5 w-40 rounded bg-surface-overlay animate-pulse"></div>
              <div class="h-3 w-full rounded bg-surface-overlay animate-pulse"></div>
              <div class="grid grid-cols-2 gap-3">
                @for (j of [1,2,3,4]; track j) {
                  <div class="bg-surface rounded-lg p-3">
                    <div class="h-2.5 w-16 rounded bg-surface-overlay animate-pulse mb-2"></div>
                    <div class="h-7 w-20 rounded bg-surface-overlay animate-pulse"></div>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </div>
    } @else {
      <div class="space-y-4">
        <!-- Row 1: Data Status Bar -->
        <ss-data-status-bar (refresh)="onRefresh($event)" />

        <!-- Row 2: Scenario Cards -->
        @if (forecastState.activeScenarioIds().length) {
          <div class="grid grid-cols-2 gap-4">
            @for (id of forecastState.activeScenarioIds(); track id) {
              <ss-scenario-card [scenarioExternalId]="id" />
            }
          </div>
        } @else {
          <div class="bg-surface-raised rounded-xl p-8 text-center text-content-muted">
            No scenarios loaded. Check backend connection.
          </div>
        }

        <!-- Row 3: Parameter Sliders (Phase 2 placeholder) -->
        <div class="bg-surface-raised rounded-xl p-4 border border-dashed border-surface-overlay text-center text-content-muted text-sm">
          Parameter Sliders — Phase 2
        </div>

        <!-- Row 4: Financial Chart (Phase 2 placeholder) -->
        <div class="bg-surface-raised rounded-xl p-8 border border-dashed border-surface-overlay text-center text-content-muted text-sm">
          Financial Chart — Phase 2
        </div>

        <!-- Row 5: Allocation Board -->
        <ss-allocation-board />

        <!-- Row 6: Debate Timeline (Phase 4 placeholder) -->
        <div class="bg-surface-raised rounded-xl p-4 border border-dashed border-surface-overlay text-center text-content-muted text-sm">
          Debate Timeline — Phase 4
        </div>
      </div>
    }
  `,
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly forecastState = inject(ForecastStateService);
  readonly loading = signal(true);

  ngOnInit(): void {
    forkJoin({
      status: this.api.getStatus(),
      scenarios: this.api.getScenarios(),
      developers: this.api.getDevelopers(),
      allocations: this.api.getAllocations(),
    }).subscribe({
      next: ({ status, scenarios, developers, allocations }) => {
        this.forecastState.dataStatus.set(status);
        this.forecastState.scenarios.set(scenarios);
        this.forecastState.developers.set(developers);
        this.forecastState.allocations.set(allocations);

        // Auto-select first 2 scenarios
        const first2 = scenarios.slice(0, 2).map(s => s.externalId);
        this.forecastState.activeScenarioIds.set(first2);

        this.loading.set(false);

        if (first2.length) {
          this.runForecast(first2, allocations);
        }
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  private runForecast(scenarioIds: string[], allocations: import('../../core/models/developer.model').Allocation[]): void {
    this.forecastState.isForecastLoading.set(true);
    this.api.computeForecast({
      scenarioIds,
      priorityPressure: this.forecastState.priorityPressure(),
      scopePercent: this.forecastState.scopePercent(),
      contingencyBuffer: this.forecastState.contingencyBuffer(),
      allocations,
    }).subscribe({
      next: (res) => {
        this.forecastState.forecastResults.set(res.results);
        this.forecastState.winner.set(res.winner);
        this.forecastState.isForecastLoading.set(false);
      },
      error: () => {
        this.forecastState.isForecastLoading.set(false);
      },
    });
  }

  onRefresh(source: string): void {
    this.api.triggerIngestion(source).subscribe();
  }
}
