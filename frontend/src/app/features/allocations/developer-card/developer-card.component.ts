import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSliderModule } from '@angular/material/slider';
import { FormsModule } from '@angular/forms';
import { Developer } from '../../../core/models/developer.model';
import { ResolvePseudonymPipe } from '../../../shared/pipes/resolve-pseudonym.pipe';

const COST_BAND_CLASS: Record<string, string> = {
  C1: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  C2: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  C3: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  C4: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  C5: 'bg-red-500/20 text-red-300 border-red-500/30',
};

@Component({
  selector: 'ss-developer-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule, MatSliderModule, FormsModule, ResolvePseudonymPipe],
  template: `
    <div
      class="bg-surface-overlay rounded-lg p-3 cursor-grab select-none group relative focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none"
      [attr.tabindex]="0"
      [attr.aria-label]="'Developer ' + (dev().pseudonym | resolveName) + ', ' + dev().role"
      (keydown.enter)="keyboardActivate.emit(dev())"
      (keydown.space)="$event.preventDefault(); keyboardActivate.emit(dev())"
    >
      <!-- Top row: name + cost band + remove -->
      <div class="flex items-start justify-between gap-2 mb-2">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-sm font-semibold text-content truncate">{{ dev().pseudonym | resolveName }}</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-brand-primary/15 text-brand-accent font-medium capitalize flex-shrink-0">
              {{ dev().role }}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-1 flex-shrink-0">
          <!-- Cost band -->
          <span
            class="text-[10px] px-1.5 py-0.5 rounded border font-semibold flex-shrink-0"
            [class]="costBandClass()"
            [matTooltip]="'Cost Band ' + dev().costBand"
          >{{ dev().costBand }}</span>

          <!-- Remove button (only when allocated) -->
          @if (showRemove()) {
            <button
              mat-icon-button
              class="!h-5 !w-5 !min-h-0 text-content-muted hover:text-red-400 transition-colors"
              [matTooltip]="'Remove from scenario'"
              (click)="$event.stopPropagation(); remove.emit(dev())"
            >
              <mat-icon style="font-size:14px;width:14px;height:14px;">close</mat-icon>
            </button>
          }
        </div>
      </div>

      <!-- Skills row -->
      <div class="flex flex-wrap gap-1 mb-2">
        @for (skill of topSkills(); track skill.tech) {
          <span
            class="text-[10px] px-1.5 py-0.5 rounded bg-surface text-content-muted flex items-center gap-1"
            [matTooltip]="skill.tech + ' · ' + skill.proficiency + '/5'"
          >
            <span>{{ skill.tech }}</span>
            <span class="text-[8px] tracking-tighter">{{ dots(skill.proficiency) }}</span>
          </span>
        }
      </div>

      <!-- Available % -->
      @if (availablePercent() > 0 && !showRemove()) {
        <div class="text-[10px] text-content-muted">Available: {{ availablePercent() }}%</div>
      }

      <!-- Allocation slider (only when showing remove = allocated card) -->
      @if (showRemove() && allocationPercent() !== null) {
        <div class="mt-1">
          <div class="flex items-center justify-between text-[10px] text-content-muted mb-0.5">
            <span>Allocation</span>
            <span class="text-brand-accent font-semibold">{{ allocationPercent() }}%</span>
          </div>
          <mat-slider
            [min]="5"
            [max]="maxAllocation()"
            [step]="5"
            class="w-full"
            style="margin: -8px 0"
          >
            <input
              matSliderThumb
              [value]="allocationPercent()!"
              (valueChange)="allocationChange.emit($event)"
            />
          </mat-slider>
        </div>
      }
    </div>
  `,
})
export class DeveloperCardComponent {
  readonly dev = input.required<Developer>();
  readonly showRemove = input<boolean>(false);
  readonly allocationPercent = input<number | null>(null);
  readonly maxAllocation = input<number>(100);

  readonly remove = output<Developer>();
  readonly allocationChange = output<number>();
  readonly keyboardActivate = output<Developer>();

  readonly topSkills = computed(() => this.dev().skills.slice(0, 3));

  readonly availablePercent = computed(() =>
    this.dev().availablePercent ?? (100 - (this.dev().currentAllocation?.percent ?? 0))
  );

  costBandClass(): string {
    return COST_BAND_CLASS[this.dev().costBand] ?? 'bg-slate-500/20 text-slate-300 border-slate-500/30';
  }

  dots(proficiency: number): string {
    const filled = Math.round(proficiency);
    return '●'.repeat(filled) + '○'.repeat(5 - filled);
  }
}
