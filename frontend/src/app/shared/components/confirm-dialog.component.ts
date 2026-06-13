import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

@Component({
  selector: 'ss-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title class="text-content">{{ data.title }}</h2>
    <mat-dialog-content>
      <p class="text-content-muted">{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="ref.close(false)">{{ data.cancelText ?? 'Cancel' }}</button>
      <button
        mat-raised-button
        [color]="data.destructive ? 'warn' : 'primary'"
        (click)="ref.close(true)"
      >{{ data.confirmText ?? 'Confirm' }}</button>
    </mat-dialog-actions>
  `,
})
export class ConfirmDialogComponent {
  readonly ref = inject(MatDialogRef<ConfirmDialogComponent, boolean>);
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
}
