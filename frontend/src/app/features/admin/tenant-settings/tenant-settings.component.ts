import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { TenantBrandingService } from '../../../core/services/tenant-branding.service';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader.component';
import { UpdateTenantRequest } from '../../../core/models/tenant.model';

@Component({
  selector: 'ss-tenant-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    SkeletonLoaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <ss-skeleton type="card" />
    } @else {
      <form [formGroup]="form" (ngSubmit)="save()" class="grid grid-cols-2 gap-8">

        <!-- Form -->
        <div class="space-y-4">
          <h3 class="text-sm font-semibold text-content-muted uppercase tracking-wide">Branding</h3>

          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
            <mat-label>Brand Name</mat-label>
            <input matInput formControlName="brandName" />
          </mat-form-field>

          <div>
            <label class="block text-sm text-content-muted mb-1">Primary Color</label>
            <div class="flex items-center gap-3">
              <input type="color" formControlName="primaryColor" class="h-10 w-14 rounded cursor-pointer bg-surface border border-surface-overlay" />
              <span class="text-content font-mono text-sm">{{ form.controls.primaryColor.value }}</span>
              <span class="h-8 w-8 rounded-full border border-surface-overlay" [style.background]="form.controls.primaryColor.value || '#2563EB'"></span>
            </div>
          </div>

          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
            <mat-label>Logo URL</mat-label>
            <input matInput formControlName="logoUrl" placeholder="https://…" />
          </mat-form-field>

          @if (form.controls.logoUrl.value) {
            <div class="flex items-center gap-3">
              <span class="text-xs text-content-muted">Logo preview:</span>
              <img [src]="form.controls.logoUrl.value" alt="Logo preview" class="h-10 w-10 rounded object-contain bg-surface border border-surface-overlay" (error)="logoError.set(true)" (load)="logoError.set(false)" />
              @if (logoError()) { <span class="text-xs text-red-400">Image failed to load</span> }
            </div>
          }

          <div class="pt-2">
            <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || saving()">
              <mat-icon>save</mat-icon>
              {{ saving() ? 'Saving…' : 'Save Changes' }}
            </button>
          </div>
        </div>

        <!-- Live preview -->
        <div class="space-y-2">
          <h3 class="text-sm font-semibold text-content-muted uppercase tracking-wide">Live Preview</h3>
          <div class="rounded-xl overflow-hidden border border-surface-overlay" [style.--preview-primary]="previewColor()">
            <!-- mock sidebar header -->
            <div class="flex items-center gap-3 p-4 bg-surface-raised border-b border-surface-overlay">
              @if (form.controls.logoUrl.value && !logoError()) {
                <img [src]="form.controls.logoUrl.value" alt="" class="h-8 w-8 rounded object-contain" />
              } @else {
                <div class="h-8 w-8 rounded flex items-center justify-center text-white font-bold text-sm" [style.background]="previewColor()">
                  {{ (form.controls.brandName.value || 'SS')[0] }}
                </div>
              }
              <span class="font-semibold text-content truncate">{{ form.controls.brandName.value || 'SmarterSprint' }}</span>
            </div>
            <!-- mock nav + button -->
            <div class="p-4 bg-surface space-y-3">
              <div class="flex items-center gap-3 px-3 py-2 rounded text-white" [style.background]="previewColorSoft()">
                <span class="h-4 w-4 rounded" [style.background]="previewColor()"></span>
                <span class="text-sm" [style.color]="previewColor()">Dashboard</span>
              </div>
              <button type="button" class="px-4 py-2 rounded text-white text-sm font-medium" [style.background]="previewColor()">
                Sign In
              </button>
            </div>
          </div>
          <p class="text-xs text-content-muted">Changes apply across the app after saving.</p>
        </div>
      </form>
    }
  `,
})
export class TenantSettingsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly branding = inject(TenantBrandingService);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly logoError = signal(false);

  readonly form = this.fb.nonNullable.group({
    brandName: ['', [Validators.required, Validators.minLength(2)]],
    primaryColor: ['#2563EB', Validators.required],
    logoUrl: [''],
  });

  // Live-tracked color for the preview panel.
  private readonly colorValue = toSignal(this.form.controls.primaryColor.valueChanges, {
    initialValue: this.form.controls.primaryColor.value,
  });
  readonly previewColor = () => this.colorValue() || '#2563EB';
  readonly previewColorSoft = () => `${this.previewColor()}22`;

  ngOnInit(): void {
    this.api.getCurrentTenant().subscribe({
      next: (t) => {
        this.form.patchValue({
          brandName: t.brandName ?? '',
          primaryColor: t.primaryColor ?? '#2563EB',
          logoUrl: t.logoUrl ?? '',
        });
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  save(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const payload: UpdateTenantRequest = {
      brandName: v.brandName,
      primaryColor: v.primaryColor,
      ...(v.logoUrl ? { logoUrl: v.logoUrl } : {}),
    };

    this.saving.set(true);
    this.api.updateTenant(payload).subscribe({
      next: (t) => {
        // Push the new branding live so the sidebar/login reflect it immediately.
        this.branding.branding.set({
          brandName: t.brandName,
          primaryColor: t.primaryColor,
          logoUrl: t.logoUrl,
          slug: t.slug ?? this.auth.tenantSlug() ?? '',
        });
        document.documentElement.style.setProperty('--brand-primary', t.primaryColor);
        this.snackBar.open('Tenant settings saved.', 'Dismiss', { duration: 3000 });
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }
}
