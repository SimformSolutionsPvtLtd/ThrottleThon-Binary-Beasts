import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { TenantBrandingService } from '../../../core/services/tenant-branding.service';

@Component({
  selector: 'ss-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="flex items-center justify-center min-h-screen bg-surface dark">
      <div class="w-full max-w-md p-8">
        <!-- Brand header -->
        <div class="flex flex-col items-center mb-8">
          @if (branding.branding()?.logoUrl) {
            <img [src]="branding.branding()!.logoUrl!" alt="Logo" class="h-16 w-16 rounded-xl object-contain mb-4" />
          } @else {
            <div class="h-16 w-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl mb-4" style="background-color: var(--brand-primary)">
              {{ (branding.branding()?.brandName || 'SS')[0] }}
            </div>
          }
          <h1 class="text-2xl font-bold text-content">{{ branding.branding()?.brandName || 'SmarterSprint' }}</h1>
          <p class="text-content-muted text-sm mt-1">Engineering Intelligence Platform</p>
        </div>

        <!-- Card -->
        <div class="bg-surface-raised rounded-2xl p-8 border border-surface-overlay shadow-2xl">
          <h2 class="text-lg font-semibold text-content mb-6">Sign In</h2>

          <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-4">
            <mat-form-field appearance="fill" class="w-full">
              <mat-label>Email</mat-label>
              <input matInput formControlName="email" type="email" autocomplete="email" />
              @if (form.get('email')?.invalid && form.get('email')?.touched) {
                <mat-error>Valid email required</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="fill" class="w-full">
              <mat-label>Password</mat-label>
              <input matInput formControlName="password" [type]="showPassword() ? 'text' : 'password'" autocomplete="current-password" />
              <button type="button" matSuffix mat-icon-button (click)="showPassword.set(!showPassword())">
                <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (form.get('password')?.invalid && form.get('password')?.touched) {
                <mat-error>Password required (min 6 chars)</mat-error>
              }
            </mat-form-field>

            @if (error()) {
              <div class="bg-red-900/30 border border-red-500/50 rounded-lg px-4 py-3 text-red-300 text-sm">
                {{ error() }}
              </div>
            }

            <button
              mat-flat-button
              type="submit"
              class="w-full h-11 text-white font-medium rounded-lg mt-2"
              style="background-color: var(--brand-primary)"
              [disabled]="form.invalid || loading()"
            >
              @if (loading()) {
                <mat-spinner diameter="20" class="inline-block mr-2"></mat-spinner>
                Signing in...
              } @else {
                Sign In
              }
            </button>
          </form>
        </div>

        <p class="text-center text-content-muted text-xs mt-6">
          Tenant: {{ branding.branding()?.slug || 'vectorfin' }}
        </p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly branding = inject(TenantBrandingService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly showPassword = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['admin@vectorfin.example', [Validators.required, Validators.email]],
    password: ['changeme', [Validators.required, Validators.minLength(6)]],
  });

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      const { email, password } = this.form.getRawValue();
      const slug = this.branding.branding()?.slug || this.branding.getSlugFromContext();
      await this.auth.login(email, password, slug);
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
      this.router.navigateByUrl(returnUrl);
    } catch (e: unknown) {
      this.error.set((e as { error?: { message?: string } })?.error?.message ?? 'Login failed. Check your credentials.');
    } finally {
      this.loading.set(false);
    }
  }
}
