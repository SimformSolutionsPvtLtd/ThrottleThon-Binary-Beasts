import { Component, computed, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { DebateEntry } from '../../../core/models/debate.model';
import { resolveAgent } from '../agent-meta';

/**
 * Reusable card rendering a single agent's argument within a debate round.
 * Colour-coded by agent, with a "Read more" toggle for long arguments and a
 * chip list of cited evidence (ticket IDs / metrics).
 */
@Component({
  selector: 'ss-agent-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatChipsModule],
  template: `
    @if (entry(); as e) {
      <div
        class="bg-surface rounded-lg p-4 border-l-4"
        [ngClass]="agent().borderColor"
      >
        <!-- Header -->
        <div class="flex items-center gap-2 mb-2">
          <mat-icon class="text-xl" [ngClass]="agent().iconColor">{{ agent().icon }}</mat-icon>
          <span class="text-sm font-semibold text-content">{{ agent().name }}</span>
          <span class="text-[11px] px-2 py-0.5 rounded-full bg-surface-overlay text-content-muted font-medium">
            {{ agent().role }}
          </span>
        </div>

        <!-- Argument -->
        <p
          class="text-sm text-content-muted leading-relaxed whitespace-pre-line"
          [class.line-clamp-3]="!expanded()"
        >{{ e.argument }}</p>

        @if (isLong()) {
          <button
            type="button"
            class="text-xs text-brand-accent mt-1 hover:underline"
            (click)="expanded.set(!expanded())"
          >
            {{ expanded() ? 'Read less' : 'Read more' }}
          </button>
        }

        <!-- Evidence chips -->
        @if (e.evidenceCited?.length) {
          <mat-chip-set class="mt-3 block">
            @for (ev of e.evidenceCited; track ev) {
              <mat-chip class="evidence-chip text-xs">{{ ev }}</mat-chip>
            }
          </mat-chip-set>
        }
      </div>
    }
  `,
  styles: [`
    :host ::ng-deep .evidence-chip.mat-mdc-chip {
      background-color: var(--surface-overlay) !important;
      color: var(--content) !important;
      min-height: 26px;
    }
    .line-clamp-3 {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `],
})
export class AgentCardComponent {
  readonly entry = input.required<DebateEntry>();

  readonly expanded = signal(false);

  readonly agent = computed(() => resolveAgent(this.entry().agent));

  /** Heuristic: long enough that line-clamp-3 would hide content. */
  readonly isLong = computed(() => (this.entry().argument?.length ?? 0) > 180);
}
