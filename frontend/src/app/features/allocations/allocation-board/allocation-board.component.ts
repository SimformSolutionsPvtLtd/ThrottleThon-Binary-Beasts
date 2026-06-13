import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ss-allocation-board',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="text-content"><h2 class="text-xl font-semibold">Allocations</h2><p class="text-content-muted mt-2">Coming in Phase 3.</p></div>`,
})
export class AllocationBoardComponent {}
