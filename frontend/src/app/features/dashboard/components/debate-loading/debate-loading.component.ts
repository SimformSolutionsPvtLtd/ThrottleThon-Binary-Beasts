import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AGENTS, LOADING_AGENT_ORDER } from '../../../debate/agent-meta';

/**
 * Simulated progress display shown while the AI debate runs. The backend does
 * not stream real-time updates, so we cycle through the agents every 3s to
 * convey activity, while an elapsed timer ticks every second.
 */
@Component({
  selector: 'ss-debate-loading',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressBarModule],
  template: `
    <div class="bg-surface-raised rounded-xl p-8">
      <!-- Agent row -->
      <div class="flex items-center justify-center gap-8 sm:gap-12 mb-8">
        @for (agent of agents; track agent.key; let i = $index) {
          <div class="flex flex-col items-center gap-2">
            <div
              class="relative h-16 w-16 rounded-full flex items-center justify-center bg-surface border border-surface-overlay transition-transform"
              [class.agent-pulse]="i === activeIndex()"
              [class.opacity-50]="i > activeIndex()"
            >
              <mat-icon class="agent-icon" [ngClass]="agent.iconColor">{{ agent.icon }}</mat-icon>

              @if (i < activeIndex()) {
                <span class="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-green-500 flex items-center justify-center border-2 border-surface-raised">
                  <mat-icon class="check-icon text-white">check</mat-icon>
                </span>
              }
            </div>
            <span
              class="text-xs font-medium"
              [class.text-content]="i === activeIndex()"
              [class.text-content-muted]="i !== activeIndex()"
            >{{ agent.name }}</span>
          </div>
        }
      </div>

      <!-- Status -->
      <div class="text-center mb-4">
        <p class="text-sm font-medium text-content">{{ statusText() }}</p>
      </div>

      <!-- Progress bar -->
      <mat-progress-bar mode="indeterminate" class="rounded-full overflow-hidden"></mat-progress-bar>

      <!-- Timer + helper -->
      <div class="flex items-center justify-between mt-4 text-xs text-content-muted">
        <span>Running for {{ elapsedSeconds() }}s…</span>
        <span>This typically takes 15–25 seconds</span>
      </div>
    </div>
  `,
  styles: [`
    .agent-icon {
      font-size: 28px;
      height: 28px;
      width: 28px;
    }
    .check-icon {
      font-size: 16px;
      height: 16px;
      width: 16px;
    }
    .agent-pulse {
      animation: agent-pulse 1.4s ease-in-out infinite;
    }
    @keyframes agent-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.15); }
    }
    :host ::ng-deep .mat-mdc-progress-bar {
      --mdc-linear-progress-active-indicator-color: var(--brand-primary);
    }
  `],
})
export class DebateLoadingComponent implements OnInit, OnDestroy {
  readonly agents = LOADING_AGENT_ORDER.map(key => AGENTS[key]);

  readonly elapsedSeconds = signal(0);
  private readonly tick = signal(0);

  /** Which agent is "active" — advances one step every 3s, capped at last. */
  readonly activeIndex = computed(() => Math.min(this.tick(), this.agents.length - 1));

  readonly statusText = computed(() => {
    const idx = this.activeIndex();
    const agent = this.agents[idx];
    const round = idx < this.agents.length - 1 ? 1 : 2;
    if (agent.key === 'synthesizer') {
      return `Round ${round} — Synthesizer is weighing the arguments…`;
    }
    return `Round ${round} — ${agent.name} is analyzing the evidence…`;
  });

  private timerId?: ReturnType<typeof setInterval>;
  private agentCycleId?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.timerId = setInterval(() => {
      this.elapsedSeconds.update(s => s + 1);
    }, 1000);

    this.agentCycleId = setInterval(() => {
      this.tick.update(t => t + 1);
    }, 3000);
  }

  ngOnDestroy(): void {
    if (this.timerId) clearInterval(this.timerId);
    if (this.agentCycleId) clearInterval(this.agentCycleId);
  }
}
