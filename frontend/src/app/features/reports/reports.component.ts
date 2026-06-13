import { Component, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'ss-reports',
  standalone: true,
  imports: [MatCardModule],
  template: `
    <h1 class="text-2xl font-semibold mb-4">Reports</h1>
    <mat-card class="p-4">
      <p>Executive briefs (CEO/CFO/CTO) — POST /reports/brief.</p>
    </mat-card>
  `,
})
export class ReportsComponent {
  readonly briefs = signal<string[]>([]);
}
