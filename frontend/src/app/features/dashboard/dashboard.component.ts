import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../../core/services/api.service';
import { ForecastStateService } from '../../core/services/forecast-state.service';
import { ParameterSlidersComponent } from './components/parameter-sliders/parameter-sliders.component';
import { ScenarioCardComponent } from './components/scenario-card/scenario-card.component';
import { FinancialChartComponent } from './components/financial-chart/financial-chart.component';
import { DataStatusBarComponent } from './components/data-status-bar/data-status-bar.component';
import { DebateLoadingComponent } from './components/debate-loading/debate-loading.component';
import { DebateTimelineComponent } from '../debate/debate-timeline/debate-timeline.component';

@Component({
  selector: 'ss-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    ParameterSlidersComponent,
    ScenarioCardComponent,
    FinancialChartComponent,
    DataStatusBarComponent,
    DebateLoadingComponent,
    DebateTimelineComponent,
  ],
  template: `
    <div class="space-y-6">

      <!-- Data source status -->
      <ss-data-status-bar
        (refresh)="onRefreshSource($event)"
        (refreshAll)="onRefreshAll()"
      />

      <!-- Header row -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-content">Forecast Dashboard</h2>
          <p class="text-sm text-content-muted mt-0.5">Adjust parameters to compare project scenarios in real-time.</p>
        </div>
        @if (state.isForecastLoading()) {
          <div class="flex items-center gap-2 text-xs text-content-muted bg-surface-raised px-3 py-1.5 rounded-full border border-surface-overlay">
            <span class="h-2 w-2 rounded-full bg-brand-accent animate-pulse inline-block"></span>
            Computing…
          </div>
        }
      </div>

      <!-- Parameter Sliders -->
      <ss-parameter-sliders />

      <!-- Scenario Selection -->
      <div class="bg-surface-raised rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-content-muted uppercase tracking-wide">
            Scenarios
            <span class="ml-2 text-xs normal-case font-normal">
              ({{ state.activeScenarioIds().length }} selected, max 4)
            </span>
          </h3>
          @if (isLoadingScenarios()) {
            <span class="text-xs text-content-muted">Loading…</span>
          }
        </div>

        @if (state.allScenarios().length === 0 && !isLoadingScenarios()) {
          <p class="text-sm text-content-muted">No scenarios found. Add some in the Scenarios section.</p>
        }

        <mat-chip-listbox
          multiple
          [value]="state.activeScenarioIds()"
          (change)="onScenarioSelectionChange($event.value)"
          aria-label="Select scenarios to compare"
        >
          @for (scenario of state.allScenarios(); track scenario.externalId) {
            <mat-chip-option
              [value]="scenario.externalId"
              [disabled]="isChipDisabled(scenario.externalId)"
              class="scenario-chip"
            >
              {{ scenario.name }}
              <span class="text-xs opacity-60 ml-1 capitalize">({{ scenario.category }})</span>
            </mat-chip-option>
          }
        </mat-chip-listbox>

        <!-- Scenario cards grid -->
        @if (state.activeScenarios().length > 0) {
          <div class="mt-5 grid gap-4"
            [class.grid-cols-1]="state.activeScenarios().length === 1"
            [class.grid-cols-2]="state.activeScenarios().length === 2"
            [class.grid-cols-3]="state.activeScenarios().length === 3"
            [class.grid-cols-4]="state.activeScenarios().length >= 4"
          >
            @for (scenario of state.activeScenarios(); track scenario.externalId) {
              <ss-scenario-card
                [scenario]="scenario"
                [result]="state.resultsByScenarioId().get(scenario.externalId) ?? null"
                [winnerInfo]="state.winner()"
                [isLoading]="state.isForecastLoading()"
              />
            }
          </div>
        }
      </div>

      <!-- Financial Chart -->
      <ss-financial-chart />

      <!-- AI Risk Analysis -->
      <div class="bg-surface-raised rounded-xl p-6">
        <div class="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h3 class="text-base font-semibold text-content flex items-center gap-2">
            <mat-icon class="text-brand-accent">psychology</mat-icon>
            AI Risk Analysis
          </h3>
          <button
            mat-raised-button
            class="debate-btn"
            [disabled]="state.isDebateLoading() || state.activeScenarioIds().length === 0"
            (click)="runDebate()"
          >
            <mat-icon>psychology</mat-icon>
            Run AI Debate
          </button>
        </div>

        @if (state.isDebateLoading()) {
          <ss-debate-loading />
        } @else {
          <ss-debate-timeline [scenarioExternalId]="state.activeScenarioIds()[0]" />
        }
      </div>

    </div>
  `,
  styles: [`
    :host ::ng-deep .scenario-chip.mat-mdc-chip-option--selected {
      background-color: rgba(37,99,235,0.2) !important;
      border-color: rgba(37,99,235,0.6) !important;
      color: var(--brand-accent) !important;
    }
    :host ::ng-deep .mat-mdc-chip-option {
      background-color: var(--surface) !important;
      border: 1px solid var(--surface-overlay) !important;
      color: var(--content-muted) !important;
      transition: all 0.2s ease;
    }
    :host ::ng-deep .mat-mdc-chip-option:not([disabled]):hover {
      border-color: var(--brand-primary) !important;
      color: var(--content) !important;
    }
    :host ::ng-deep .debate-btn:not([disabled]) {
      background-color: var(--brand-primary) !important;
      color: #fff !important;
    }
  `],
})
export class DashboardComponent implements OnInit {
  readonly state = inject(ForecastStateService);
  private readonly api = inject(ApiService);
  private readonly snackBar = inject(MatSnackBar);

  readonly isLoadingScenarios = computed(() => this.state.allScenarios().length === 0);

  ngOnInit(): void {
    this.loadInitialData();
  }

  private loadInitialData(): void {
    this.api.getStatus().subscribe({
      next: (status) => this.state.dataStatus.set(status),
      error: () => {},
    });

    this.api.getScenarios().subscribe({
      next: (scenarios) => {
        this.state.allScenarios.set(scenarios);
        // Auto-select first 2 active scenarios
        const active = scenarios.filter(s => s.isActive).slice(0, 2);
        if (active.length) {
          this.state.activeScenarioIds.set(active.map(s => s.externalId));
        }
      },
      error: () => {},
    });

    this.api.getAllocations().subscribe({
      next: (allocs) => this.state.allocations.set(allocs),
      error: () => {},
    });
  }

  // ── AI Debate ───────────────────────────────────────────────────────────────

  runDebate(): void {
    const ids = this.state.activeScenarioIds();
    if (!ids.length) return;

    this.state.isDebateLoading.set(true);
    this.api.runDebate(ids).subscribe({
      next: (results) => {
        this.state.debateResults.update(prev => {
          const next = new Map(prev);
          for (const r of results) next.set(r.scenarioExternalId, r);
          return next;
        });
        this.state.isDebateLoading.set(false);
        // Recalculate the forecast so the new debate-derived friction factor
        // and confidence score flow into the scenario cards and chart.
        this.recomputeForecast();
      },
      error: () => {
        this.snackBar.open('Debate failed. Using cached data.', 'Dismiss', { duration: 4000 });
        this.state.isDebateLoading.set(false);
      },
    });
  }

  private recomputeForecast(): void {
    const ids = this.state.activeScenarioIds();
    if (!ids.length) return;
    this.state.isForecastLoading.set(true);
    this.api.computeForecast({
      scenarioIds: ids,
      priorityPressure: this.state.priorityPressure(),
      scopePercent: this.state.scopePercent(),
      contingencyBuffer: this.state.contingencyBuffer() / 100,
      allocations: this.state.allocations(),
    }).subscribe({
      next: (res) => {
        this.state.forecastResults.set(res.results);
        this.state.winner.set(res.winner);
        this.state.isForecastLoading.set(false);
      },
      error: () => this.state.isForecastLoading.set(false),
    });
  }

  // ── Ingestion refresh ─────────────────────────────────────────────────────────

  onRefreshSource(source: string): void {
    this.state.isIngestionLoading.set(true);
    this.api.triggerIngestion(source).subscribe({
      next: () => this.afterIngestion(`${this.sourceLabel(source)} data refreshed`),
      error: () => {
        this.snackBar.open(`Failed to refresh ${this.sourceLabel(source)} data.`, 'Dismiss', { duration: 4000 });
        this.state.isIngestionLoading.set(false);
      },
    });
  }

  onRefreshAll(): void {
    this.state.isIngestionLoading.set(true);
    this.api.triggerAllIngestion().subscribe({
      next: () => this.afterIngestion('All data sources refreshed'),
      error: () => {
        this.snackBar.open('Failed to refresh data sources.', 'Dismiss', { duration: 4000 });
        this.state.isIngestionLoading.set(false);
      },
    });
  }

  /** Re-fetch status (for updated counts) and notify, then clear loading. */
  private afterIngestion(message: string): void {
    this.api.getStatus().subscribe({
      next: (status) => {
        this.state.dataStatus.set(status);
        this.snackBar.open(message, 'Dismiss', { duration: 3000 });
        this.state.isIngestionLoading.set(false);
      },
      error: () => {
        this.snackBar.open(message, 'Dismiss', { duration: 3000 });
        this.state.isIngestionLoading.set(false);
      },
    });
  }

  private sourceLabel(source: string): string {
    switch (source) {
      case 'jira': return 'Jira';
      case 'git': return 'Git';
      case 'hrms': return 'HRMS';
      default: return source;
    }
  }

  onScenarioSelectionChange(selectedIds: string[]): void {
    // Enforce max 4
    const capped = selectedIds.slice(0, 4);
    this.state.activeScenarioIds.set(capped);
  }

  isChipDisabled(externalId: string): boolean {
    const active = this.state.activeScenarioIds();
    return active.length >= 4 && !active.includes(externalId);
  }
}
