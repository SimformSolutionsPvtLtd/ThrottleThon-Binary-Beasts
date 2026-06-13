import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ss-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="text-content">
      <h2 class="text-xl font-semibold mb-4">Dashboard</h2>
      <p class="text-content-muted">Phase 1 — data loading coming next.</p>
    </div>
  `,
})
export class DashboardComponent {}
