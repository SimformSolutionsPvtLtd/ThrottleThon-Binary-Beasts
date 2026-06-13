import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Scenario } from '../../../core/models/scenario.model';

export interface ScenarioFormResult {
  externalId: string;
  name: string;
  description: string;
  category: string;
  baseEffortPoints: number;
  config: {
    riskFactors: string[];
    assumptions: string[];
    applicableLabels: string[];
    expectedOutcome: string;
  };
}

export interface ScenarioFormData {
  /** When present, the dialog edits an existing scenario instead of creating. */
  scenario?: Scenario;
}

@Component({
  selector: 'ss-scenario-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title class="text-content">{{ isEdit ? 'Edit Scenario' : 'Create Scenario' }}</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content class="space-y-2 !pt-2">
        <div class="grid grid-cols-2 gap-3">
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>External ID</mat-label>
            <input matInput formControlName="externalId" placeholder="full-migration" />
          </mat-form-field>
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>Category</mat-label>
            <input matInput formControlName="category" placeholder="migration" />
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" placeholder="Full Platform Migration" />
        </mat-form-field>

        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="2"></textarea>
        </mat-form-field>

        <div class="grid grid-cols-2 gap-3">
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>Base Effort (pts)</mat-label>
            <input matInput type="number" formControlName="baseEffortPoints" min="1" />
          </mat-form-field>
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>Applicable Labels (comma-separated)</mat-label>
            <input matInput formControlName="applicableLabels" placeholder="backend, api" />
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>Risk Factors (comma-separated)</mat-label>
          <input matInput formControlName="riskFactors" placeholder="data loss, downtime" />
        </mat-form-field>

        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>Expected Outcome</mat-label>
          <input matInput formControlName="expectedOutcome" />
        </mat-form-field>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="cancel()">Cancel</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">
          {{ isEdit ? 'Save' : 'Create' }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
})
export class ScenarioFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly ref = inject(MatDialogRef<ScenarioFormDialogComponent, ScenarioFormResult>);
  private readonly data = inject<ScenarioFormData>(MAT_DIALOG_DATA);

  readonly isEdit = !!this.data?.scenario;

  readonly form = this.fb.nonNullable.group({
    externalId: [{ value: this.data?.scenario?.externalId ?? '', disabled: this.isEdit }, Validators.required],
    name: [this.data?.scenario?.name ?? '', Validators.required],
    description: [this.data?.scenario?.description ?? '', Validators.required],
    category: [this.data?.scenario?.category ?? '', Validators.required],
    baseEffortPoints: [this.data?.scenario?.baseEffortPoints ?? 100, [Validators.required, Validators.min(1)]],
    applicableLabels: [(this.data?.scenario?.config?.applicableLabels ?? []).join(', ')],
    riskFactors: [(this.data?.scenario?.config?.riskFactors ?? []).join(', ')],
    expectedOutcome: [this.data?.scenario?.config?.expectedOutcome ?? ''],
  });

  private splitList(value: string): string[] {
    return value.split(',').map(s => s.trim()).filter(Boolean);
  }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.ref.close({
      externalId: v.externalId,
      name: v.name,
      description: v.description,
      category: v.category,
      baseEffortPoints: Number(v.baseEffortPoints),
      config: {
        applicableLabels: this.splitList(v.applicableLabels),
        riskFactors: this.splitList(v.riskFactors),
        assumptions: this.data?.scenario?.config?.assumptions ?? [],
        expectedOutcome: v.expectedOutcome,
      },
    });
  }

  cancel(): void {
    this.ref.close();
  }
}
