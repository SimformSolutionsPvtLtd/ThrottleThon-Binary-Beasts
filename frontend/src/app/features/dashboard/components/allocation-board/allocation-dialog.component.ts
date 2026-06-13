import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSliderModule } from '@angular/material/slider';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

export interface AllocationDialogScenario {
  externalId: string;
  name: string;
}

export interface AllocationDialogData {
  devLabel: string;
  /** Max selectable percent (the developer's available capacity). */
  available: number;
  /** When provided, scenario is fixed (drag flow). Otherwise a dropdown is shown (keyboard flow). */
  scenarioName?: string;
  scenarioExternalId?: string;
  /** Choices for the keyboard flow when no fixed scenario is given. */
  scenarios?: AllocationDialogScenario[];
}

export interface AllocationDialogResult {
  allocationPercent: number;
  scenarioExternalId: string;
}

@Component({
  selector: 'ss-allocation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatSliderModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
  ],
  template: `
    <h2 mat-dialog-title class="!text-base !font-semibold">Allocate {{ data.devLabel }}</h2>

    <mat-dialog-content class="!pt-2">
      @if (data.scenarioName) {
        <p class="text-sm text-content-muted mb-4">
          To <span class="font-medium text-content">{{ data.scenarioName }}</span>
        </p>
      } @else {
        <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
          <mat-label>Allocate to</mat-label>
          <mat-select [(value)]="selectedScenario">
            @for (s of data.scenarios ?? []; track s.externalId) {
              <mat-option [value]="s.externalId">{{ s.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      }

      <div class="mt-4">
        <div class="flex items-center justify-between mb-1">
          <span class="text-sm font-medium text-content">Allocation</span>
          <span class="text-sm font-semibold text-brand-accent">{{ percent() }}%</span>
        </div>
        <mat-slider [min]="5" [max]="data.available" step="5" class="w-full slider-brand" discrete>
          <input
            matSliderThumb
            [value]="percent()"
            (valueChange)="percent.set($event)"
            aria-label="Allocation percent"
          />
        </mat-slider>
        <div class="flex justify-between text-xs text-content-muted mt-1">
          <span>5%</span><span>{{ data.available }}% max</span>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">Cancel</button>
      <button mat-flat-button color="primary" [disabled]="!canConfirm()" (click)="confirm()">Allocate</button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host ::ng-deep .slider-brand .mdc-slider__track--active_fill {
      background-color: var(--brand-primary) !important;
    }
    :host ::ng-deep .slider-brand .mdc-slider__thumb-knob {
      background-color: var(--brand-primary) !important;
      border-color: var(--brand-primary) !important;
    }
  `],
})
export class AllocationDialogComponent {
  readonly data = inject<AllocationDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<AllocationDialogComponent, AllocationDialogResult>);

  // Default to min(available, 100), snapped to the step (5).
  readonly percent = signal<number>(this.snap(Math.min(this.data.available, 100)));
  selectedScenario: string = this.data.scenarioExternalId ?? '';

  private snap(v: number): number {
    const snapped = Math.round(v / 5) * 5;
    return Math.max(5, Math.min(this.data.available, snapped));
  }

  canConfirm(): boolean {
    return !!(this.data.scenarioExternalId || this.selectedScenario);
  }

  confirm(): void {
    const scenarioExternalId = this.data.scenarioExternalId ?? this.selectedScenario;
    if (!scenarioExternalId) return;
    this.ref.close({ allocationPercent: this.percent(), scenarioExternalId });
  }

  cancel(): void {
    this.ref.close();
  }
}
