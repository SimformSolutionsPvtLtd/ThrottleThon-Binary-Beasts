import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/services/api.service';
import { ForecastStateService } from '../../core/services/forecast-state.service';
import { ParameterSlidersComponent } from './components/parameter-sliders/parameter-sliders.component';
import { ScenarioCardComponent } from './components/scenario-card/scenario-card.component';
import { FinancialChartComponent } from './components/financial-chart/financial-chart.component';

@Component({
  selector: 'ss-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatChipsModule,
    MatIconModule,
    MatTooltipModule,
    ParameterSlidersComponent,
    ScenarioCardComponent,
    FinancialChartComponent,
  ],
  template: `
    <div class="space-y-6">

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
  `],
})
export class DashboardComponent implements OnInit {
  readonly state = inject(ForecastStateService);
  private readonly api = inject(ApiService);

  readonly isLoadingScenarios = computed(() => this.state.allScenarios().length === 0);

  ngOnInit(): void {
    this.loadInitialData();
  }

  private loadInitialData(): void {
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
