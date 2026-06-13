import { Component, input, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ForecastStateService } from '../../../../core/services/forecast-state.service';
import { CurrencyInrPipe } from '../../../../shared/pipes/currency-inr.pipe';

@Component({
  selector: 'ss-scenario-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatChipsModule, MatProgressSpinnerModule, CurrencyInrPipe],
  template: `
    @if (scenario(); as sc) {
      <div
        class="bg-surface-raised rounded-xl p-6 border-2 transition-all duration-300"
        [class.border-green-500]="isWinner()"
        [class.border-transparent]="!isWinner()"
        [class.shadow-green-500/20]="isWinner()"
        [class.shadow-lg]="isWinner()"
      >
        <!-- Header -->
        <div class="flex items-start justify-between mb-4">
          <div class="flex-1 min-w-0">
            <h3 class="text-base font-semibold text-content truncate">{{ sc.name }}</h3>
            <p class="text-xs text-content-muted mt-0.5 line-clamp-2">{{ sc.description }}</p>
          </div>
          <div class="flex flex-col items-end gap-1 ml-3 flex-shrink-0">
            <span class="text-xs px-2 py-0.5 rounded-full bg-brand-primary/20 text-brand-accent font-medium capitalize">
              {{ sc.category }}
            </span>
            @if (isWinner()) {
              <span class="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium flex items-center gap-1">
                <mat-icon class="text-xs" style="font-size:12px;width:12px;height:12px;">check_circle</mat-icon>
                Recommended
              </span>
            }
          </div>
        </div>

        <!-- Forecast Numbers -->
        <div class="grid grid-cols-2 gap-4 mb-4">
          <!-- Timeline -->
          <div class="bg-surface rounded-lg p-3">
            <div class="text-xs text-content-muted mb-1">Timeline</div>
            @if (forecastState.isForecastLoading()) {
              <div class="h-7 w-20 rounded bg-surface-overlay animate-pulse"></div>
            } @else if (result(); as r) {
              <div class="text-2xl font-bold text-content">{{ r.projectTimelineWeeks.toFixed(1) }}<span class="text-sm font-normal text-content-muted ml-1">wks</span></div>
            } @else {
              <div class="text-2xl font-bold text-content-muted">—</div>
            }
          </div>

          <!-- Confidence -->
          <div class="bg-surface rounded-lg p-3 flex items-center gap-3">
            <div class="flex-1">
              <div class="text-xs text-content-muted mb-1">Confidence</div>
              @if (forecastState.isForecastLoading()) {
                <div class="h-7 w-16 rounded bg-surface-overlay animate-pulse"></div>
              } @else if (result(); as r) {
                <div class="text-2xl font-bold text-content">{{ (r.confidenceScore * 100).toFixed(0) }}<span class="text-sm font-normal text-content-muted ml-0.5">%</span></div>
              } @else {
                <div class="text-2xl font-bold text-content-muted">—</div>
              }
            </div>
            @if (result(); as r) {
              <mat-progress-spinner
                mode="determinate"
                [value]="r.confidenceScore * 100"
                diameter="40"
                strokeWidth="4"
                [color]="r.confidenceScore >= 0.7 ? 'primary' : 'warn'"
              ></mat-progress-spinner>
            }
          </div>

          <!-- Cost -->
          <div class="bg-surface rounded-lg p-3">
            <div class="text-xs text-content-muted mb-1">Cost</div>
            @if (forecastState.isForecastLoading()) {
              <div class="h-7 w-20 rounded bg-surface-overlay animate-pulse"></div>
            } @else if (result(); as r) {
              <div class="text-2xl font-bold text-content">{{ r.projectCost | inr }}</div>
            } @else {
              <div class="text-2xl font-bold text-content-muted">—</div>
            }
          </div>

          <!-- Risk-Adjusted Cost -->
          <div class="bg-surface rounded-lg p-3">
            <div class="text-xs text-content-muted mb-1">Risk-Adjusted</div>
            @if (forecastState.isForecastLoading()) {
              <div class="h-7 w-20 rounded bg-surface-overlay animate-pulse"></div>
            } @else if (result(); as r) {
              <div class="text-2xl font-semibold text-amber-400">{{ r.riskAdjustedCost | inr }}</div>
            } @else {
              <div class="text-2xl font-bold text-content-muted">—</div>
            }
          </div>
        </div>

        <!-- Risk Factors (expandable) -->
        @if (sc.config.riskFactors.length) {
          <div class="border-t border-surface-overlay pt-3">
            <button
              class="flex items-center gap-1 text-xs text-content-muted hover:text-content transition-colors w-full text-left"
              (click)="riskExpanded.set(!riskExpanded())"
            >
              <mat-icon class="text-xs transition-transform" style="font-size:14px;width:14px;height:14px;" [class.rotate-90]="riskExpanded()">chevron_right</mat-icon>
              Risk Factors ({{ sc.config.riskFactors.length }})
            </button>
            @if (riskExpanded()) {
              <ul class="mt-2 space-y-1">
                @for (risk of sc.config.riskFactors; track risk) {
                  <li class="text-xs text-content-muted flex items-start gap-1.5">
                    <mat-icon class="text-amber-400 flex-shrink-0 mt-0.5" style="font-size:12px;width:12px;height:12px;">warning</mat-icon>
                    {{ risk }}
                  </li>
                }
              </ul>
            }
          </div>
        }
      </div>
    }
  `,
})
export class ScenarioCardComponent {
  readonly scenarioExternalId = input.required<string>();
  readonly forecastState = inject(ForecastStateService);
  readonly riskExpanded = signal(false);

  readonly scenario = computed(() =>
    this.forecastState.scenarios().find(s => s.externalId === this.scenarioExternalId())
  );

  readonly result = computed(() =>
    this.forecastState.forecastResults().find(r => r.scenarioId === this.scenarioExternalId())
  );

  readonly isWinner = computed(() =>
    this.forecastState.winner()?.scenarioId === this.scenarioExternalId()
  );
}
