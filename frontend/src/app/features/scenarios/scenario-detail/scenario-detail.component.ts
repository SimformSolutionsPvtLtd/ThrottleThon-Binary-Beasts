import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../../core/services/api.service';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader.component';
import { Scenario } from '../../../core/models/scenario.model';

@Component({
  selector: 'ss-scenario-detail',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, SkeletonLoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4 max-w-3xl">
      <button mat-stroked-button (click)="back()" class="text-content">
        <mat-icon>arrow_back</mat-icon>
        Back to Scenarios
      </button>

      @if (loading()) {
        <ss-skeleton type="card" />
      } @else if (scenario(); as s) {
        <div class="bg-surface-raised rounded-xl p-6 border border-surface-overlay space-y-5">
          <div>
            <div class="flex items-center gap-3 flex-wrap">
              <h2 class="text-2xl font-bold text-content">{{ s.name }}</h2>
              <span class="text-xs px-2 py-0.5 rounded-full bg-surface-overlay text-content-muted capitalize">{{ s.category }}</span>
              @if (s.isActive) {
                <span class="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Active</span>
              }
            </div>
            <p class="text-content-muted mt-2">{{ s.description }}</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="bg-surface rounded-lg p-4">
              <div class="text-xs text-content-muted">Base Effort</div>
              <div class="text-lg font-semibold text-content">{{ s.baseEffortPoints }} pts</div>
            </div>
            <div class="bg-surface rounded-lg p-4">
              <div class="text-xs text-content-muted">External ID</div>
              <div class="text-lg font-semibold text-content font-mono">{{ s.externalId }}</div>
            </div>
          </div>

          @if (s.config) {
            <div class="space-y-4">
              <div>
                <h3 class="text-xs uppercase tracking-wide text-content-muted font-semibold mb-2">Risk Factors</h3>
                <div class="flex flex-wrap gap-2">
                  @for (r of s.config.riskFactors; track r) {
                    <span class="text-xs px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20">{{ r }}</span>
                  } @empty { <span class="text-sm text-content-muted">None listed.</span> }
                </div>
              </div>
              <div>
                <h3 class="text-xs uppercase tracking-wide text-content-muted font-semibold mb-2">Assumptions</h3>
                <ul class="list-disc list-inside text-sm text-content space-y-1">
                  @for (a of s.config.assumptions; track a) { <li>{{ a }}</li> }
                  @empty { <li class="list-none text-content-muted">None listed.</li> }
                </ul>
              </div>
              <div>
                <h3 class="text-xs uppercase tracking-wide text-content-muted font-semibold mb-2">Applicable Labels</h3>
                <div class="flex flex-wrap gap-2">
                  @for (l of s.config.applicableLabels; track l) {
                    <span class="text-xs px-2 py-1 rounded bg-surface-overlay text-content-muted">{{ l }}</span>
                  } @empty { <span class="text-sm text-content-muted">None listed.</span> }
                </div>
              </div>
              @if (s.config.expectedOutcome) {
                <div>
                  <h3 class="text-xs uppercase tracking-wide text-content-muted font-semibold mb-2">Expected Outcome</h3>
                  <p class="text-sm text-content">{{ s.config.expectedOutcome }}</p>
                </div>
              }
            </div>
          }
        </div>
      } @else {
        <div class="bg-surface-raised rounded-xl p-12 text-center border border-surface-overlay">
          <p class="text-content-muted">Scenario not found.</p>
        </div>
      }
    </div>
  `,
})
export class ScenarioDetailComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly scenario = signal<Scenario | null>(null);
  readonly loading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('externalId');
    if (!id) {
      this.loading.set(false);
      return;
    }
    this.api.getScenario(id).subscribe({
      next: (s) => {
        this.scenario.set(s);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  back(): void {
    this.router.navigate(['/scenarios']);
  }
}
