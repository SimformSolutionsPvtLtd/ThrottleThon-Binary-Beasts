import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Developer } from '../../../../core/models/developer.model';
import { ResolvePseudonymPipe } from '../../../../shared/pipes/resolve-pseudonym.pipe';

@Component({
  selector: 'ss-developer-card',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSliderModule,
    MatIconModule,
    MatTooltipModule,
    ResolvePseudonymPipe,
  ],
  template: `
    <div
      class="bg-surface-overlay rounded-lg p-3 border border-transparent transition-colors hover:border-brand-primary/40 focus-visible:border-brand-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60"
      [class.cursor-grab]="!allocated()"
      [class.active:cursor-grabbing]="!allocated()"
    >
      <!-- Top row: name + cost band -->
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <div class="font-medium text-content text-sm truncate">{{ dev().pseudonym | resolveName }}</div>
          <div class="text-xs text-content-muted mt-0.5">{{ dev().role }}</div>
        </div>
        <span
          [class]="costBandClass(dev().costBand)"
          class="text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0"
          [matTooltip]="'Cost band ' + dev().costBand"
        >{{ dev().costBand }}</span>
      </div>

      <!-- Skill chips with proficiency dots -->
      <div class="flex flex-wrap gap-1 mt-2">
        @for (skill of topSkills(); track skill.tech) {
          <span
            class="text-[10px] px-1.5 py-0.5 rounded bg-surface text-content-muted flex items-center gap-1"
            [matTooltip]="skill.tech + ' · ' + proficiencyLabel(skill.proficiency)"
          >
            {{ skill.tech }}
            <span class="tracking-tighter text-brand-accent" aria-hidden="true">{{ dotString(skill.proficiency) }}</span>
            <span class="sr-only">{{ skill.proficiency }} out of 5</span>
          </span>
        }
      </div>

      <!-- Available text (bench, partially allocated) -->
      @if (!allocated() && showAvailable()) {
        <div class="mt-2 text-[11px] text-content-muted">
          Available: <span class="font-semibold text-content">{{ availablePercent() }}%</span>
        </div>
      }

      <!-- Allocated controls: inline slider + remove -->
      @if (allocated()) {
        <div class="mt-3 pt-2 border-t border-surface/80">
          <div class="flex items-center justify-between mb-1">
            <span class="text-[11px] text-content-muted">Allocation</span>
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-brand-accent">{{ allocationPercent() }}%</span>
              <button
                type="button"
                class="text-content-muted hover:text-red-400 transition-colors leading-none"
                (click)="remove.emit()"
                [matTooltip]="'Remove from scenario'"
                aria-label="Remove allocation"
              >
                <mat-icon class="!text-base !w-4 !h-4">close</mat-icon>
              </button>
            </div>
          </div>
          <mat-slider
            [min]="1"
            [max]="sliderMax()"
            step="5"
            class="w-full slider-brand"
            discrete
          >
            <input
              matSliderThumb
              [value]="allocationPercent()"
              (valueChange)="allocationChange.emit($event)"
              [attr.aria-label]="'Allocation percent for ' + (dev().pseudonym | resolveName)"
            />
          </mat-slider>
        </div>
      }
    </div>
  `,
  styles: [`
    :host ::ng-deep .slider-brand .mdc-slider__track--active_fill {
      background-color: var(--brand-primary) !important;
    }
    :host ::ng-deep .slider-brand .mdc-slider__thumb-knob {
      background-color: var(--brand-primary) !important;
      border-color: var(--brand-primary) !important;
    }
    :host ::ng-deep .slider-brand .mdc-slider__track--inactive {
      background-color: var(--surface) !important;
    }
    .sr-only {
      position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
      overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;
    }
  `],
})
export class DeveloperCardComponent {
  readonly dev = input.required<Developer>();
  /** When true the card is in a scenario column and shows allocation controls. */
  readonly allocated = input<boolean>(false);
  /** Current allocation percent (scenario columns only). */
  readonly allocationPercent = input<number>(0);
  /**
   * Max selectable percent for the inline slider = this dev's current allocation
   * here plus their remaining free capacity elsewhere.
   */
  readonly sliderMax = input<number>(100);
  /** Remaining free capacity (bench cards). */
  readonly availablePercent = input<number>(100);

  readonly allocationChange = output<number>();
  readonly remove = output<void>();

  readonly topSkills = computed(() =>
    [...this.dev().skills].sort((a, b) => b.proficiency - a.proficiency).slice(0, 3)
  );

  readonly showAvailable = computed(() => this.availablePercent() < 100);

  costBandClass(band: string): string {
    const map: Record<string, string> = {
      C1: 'bg-slate-500/20 text-slate-300',
      C2: 'bg-blue-500/20 text-blue-400',
      C3: 'bg-amber-500/20 text-amber-400',
      C4: 'bg-orange-500/20 text-orange-400',
      C5: 'bg-red-500/20 text-red-400',
    };
    return map[band] ?? 'bg-slate-500/20 text-slate-300';
  }

  /** ●●●○○ style indicator for a 1–5 proficiency. */
  dotString(proficiency: number): string {
    const filled = Math.max(0, Math.min(5, Math.round(proficiency)));
    return '●'.repeat(filled) + '○'.repeat(5 - filled);
  }

  proficiencyLabel(proficiency: number): string {
    const labels = ['', 'Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'];
    return labels[proficiency] ?? `${proficiency}/5`;
  }
}
