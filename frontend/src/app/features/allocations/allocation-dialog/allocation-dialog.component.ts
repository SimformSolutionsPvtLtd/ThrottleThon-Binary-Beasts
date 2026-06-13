import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSliderModule } from '@angular/material/slider';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Scenario } from '../../../core/models/scenario.model';
import { Developer } from '../../../core/models/developer.model';

export interface AllocationDialogData {
  developer: Developer;
  /** When coming from keyboard (bench card), user picks the target scenario */
  availableScenarios: Scenario[];
  /** Pre-selected target scenario externalId (drag from bench to specific scenario) */
  targetScenarioExternalId: string | null;
  /** Max allocation available for this dev */
  maxPercent: number;
}

export interface AllocationDialogResult {
  scenarioExternalId: string;
  allocationPercent: number;
}

@Component({
  selector: 'ss-allocation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatSliderModule,
    MatSelectModule,
    MatFormFieldModule,
  ],
  template: `
    <div class="bg-surface-raised text-content min-w-[360px]">
      <!-- Header -->
      <div class="px-6 pt-6 pb-4 border-b border-surface-overlay">
        <h2 mat-dialog-title class="!text-base !font-semibold !text-content !m-0">
          Allocate Developer
        </h2>
        <p class="text-xs text-content-muted mt-1">
          <span class="font-medium text-content">{{ data.developer.pseudonym }}</span>
          &nbsp;·&nbsp;{{ data.developer.role }}&nbsp;·&nbsp;{{ data.developer.costBand }}
        </p>
      </div>

      <mat-dialog-content class="!px-6 !py-4 space-y-4">

        <!-- Scenario picker (keyboard path only — hidden when target already selected) -->
        @if (!data.targetScenarioExternalId) {
          <mat-form-field appearance="fill" class="w-full">
            <mat-label>Allocate to scenario</mat-label>
            <mat-select [(ngModel)]="selectedScenarioId">
              @for (s of data.availableScenarios; track s.externalId) {
                <mat-option [value]="s.externalId">{{ s.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        } @else {
          <div class="text-sm">
            <span class="text-content-muted">Scenario: </span>
            <span class="font-medium text-content">{{ targetScenarioName() }}</span>
          </div>
        }

        <!-- Allocation slider -->
        <div>
          <div class="flex items-center justify-between text-sm mb-1">
            <span class="text-content-muted">Allocation</span>
            <span class="font-bold text-brand-accent text-base">{{ percent() }}%</span>
          </div>
          <mat-slider [min]="5" [max]="data.maxPercent" [step]="5" class="w-full" discrete>
            <input
              matSliderThumb
              [value]="percent()"
              (valueChange)="percent.set($event)"
            />
          </mat-slider>
          <div class="flex justify-between text-[10px] text-content-muted mt-0.5">
            <span>5%</span>
            <span>Max available: {{ data.maxPercent }}%</span>
          </div>
        </div>

      </mat-dialog-content>

      <mat-dialog-actions class="!px-6 !pb-5 !pt-2 flex gap-2 justify-end">
        <button mat-button mat-dialog-close class="text-content-muted">Cancel</button>
        <button
          mat-flat-button
          color="primary"
          [disabled]="!canConfirm()"
          (click)="confirm()"
        >Allocate {{ percent() }}%</button>
      </mat-dialog-actions>
    </div>
  `,
})
export class AllocationDialogComponent {
  readonly data = inject<AllocationDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<AllocationDialogComponent, AllocationDialogResult>);

  selectedScenarioId = this.data.targetScenarioExternalId ?? '';
  readonly percent = signal(Math.min(this.data.maxPercent, 100));

  readonly canConfirm = computed(() =>
    !!this.selectedScenarioId && this.percent() >= 5
  );

  readonly targetScenarioName = computed(() =>
    this.data.availableScenarios.find(s => s.externalId === this.data.targetScenarioExternalId)?.name ?? ''
  );

  confirm(): void {
    if (!this.canConfirm()) return;
    this.dialogRef.close({
      scenarioExternalId: this.selectedScenarioId,
      allocationPercent: this.percent(),
    });
  }
}
