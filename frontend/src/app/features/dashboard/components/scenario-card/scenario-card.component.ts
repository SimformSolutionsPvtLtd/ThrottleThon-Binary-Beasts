import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Scenario } from '../../../../core/models/scenario.model';
import { ForecastResult, WinnerInfo } from '../../../../core/models/forecast.model';

@Component({
  selector: 'ss-scenario-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  template: `
    <div
      class="bg-surface-raised rounded-xl p-5 border transition-all duration-300"
      [class.border-brand-primary]="isWinner()"
      [class.border-surface-overlay]="!isWinner()"
      [class.shadow-lg]="isWinner()"
      [class.ring-1]="isWinner()"
      [class.ring-brand-primary]="isWinner()"
    >
      <!-- Header -->
      <div class="flex items-start justify-between gap-2 mb-4">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <h3 class="font-semibold text-content text-base truncate">{{ scenario().name }}</h3>
            @if (isWinner()) {
              <span class="flex items-center gap-1 px-2 py-0.5 bg-brand-primary/20 text-brand-accent text-xs font-semibold rounded-full border border-brand-primary/40 flex-shrink-0">
                <mat-icon class="text-xs" style="font-size:12px;width:12px;height:12px;">emoji_events</mat-icon>
                Winner
              </span>
            }
          </div>
          <span class="text-xs text-content-muted capitalize">{{ scenario().category }}</span>
        </div>
        @if (result()) {
          <div
            class="text-xs px-2 py-1 rounded-full border flex-shrink-0"
            [class.bg-emerald-500/10]="confidenceTier() === 'high'"
            [class.border-emerald-500/30]="confidenceTier() === 'high'"
            [class.text-emerald-400]="confidenceTier() === 'high'"
            [class.bg-amber-500/10]="confidenceTier() === 'medium'"
            [class.border-amber-500/30]="confidenceTier() === 'medium'"
            [class.text-amber-400]="confidenceTier() === 'medium'"
            [class.bg-red-500/10]="confidenceTier() === 'low'"
            [class.border-red-500/30]="confidenceTier() === 'low'"
            [class.text-red-400]="confidenceTier() === 'low'"
            matTooltip="Forecast confidence score"
          >{{ result()!.confidenceScore | number:'1.0-0' }}% conf.</div>
        }
      </div>

      <!-- Metrics -->
      @if (result(); as r) {
        <div class="grid grid-cols-2 gap-3">

          <div class="bg-surface rounded-lg p-3">
            <div class="text-xs text-content-muted mb-1">Project Cost</div>
            <div
              class="text-lg font-bold text-content transition-all duration-300"
              [class.shimmer]="isLoading()"
            >{{ formatLakhs(r.projectCost) }}</div>
          </div>

          <div class="bg-surface rounded-lg p-3">
            <div class="text-xs text-content-muted mb-1">Risk-Adjusted</div>
            <div
              class="text-lg font-bold text-amber-400 transition-all duration-300"
              [class.shimmer]="isLoading()"
            >{{ formatLakhs(r.riskAdjustedCost) }}</div>
          </div>

          <div class="bg-surface rounded-lg p-3">
            <div class="text-xs text-content-muted mb-1">Timeline</div>
            <div
              class="text-lg font-bold text-content-accent transition-all duration-300"
              [class.shimmer]="isLoading()"
            >{{ r.projectTimelineWeeks | number:'1.1-1' }} wks</div>
          </div>

          <div class="bg-surface rounded-lg p-3">
            <div class="text-xs text-content-muted mb-1">Effort (pts)</div>
            <div
              class="text-lg font-bold text-content transition-all duration-300"
              [class.shimmer]="isLoading()"
            >{{ r.adjustedEffortPoints | number:'1.0-0' }}</div>
          </div>

        </div>

        @if (isWinner() && winnerInfo()?.reason) {
          <div class="mt-3 px-3 py-2 bg-brand-primary/10 rounded-lg border border-brand-primary/20">
            <p class="text-xs text-brand-accent">{{ winnerInfo()!.reason }}</p>
          </div>
        }

      } @else {
        <!-- Loading skeleton -->
        <div class="grid grid-cols-2 gap-3">
          @for (_ of [1,2,3,4]; track _) {
            <div class="bg-surface rounded-lg p-3">
              <div class="h-3 w-16 bg-surface-overlay rounded shimmer mb-2"></div>
              <div class="h-6 w-20 bg-surface-overlay rounded shimmer"></div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class ScenarioCardComponent {
  readonly scenario = input.required<Scenario>();
  readonly result = input<ForecastResult | null>(null);
  readonly winnerInfo = input<WinnerInfo | null>(null);
  readonly isLoading = input<boolean>(false);

  readonly isWinner = computed(() =>
    this.winnerInfo()?.scenarioId === this.scenario().externalId
  );

  readonly confidenceTier = computed(() => {
    const score = this.result()?.confidenceScore ?? 0;
    if (score >= 75) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  });

  formatLakhs(value: number): string {
    const lakhs = value / 100000;
    if (lakhs >= 100) return `₹${(lakhs / 100).toFixed(1)}Cr`;
    return `₹${lakhs.toFixed(1)}L`;
  }
}
