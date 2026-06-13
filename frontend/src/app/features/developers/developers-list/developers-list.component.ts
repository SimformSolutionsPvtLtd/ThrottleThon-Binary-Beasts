import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ss-developers-list',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="text-content"><h2 class="text-xl font-semibold">Developers</h2><p class="text-content-muted mt-2">Coming in Phase 1.</p></div>`,
})
export class DevelopersListComponent {}
