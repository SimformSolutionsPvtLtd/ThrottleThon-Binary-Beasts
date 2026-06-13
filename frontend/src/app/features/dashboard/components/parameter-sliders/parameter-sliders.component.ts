import {
  Component, inject, effect, OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { toObservable } from '@angular/core/rxjs-interop';
import { combineLatest, debounceTime, Subscription } from 'rxjs';
import { ForecastStateService } from '../../../../core/services/forecast-state.service';
import { ApiService } from '../../../../core/services/api.service';

@Component({
  selector: 'ss-parameter-sliders',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSliderModule, MatTooltipModule],
  template: `
    <div class="bg-surface-raised rounded-xl p-6">
      <h3 class="text-sm font-semibold text-content-muted uppercase tracking-wide mb-5">Forecast Parameters</h3>

      <div class="flex gap-8 flex-wrap">

        <!-- Priority Pressure -->
        <div class="flex-1 min-w-[180px]">
          <div class="flex items-center justify-between mb-1">
            <span
              class="text-sm font-medium text-content cursor-help"
              matTooltip="Higher = more urgency, increases effort from context-switching"
              matTooltipPosition="above"
            >Priority Pressure</span>
            <span class="text-sm font-semibold text-brand-accent">{{ state.priorityPressure() | number:'1.1-1' }}x</span>
          </div>
          <mat-slider
            min="0.5" max="2.0" step="0.1"
            class="w-full slider-brand"
            discrete
          >
            <input
              matSliderThumb
              [value]="state.priorityPressure()"
              (valueChange)="state.priorityPressure.set($event)"
            />
          </mat-slider>
          <div class="flex justify-between text-xs text-content-muted mt-1">
            <span>0.5x</span><span>2.0x</span>
          </div>
        </div>

        <!-- Scope % -->
        <div class="flex-1 min-w-[180px]">
          <div class="flex items-center justify-between mb-1">
            <span
              class="text-sm font-medium text-content cursor-help"
              matTooltip="100% = full scope. Below = descoped. Above = scope creep"
              matTooltipPosition="above"
            >Scope %</span>
            <span class="text-sm font-semibold text-brand-accent">{{ state.scopePercent() }}%</span>
          </div>
          <mat-slider
            min="50" max="150" step="5"
            class="w-full slider-brand"
            discrete
          >
            <input
              matSliderThumb
              [value]="state.scopePercent()"
              (valueChange)="state.scopePercent.set($event)"
            />
          </mat-slider>
          <div class="flex justify-between text-xs text-content-muted mt-1">
            <span>50%</span><span>150%</span>
          </div>
        </div>

        <!-- Contingency Buffer -->
        <div class="flex-1 min-w-[180px]">
          <div class="flex items-center justify-between mb-1">
            <span
              class="text-sm font-medium text-content cursor-help"
              matTooltip="Safety margin. 10% typical, 20%+ for high-risk"
              matTooltipPosition="above"
            >Contingency</span>
            <span class="text-sm font-semibold text-brand-accent">{{ state.contingencyBuffer() }}%</span>
          </div>
          <mat-slider
            min="0" max="30" step="1"
            class="w-full slider-brand"
            discrete
          >
            <input
              matSliderThumb
              [value]="state.contingencyBuffer()"
              (valueChange)="state.contingencyBuffer.set($event)"
            />
          </mat-slider>
          <div class="flex justify-between text-xs text-content-muted mt-1">
            <span>0%</span><span>30%</span>
          </div>
        </div>

      </div>

      @if (state.isForecastLoading()) {
        <div class="mt-4 flex items-center gap-2 text-xs text-content-muted">
          <div class="h-1.5 w-1.5 rounded-full bg-brand-accent animate-pulse"></div>
          <span>Recalculating forecast…</span>
        </div>
      }
    </div>
  `,
  styles: [`
    :host ::ng-deep .slider-brand .mdc-slider__track--active_fill,
    :host ::ng-deep .slider-brand .mat-mdc-slider .mdc-slider__track--active_fill {
      background-color: var(--brand-primary) !important;
    }
    :host ::ng-deep .slider-brand .mdc-slider__thumb-knob {
      background-color: var(--brand-primary) !important;
      border-color: var(--brand-primary) !important;
    }
    :host ::ng-deep .slider-brand .mdc-slider__track--inactive {
      background-color: var(--surface-overlay) !important;
    }
  `],
})
export class ParameterSlidersComponent implements OnDestroy {
  readonly state = inject(ForecastStateService);
  private readonly api = inject(ApiService);
  private sub: Subscription;

  constructor() {
    const params$ = combineLatest([
      toObservable(this.state.priorityPressure),
      toObservable(this.state.scopePercent),
      toObservable(this.state.contingencyBuffer),
      toObservable(this.state.activeScenarioIds),
      toObservable(this.state.allocations),
    ]).pipe(debounceTime(150));

    this.sub = params$.subscribe(([pp, scope, contingency, ids, allocs]) => {
      if (!ids.length) return;
      this.state.isForecastLoading.set(true);
      this.api.computeForecast({
        scenarioIds: ids,
        priorityPressure: pp,
        scopePercent: scope,
        contingencyBuffer: contingency / 100,
        allocations: allocs,
      }).subscribe({
        next: (res) => {
          this.state.forecastResults.set(res.results);
          this.state.winner.set(res.winner);
          this.state.isForecastLoading.set(false);
        },
        error: () => {
          this.state.isForecastLoading.set(false);
        },
      });
    });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
