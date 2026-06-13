import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { ASSIGNABLE_ROLES } from '../../../core/models/roles';
import { AddMemberRequest } from '../../../core/models/tenant.model';

@Component({
  selector: 'ss-invite-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title class="text-content">Invite User</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content class="space-y-2 !pt-2">
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>Email</mat-label>
          <input matInput type="email" formControlName="email" />
        </mat-form-field>

        <div class="grid grid-cols-2 gap-3">
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>First Name</mat-label>
            <input matInput formControlName="firstName" />
          </mat-form-field>
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>Last Name</mat-label>
            <input matInput formControlName="lastName" />
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>Role</mat-label>
          <mat-select formControlName="roleName">
            @for (r of roles; track r.value) {
              <mat-option [value]="r.value">{{ r.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>Temporary Password</mat-label>
          <input matInput type="text" formControlName="password" />
          <mat-hint>Required for new users (min 8 chars).</mat-hint>
        </mat-form-field>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="ref.close()">Cancel</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">Invite</button>
      </mat-dialog-actions>
    </form>
  `,
})
export class InviteUserDialogComponent {
  private readonly fb = inject(FormBuilder);
  readonly ref = inject(MatDialogRef<InviteUserDialogComponent, AddMemberRequest>);
  readonly roles = ASSIGNABLE_ROLES;

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    firstName: [''],
    lastName: [''],
    roleName: ['viewer', Validators.required],
    password: ['', [Validators.minLength(8)]],
  });

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.ref.close({
      email: v.email,
      roleName: v.roleName,
      ...(v.firstName ? { firstName: v.firstName } : {}),
      ...(v.lastName ? { lastName: v.lastName } : {}),
      ...(v.password ? { password: v.password } : {}),
    });
  }
}
