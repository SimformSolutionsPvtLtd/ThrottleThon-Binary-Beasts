import {
  Component, OnDestroy, computed, effect, inject, input, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ForecastStateService } from '../../../core/services/forecast-state.service';
import { ApiService } from '../../../core/services/api.service';
import { DebateEntry, DebateResult, KeyRisk } from '../../../core/models/debate.model';
import { resolveAgent } from '../agent-meta';
import { AgentCardComponent } from './agent-card.component';

interface RiskView extends KeyRisk {
  agentName: string;
}

const SEVERITY_ORDER: Record<KeyRisk['severity'], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

/**
 * Vertical timeline visualisation of a completed AI debate. Mounted both inline
 * on the dashboard (via the {@link scenarioExternalId} input) and as a full-page
 * route at `/debate/:scenarioExternalId`. Reads cached results from
 * {@link ForecastStateService.debateResults}; if absent on the route, fetches.
 */
@Component({
  selector: 'ss-debate-timeline',
  standalone: true,
  imports: [
    CommonModule,
    MatExpansionModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    AgentCardComponent,
  ],
  template: `
    @if (result(); as r) {
      <div class="space-y-4">
        <!-- Round panels -->
        <mat-accordion multi class="block space-y-3">
          @for (round of rounds(); track round.number) {
            <mat-expansion-panel
              [expanded]="round.number === 1"
              class="debate-panel"
            >
              <mat-expansion-panel-header>
                <mat-panel-title class="font-semibold text-content">
                  Round {{ round.number }}
                </mat-panel-title>
                <mat-panel-description class="text-content-muted text-sm">
                  {{ round.entries.length }} argument{{ round.entries.length === 1 ? '' : 's' }}
                </mat-panel-description>
              </mat-expansion-panel-header>

              <div class="space-y-3 pt-1">
                @for (entry of round.entries; track entry.agent + $index) {
                  <ss-agent-card [entry]="entry" />
                }
              </div>
            </mat-expansion-panel>
          }
        </mat-accordion>

        <!-- Synthesis -->
        <div class="bg-surface rounded-xl p-6 border-l-4 border-green-400">
          <div class="flex items-center gap-2 mb-4">
            <mat-icon class="text-green-400">balance</mat-icon>
            <h3 class="text-base font-semibold text-content">Synthesis</h3>
          </div>

          <div class="flex flex-wrap items-center gap-8 mb-5">
            <!-- Friction factor -->
            <div>
              <div class="text-xs text-content-muted uppercase tracking-wide mb-1">Friction Factor</div>
              <div class="text-4xl font-bold text-content">{{ r.frictionFactor | number:'1.1-2' }}x</div>
            </div>

            <!-- Confidence circular -->
            <div class="flex items-center gap-3">
              <div class="relative inline-flex items-center justify-center">
                <mat-progress-spinner
                  mode="determinate"
                  [value]="confidencePercent()"
                  [diameter]="72"
                  [strokeWidth]="6"
                  class="confidence-ring"
                ></mat-progress-spinner>
                <span class="absolute text-sm font-bold text-content">{{ confidencePercent() }}%</span>
              </div>
              <div class="text-xs text-content-muted uppercase tracking-wide">Confidence<br />Score</div>
            </div>
          </div>

          @if (synthesisEntry(); as synth) {
            <p class="text-sm text-content-muted leading-relaxed whitespace-pre-line">{{ typedText() }}</p>
          }
        </div>

        <!-- Key risks -->
        @if (sortedRisks().length) {
          <div class="bg-surface-raised rounded-xl p-6">
            <h3 class="text-sm font-semibold text-content-muted uppercase tracking-wide mb-4">Key Risks</h3>
            <div class="space-y-3">
              @for (risk of sortedRisks(); track risk.risk) {
                <div class="bg-surface rounded-lg p-4">
                  <div class="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span
                      class="text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wide"
                      [ngClass]="severityClass(risk.severity)"
                    >{{ risk.severity }}</span>
                    <span class="text-[11px] px-2 py-0.5 rounded-full bg-surface-overlay text-content-muted font-medium">
                      {{ risk.agentName }}
                    </span>
                  </div>
                  <p class="text-sm text-content">{{ risk.risk }}</p>
                  @if (risk.evidence) {
                    <p class="text-xs text-content-muted mt-1">{{ risk.evidence }}</p>
                  }
                </div>
              }
            </div>
          </div>
        }

        <!-- Meta bar -->
        <div class="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-content-muted px-1">
          @if (isLive()) {
            <span class="text-green-400 font-medium">Live AI ✓</span>
          } @else {
            <span class="text-amber-400 font-medium">Demo Mode</span>
          }
          @if (r.meta.totalDurationMs) {
            <span>Completed in {{ durationSeconds() }}s</span>
          }
          @if (r.meta.roundsCompleted != null) {
            <span>{{ r.meta.roundsCompleted }}/2 rounds completed</span>
          }
        </div>
      </div>
    } @else if (isFetching()) {
      <div class="flex items-center justify-center py-12">
        <mat-spinner diameter="32"></mat-spinner>
      </div>
    } @else {
      <div class="bg-surface-raised rounded-xl p-8 text-center text-content-muted">
        <mat-icon class="text-4xl mb-2 opacity-50">psychology</mat-icon>
        <p class="text-sm">No debate results yet. Run an AI debate to see the analysis.</p>
      </div>
    }
  `,
  styles: [`
    :host ::ng-deep .debate-panel.mat-expansion-panel {
      background-color: var(--surface-raised) !important;
      color: var(--content) !important;
      box-shadow: none !important;
      border: 1px solid var(--surface-overlay);
      border-radius: 0.75rem !important;
    }
    :host ::ng-deep .debate-panel .mat-expansion-panel-header-description,
    :host ::ng-deep .debate-panel .mat-expansion-indicator::after {
      color: var(--content-muted);
    }
    :host ::ng-deep .confidence-ring circle {
      stroke: var(--success, #4ADE80);
    }
  `],
})
export class DebateTimelineComponent implements OnDestroy {
  /**
   * Scenario to display. Bound from the parent on the dashboard, and from the
   * route param on the full-page view (router `withComponentInputBinding`).
   * When unset, falls back to the first active scenario.
   */
  readonly scenarioExternalId = input<string | undefined>(undefined);

  private readonly state = inject(ForecastStateService);
  private readonly api = inject(ApiService);

  /** Result fetched directly when not present in the shared cache. */
  private readonly fetched = signal<DebateResult | null>(null);
  readonly isFetching = signal(false);
  private fetchedId: string | null = null;

  /** Effective scenario id: explicit input/route param → first active scenario. */
  readonly effectiveId = computed(() =>
    this.scenarioExternalId()
      ?? this.state.activeScenarioIds()[0]
      ?? null,
  );

  readonly result = computed<DebateResult | null>(() => {
    const id = this.effectiveId();
    if (!id) return null;
    return this.state.debateResults().get(id) ?? this.fetched();
  });

  readonly rounds = computed(() => {
    const r = this.result();
    if (!r) return [];
    const byRound = new Map<number, DebateEntry[]>();
    for (const entry of r.debateLog) {
      // Synthesizer is rendered separately, not in the round panels.
      if (resolveAgent(entry.agent).key === 'synthesizer') continue;
      const list = byRound.get(entry.round) ?? [];
      list.push(entry);
      byRound.set(entry.round, list);
    }
    return [...byRound.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([number, entries]) => ({ number, entries }));
  });

  readonly synthesisEntry = computed<DebateEntry | null>(() => {
    const r = this.result();
    if (!r) return null;
    return r.debateLog.find(e => resolveAgent(e.agent).key === 'synthesizer') ?? null;
  });

  readonly sortedRisks = computed<RiskView[]>(() => {
    const r = this.result();
    if (!r) return [];
    return [...r.keyRisks]
      .map(risk => ({ ...risk, agentName: resolveAgent(risk.sourceAgent).name }))
      .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  });

  readonly confidencePercent = computed(() => Math.round((this.result()?.confidenceScore ?? 0) * 100));
  readonly durationSeconds = computed(() => ((this.result()?.meta.totalDurationMs ?? 0) / 1000).toFixed(1));
  readonly isLive = computed(() => this.result()?.meta.mode === 'live');

  // ── Typewriter animation for the synthesis summary ──────────────────────────
  readonly typedText = signal('');
  private typewriterId?: ReturnType<typeof setInterval>;
  private lastTypedSource = '';

  constructor() {
    // Re-run the typewriter whenever the synthesis text changes.
    effect(() => {
      const source = this.synthesisEntry()?.argument ?? '';
      if (source === this.lastTypedSource) return;
      this.lastTypedSource = source;
      this.startTypewriter(source);
    });

    // Fetch directly when an id resolves that is not in the shared cache
    // (e.g. arriving on the full-page route without running a debate first).
    effect(() => {
      const id = this.effectiveId();
      if (!id) return;
      if (this.state.debateResults().has(id)) return;
      if (this.fetchedId === id) return;
      this.fetchedId = id;
      this.fetchResult(id);
    });
  }

  ngOnDestroy(): void {
    if (this.typewriterId) clearInterval(this.typewriterId);
  }

  severityClass(severity: KeyRisk['severity']): string {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400';
      case 'high': return 'bg-orange-500/20 text-orange-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-500';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  }

  private fetchResult(scenarioExternalId: string): void {
    this.isFetching.set(true);
    this.api.getDebateResult(scenarioExternalId).subscribe({
      next: (res) => {
        this.fetched.set(res);
        this.isFetching.set(false);
      },
      error: () => this.isFetching.set(false),
    });
  }

  private startTypewriter(text: string): void {
    if (this.typewriterId) clearInterval(this.typewriterId);
    if (!text) {
      this.typedText.set('');
      return;
    }
    let i = 0;
    this.typedText.set('');
    this.typewriterId = setInterval(() => {
      i++;
      this.typedText.set(text.slice(0, i));
      if (i >= text.length && this.typewriterId) {
        clearInterval(this.typewriterId);
        this.typewriterId = undefined;
      }
    }, 10);
  }
}
