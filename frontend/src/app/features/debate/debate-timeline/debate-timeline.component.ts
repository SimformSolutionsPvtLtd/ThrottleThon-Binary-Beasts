import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ss-debate-timeline',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="text-content"><h2 class="text-xl font-semibold">Debate Timeline</h2><p class="text-content-muted mt-2">Coming in Phase 4.</p></div>`,
})
export class DebateTimelineComponent {}
