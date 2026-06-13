import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SkeletonType = 'text' | 'card' | 'chart' | 'table';

/**
 * Reusable animated placeholder. Renders a shimmer shape matching the
 * silhouette of the real content while it loads.
 *
 * Usage: <ss-skeleton type="card" />  |  <ss-skeleton type="text" [lines]="3" />
 */
@Component({
  selector: 'ss-skeleton',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (type()) {
      @case ('text') {
        <div class="space-y-2">
          @for (l of lineArray(); track $index) {
            <div class="skeleton h-3 rounded" [style.width]="$last ? '60%' : '100%'"></div>
          }
        </div>
      }
      @case ('card') {
        <div class="bg-surface-raised rounded-xl p-5 border border-surface-overlay">
          <div class="skeleton h-4 w-2/5 rounded mb-4"></div>
          <div class="grid grid-cols-2 gap-3">
            @for (c of [1,2,3,4]; track c) {
              <div class="bg-surface rounded-lg p-3">
                <div class="skeleton h-3 w-16 rounded mb-2"></div>
                <div class="skeleton h-6 w-20 rounded"></div>
              </div>
            }
          </div>
        </div>
      }
      @case ('chart') {
        <div class="bg-surface-raised rounded-xl p-6 border border-surface-overlay">
          <div class="skeleton h-4 w-1/3 rounded mb-6"></div>
          <div class="flex items-end gap-4 h-48">
            @for (b of barHeights; track $index) {
              <div class="skeleton flex-1 rounded-t" [style.height.%]="b"></div>
            }
          </div>
        </div>
      }
      @case ('table') {
        <div class="bg-surface-raised rounded-xl p-4 border border-surface-overlay">
          <div class="skeleton h-4 w-1/4 rounded mb-4"></div>
          @for (r of rowArray(); track $index) {
            <div class="flex items-center gap-4 py-3 border-b border-surface-overlay/50">
              <div class="skeleton h-3 w-1/4 rounded"></div>
              <div class="skeleton h-3 w-1/5 rounded"></div>
              <div class="skeleton h-3 w-1/6 rounded"></div>
              <div class="skeleton h-3 flex-1 rounded"></div>
            </div>
          }
        </div>
      }
    }
  `,
  styles: [`
    .skeleton {
      background: linear-gradient(
        90deg,
        var(--surface-overlay, #334155) 25%,
        rgba(148, 163, 184, 0.18) 37%,
        var(--surface-overlay, #334155) 63%
      );
      background-size: 400% 100%;
      animation: ss-shimmer 1.4s ease infinite;
    }
    @keyframes ss-shimmer {
      0% { background-position: 100% 0; }
      100% { background-position: -100% 0; }
    }
    @media (prefers-reduced-motion: reduce) {
      .skeleton { animation: none; }
    }
  `],
})
export class SkeletonLoaderComponent {
  readonly type = input<SkeletonType>('text');
  readonly lines = input<number>(3);
  readonly rows = input<number>(5);

  readonly barHeights = [55, 80, 45, 95, 60, 75];

  lineArray(): number[] {
    return Array.from({ length: this.lines() });
  }
  rowArray(): number[] {
    return Array.from({ length: this.rows() });
  }
}
