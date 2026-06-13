import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ForecastStateService } from '../../core/services/forecast-state.service';
import { TenantBrandingService } from '../../core/services/tenant-branding.service';
import { CurrencyInrPipe } from '../../shared/pipes/currency-inr.pipe';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader.component';
import { BriefData, BriefTeamMember } from '../../core/models/brief.model';
import { KeyRisk } from '../../core/models/debate.model';

@Component({
  selector: 'ss-brief',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, CurrencyInrPipe, SkeletonLoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Screen action bar (hidden in print) -->
    <div class="no-print flex items-center justify-between mb-4 max-w-[800px] mx-auto">
      <button mat-stroked-button (click)="back()" class="text-content">
        <mat-icon>arrow_back</mat-icon>
        Back to Dashboard
      </button>
      <button mat-raised-button color="primary" (click)="print()" [disabled]="loading() || !brief()">
        <mat-icon>print</mat-icon>
        Print Brief
      </button>
    </div>

    @if (loading()) {
      <div class="brief-container brief-skeleton">
        <ss-skeleton type="text" [lines]="2" />
        <div class="mt-6"><ss-skeleton type="card" /></div>
        <div class="mt-6"><ss-skeleton type="table" [rows]="4" /></div>
      </div>
    } @else if (error()) {
      <div class="brief-container text-center py-16">
        <mat-icon class="text-red-400 mb-2" style="font-size:40px;width:40px;height:40px;">error_outline</mat-icon>
        <p class="text-content font-medium">Could not generate this brief.</p>
        <p class="text-content-muted text-sm mt-1">{{ error() }}</p>
      </div>
    } @else if (brief(); as b) {
      <article class="brief-container">

        <!-- HEADER -->
        <header class="brief-header">
          <div class="brief-logo">
            @if (b.tenant.logoUrl) {
              <img [src]="b.tenant.logoUrl" [alt]="b.tenant.brandName" />
            } @else {
              <div class="brief-logo-fallback">{{ (b.tenant.brandName || 'SS')[0] }}</div>
            }
            <span class="brand-name">{{ b.tenant.brandName }}</span>
          </div>
          <div class="brief-title-block">
            <h1 class="brief-title">ENGINEERING DECISION BRIEF</h1>
            <p class="brief-date">Generated: {{ b.generatedAt | date: 'longDate' }}</p>
          </div>
        </header>

        <!-- SCENARIO -->
        <section class="brief-section">
          <div class="flex items-center gap-3 flex-wrap">
            <h2 class="scenario-name">{{ b.scenario.name }}</h2>
            <span class="category-badge">{{ b.scenario.category }}</span>
          </div>
          <p class="scenario-desc">{{ b.scenario.description }}</p>
        </section>

        <!-- FORECAST BOX -->
        <section class="forecast-box">
          <div class="forecast-cell">
            <div class="forecast-number">{{ b.forecast.projectTimelineWeeks | number: '1.1-1' }}</div>
            <div class="forecast-label">Weeks</div>
          </div>
          <div class="forecast-cell">
            <div class="forecast-number">{{ b.forecast.projectCost | inr }}</div>
            <div class="forecast-label">Project Cost</div>
          </div>
          <div class="forecast-cell">
            <div class="forecast-number accent">{{ b.forecast.riskAdjustedCost | inr }}</div>
            <div class="forecast-label">Risk-Adjusted</div>
          </div>
          <div class="forecast-cell">
            <div class="forecast-number">{{ b.forecast.confidenceScore | number: '1.0-0' }}%</div>
            <div class="forecast-label">Confidence</div>
          </div>
        </section>

        <!-- TEAM TABLE -->
        <section class="brief-section">
          <h3 class="section-heading">Allocated Team</h3>
          @if (b.team.length) {
            <table class="team-table">
              <thead>
                <tr>
                  <th>Developer</th>
                  <th>Role</th>
                  <th>Cost Band</th>
                  <th>Allocation</th>
                  <th>Top Skills</th>
                </tr>
              </thead>
              <tbody>
                @for (m of b.team; track m.pseudonym) {
                  <tr>
                    <td>{{ displayName(m) }}</td>
                    <td>{{ m.role }}</td>
                    <td>{{ m.costBand }}</td>
                    <td>{{ m.allocationPercent }}%</td>
                    <td>{{ m.topSkills.join(', ') }}</td>
                  </tr>
                }
              </tbody>
            </table>
          } @else {
            <p class="empty-text">No developers allocated to this scenario.</p>
          }
        </section>

        <!-- RISKS -->
        <section class="brief-section">
          <h3 class="section-heading">Key Risks</h3>
          @if (topRisks(b.risks).length) {
            <ol class="risk-list">
              @for (r of topRisks(b.risks); track $index) {
                <li>
                  <span class="risk-emoji">{{ severityEmoji(r.severity) }}</span>
                  <span class="risk-text">{{ r.risk }}</span>
                </li>
              }
            </ol>
          } @else {
            <p class="empty-text">No significant risks surfaced. Run an AI debate for deeper analysis.</p>
          }
        </section>

        <!-- DEBATE SUMMARY -->
        @if (b.debateSummary) {
          <section class="brief-section">
            <h3 class="section-heading">Analysis Summary</h3>
            <p class="debate-summary">{{ b.debateSummary }}</p>
          </section>
        }

        <!-- RECOMMENDATION -->
        <section class="recommendation-box">
          <h3 class="section-heading">Recommendation</h3>
          <p class="recommendation-text">{{ recommendationText(b) }}</p>
        </section>

        <!-- FOOTER -->
        <footer class="brief-footer">
          Powered by SmarterSprint · Confidential — {{ b.tenant.name }}
        </footer>

      </article>
    }
  `,
  styles: [`
    /* ── Screen (dark theme) ─────────────────────────────────────────────── */
    .brief-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
      background: var(--surface-raised, #1E293B);
      color: var(--content, #E2E8F0);
      border-radius: 12px;
      border: 1px solid var(--surface-overlay, #334155);
    }
    .brief-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      padding-bottom: 16px;
      border-bottom: 2px solid var(--surface-overlay, #334155);
    }
    .brief-logo { display: flex; align-items: center; gap: 10px; }
    .brief-logo img { height: 36px; width: 36px; object-fit: contain; border-radius: 6px; }
    .brief-logo-fallback {
      height: 36px; width: 36px; border-radius: 6px;
      background: var(--brand-primary, #2563EB); color: #fff;
      display: flex; align-items: center; justify-content: center; font-weight: 700;
    }
    .brand-name { font-weight: 600; font-size: 1rem; }
    .brief-title-block { text-align: right; }
    .brief-title { font-size: 1.05rem; font-weight: 700; letter-spacing: 0.05em; }
    .brief-date { font-size: 0.8rem; color: var(--content-muted, #94A3B8); margin-top: 2px; }

    .brief-section { margin-top: 24px; }
    .scenario-name { font-size: 1.6rem; font-weight: 700; }
    .category-badge {
      font-size: 0.7rem; text-transform: capitalize; padding: 3px 10px; border-radius: 999px;
      background: rgba(37,99,235,0.18); color: var(--content-accent, #60A5FA);
      border: 1px solid rgba(37,99,235,0.4);
    }
    .scenario-desc { margin-top: 8px; color: var(--content-muted, #94A3B8); line-height: 1.5; }

    .forecast-box {
      margin-top: 24px;
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px;
      background: var(--surface-overlay, #334155);
      border: 1px solid var(--surface-overlay, #334155);
      border-radius: 10px; overflow: hidden;
    }
    .forecast-cell { background: var(--surface, #0F172A); padding: 18px 12px; text-align: center; }
    .forecast-number { font-size: 1.5rem; font-weight: 700; }
    .forecast-number.accent { color: #FBBF24; }
    .forecast-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--content-muted, #94A3B8); margin-top: 4px; }

    .section-heading {
      font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.06em;
      color: var(--content-muted, #94A3B8); font-weight: 600; margin-bottom: 10px;
    }
    .team-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    .team-table th, .team-table td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--surface-overlay, #334155); }
    .team-table th { color: var(--content-muted, #94A3B8); font-weight: 600; }

    .risk-list { list-style: none; counter-reset: risk; padding: 0; margin: 0; }
    .risk-list li {
      counter-increment: risk; display: flex; gap: 10px; padding: 7px 0; align-items: flex-start;
      border-bottom: 1px solid var(--surface-overlay, #334155);
    }
    .risk-list li::before { content: counter(risk) "."; color: var(--content-muted, #94A3B8); font-weight: 600; min-width: 18px; }
    .risk-emoji { flex-shrink: 0; }
    .risk-text { line-height: 1.4; }

    .debate-summary { font-style: italic; line-height: 1.6; color: var(--content, #E2E8F0); }
    .empty-text { color: var(--content-muted, #94A3B8); font-size: 0.875rem; }

    .recommendation-box {
      margin-top: 24px; padding: 16px 18px; border-radius: 10px;
      background: rgba(37,99,235,0.1); border: 1px solid rgba(37,99,235,0.25);
    }
    .recommendation-text { line-height: 1.5; }

    .brief-footer {
      margin-top: 32px; padding-top: 16px; border-top: 1px solid var(--surface-overlay, #334155);
      text-align: center; font-size: 0.72rem; color: var(--content-muted, #94A3B8);
    }

    /* ── Print (A4, clean) ───────────────────────────────────────────────── */
    @media print {
      :host { display: block; }
      .no-print { display: none !important; }
      .brief-container {
        padding: 20px; max-width: 100%; font-size: 11pt;
        background: #fff !important; color: #000 !important;
        border: none !important; border-radius: 0 !important;
      }
      @page { margin: 1.5cm; size: A4; }

      .brief-header { border-bottom: 2px solid #000; }
      .brand-name, .brief-title, .scenario-name, .forecast-number,
      .risk-text, .debate-summary, .recommendation-text, .team-table td { color: #000 !important; }
      .brief-date, .forecast-label, .scenario-desc, .section-heading,
      .team-table th, .empty-text, .brief-footer { color: #444 !important; }

      .forecast-box { background: #fff !important; border: 1px solid #ccc; gap: 0; }
      .forecast-cell { background: #fff !important; border-right: 1px solid #ccc; }
      .forecast-number.accent { color: #000 !important; }

      .category-badge { background: #f0f0f0 !important; color: #000 !important; border: 1px solid #ccc; }
      .recommendation-box { background: #f7f7f7 !important; border: 1px solid #ccc; }

      table { border-collapse: collapse; }
      .team-table td, .team-table th { border: 1px solid #ccc; padding: 6px; }
      .risk-list li, .brief-footer { border-color: #ccc !important; }
    }
  `],
})
export class BriefComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly state = inject(ForecastStateService);
  readonly branding = inject(TenantBrandingService);

  readonly brief = signal<BriefData | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const scenarioExternalId = this.route.snapshot.paramMap.get('scenarioExternalId');
    if (!scenarioExternalId) {
      this.loading.set(false);
      this.error.set('No scenario specified.');
      return;
    }

    const includeRealNames =
      this.state.showRealNames() && this.auth.hasPermission('identity-map:read');

    this.api.generateBrief({ scenarioExternalId, includeRealNames }).subscribe({
      next: (data) => {
        this.brief.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'The brief service is unavailable.');
        this.loading.set(false);
      },
    });
  }

  displayName(m: BriefTeamMember): string {
    // When the brief was generated with real names, the BE supplies realName.
    return m.realName?.trim() ? m.realName : m.pseudonym;
  }

  topRisks(risks: KeyRisk[]): KeyRisk[] {
    const order: Record<KeyRisk['severity'], number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return [...(risks ?? [])].sort((a, b) => order[a.severity] - order[b.severity]).slice(0, 5);
  }

  severityEmoji(severity: KeyRisk['severity']): string {
    switch (severity) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      default: return '⚪';
    }
  }

  recommendationText(b: BriefData): string {
    if (b.recommendation?.reason) return b.recommendation.reason;
    if (b.recommendation) {
      return `Based on analysis, ${b.scenario.name} is recommended given its risk-adjusted cost and confidence profile.`;
    }
    return 'Single scenario analyzed. See the risk section for key considerations before committing.';
  }

  print(): void {
    window.print();
  }

  back(): void {
    this.router.navigate(['/dashboard']);
  }
}
