import {
  ChangeDetectionStrategy,
  Component,
  ErrorHandler,
  Injectable,
  Input,
  Output,
  EventEmitter,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

/**
 * Section-level error boundary. Wrap a piece of UI; if rendering its
 * projected content throws (caught via the scoped ErrorHandler below), it
 * swaps to a "Something went wrong" panel with a Retry button instead of
 * letting the whole page crash.
 *
 * Usage:
 *   <ss-error-boundary (retry)="reload()">
 *     <ss-some-widget />
 *   </ss-error-boundary>
 *
 * Provide the scoped handler so errors thrown inside this component's view
 * are routed here rather than bubbling to the global ErrorHandler.
 */
@Injectable()
export class BoundaryErrorHandler implements ErrorHandler {
  private host: ErrorBoundaryComponent | null = null;

  register(host: ErrorBoundaryComponent): void {
    this.host = host;
  }

  handleError(error: unknown): void {
    // Surface to the boundary, then still log so the error isn't swallowed.
    this.host?.onError(error);
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error);
  }
}

@Component({
  selector: 'ss-error-boundary',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    BoundaryErrorHandler,
    { provide: ErrorHandler, useExisting: BoundaryErrorHandler },
  ],
  template: `
    @if (hasError()) {
      <div class="bg-surface-raised border border-red-500/30 rounded-xl p-6 text-center">
        <mat-icon class="text-red-400 mb-2" style="font-size:32px;width:32px;height:32px;">error_outline</mat-icon>
        <p class="text-content font-medium mb-1">{{ label }}</p>
        <p class="text-content-muted text-sm mb-4">This section failed to load. The rest of the page is unaffected.</p>
        <button mat-stroked-button (click)="onRetry()" class="text-content">
          <mat-icon>refresh</mat-icon>
          Retry
        </button>
      </div>
    } @else {
      <ng-content />
    }
  `,
})
export class ErrorBoundaryComponent {
  @Input() label = 'Something went wrong in this section.';
  @Output() retry = new EventEmitter<void>();

  readonly hasError = signal(false);

  constructor(private readonly handler: BoundaryErrorHandler) {
    this.handler.register(this);
  }

  onError(_error: unknown): void {
    this.hasError.set(true);
  }

  onRetry(): void {
    this.hasError.set(false);
    this.retry.emit();
  }
}
