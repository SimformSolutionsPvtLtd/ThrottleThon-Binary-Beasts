import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { User } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly currentUser = signal<User | null>(null);
  readonly accessToken = signal<string | null>(null);
  readonly refreshTokenStr = signal<string | null>(null);

  readonly isAuthenticated = computed(() => !!this.currentUser());
  readonly userRole = computed(() => this.currentUser()?.roleName ?? null);
  readonly userPermissions = computed(() => this.currentUser()?.permissions ?? []);
  readonly tenantId = computed(() => this.currentUser()?.tenantId ?? null);
  readonly tenantSlug = computed(() => this.currentUser()?.tenantSlug ?? null);

  async login(email: string, password: string, tenantSlug: string): Promise<User> {
    const res = await firstValueFrom(this.api.login({ email, password, tenantSlug }));
    const { accessToken, refreshToken, user } = res;
    this.accessToken.set(accessToken);
    this.refreshTokenStr.set(refreshToken);
    this.currentUser.set(user);
    return user;
  }

  logout(): void {
    this.currentUser.set(null);
    this.accessToken.set(null);
    this.refreshTokenStr.set(null);
    this.router.navigate(['/auth/login']);
  }

  async refreshAccessToken(): Promise<void> {
    const token = this.refreshTokenStr();
    if (!token) throw new Error('No refresh token');
    const res = await firstValueFrom(this.api.refreshToken(token));
    this.accessToken.set(res.accessToken);
  }

  hasPermission(perm: string): boolean {
    return this.userPermissions().includes(perm);
  }

  hasAnyPermission(...perms: string[]): boolean {
    const userPerms = this.userPermissions();
    return perms.some(p => userPerms.includes(p));
  }
}
