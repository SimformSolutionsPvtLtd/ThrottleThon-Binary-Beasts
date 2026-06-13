import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ss-brief',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="text-content"><h2 class="text-xl font-semibold">Executive Brief</h2><p class="text-content-muted mt-2">Coming in Phase 5.</p></div>`,
})
export class BriefComponent {}
