import { Component, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { DebateResult } from '../../core/models/debate.model';

@Component({
  selector: 'ss-debate',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <h1 class="text-2xl font-semibold mb-4">Debate</h1>
    <button mat-flat-button color="primary" (click)="run()" [disabled]="loading()">
      Run debate
    </button>
    @if (loading()) {
      <mat-spinner diameter="30" class="my-4"></mat-spinner>
    }
    @if (result(); as r) {
      <mat-card class="mt-4 p-4">
        <div class="font-semibold">Confidence: {{ (r.confidenceScore * 100).toFixed(1) }}%</div>
        <div>Friction: {{ (r.frictionFactor * 100).toFixed(1) }}%</div>
        @if (r.keyRisks?.length) {
          <ul class="list-disc ml-6 mt-2">
            @for (risk of r.keyRisks; track risk.risk) {
              <li>{{ risk.risk }} ({{ risk.severity }})</li>
            }
          </ul>
        }
      </mat-card>
    }
  `,
})
export class DebateComponent {
  private readonly api = inject(ApiService);
  readonly loading = signal(false);
  readonly result = signal<DebateResult | null>(null);

  async run() {
    this.loading.set(true);
    try {
      const scenarios = await firstValueFrom(this.api.getScenarios());
      const scenarioExternalId = scenarios[0]?.externalId;
      if (!scenarioExternalId) return;
      const results = await firstValueFrom(this.api.runDebate([scenarioExternalId]));
      this.result.set(results[0] ?? null);
    } finally {
      this.loading.set(false);
    }
  }
}
