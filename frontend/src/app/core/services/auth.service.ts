import { Injectable, signal, computed, inject } from '@angular/core';
import { ApiService } from './api.service';
import { firstValueFrom } from 'rxjs';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

const ACCESS_KEY = 'ss_access';
const REFRESH_KEY = 'ss_refresh';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  readonly accessToken = signal<string | null>(localStorage.getItem(ACCESS_KEY));
  readonly refreshToken = signal<string | null>(localStorage.getItem(REFRESH_KEY));
  readonly isAuthenticated = computed(() => !!this.accessToken());

  async login(email: string, password: string): Promise<void> {
    const { data } = await firstValueFrom(
      this.api.post<{ data: AuthTokens }, { email: string; password: string }>('/auth/login', {
        email,
        password,
      }),
    );
    this.setTokens(data);
  }

  logout(): void {
    this.accessToken.set(null);
    this.refreshToken.set(null);
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }

  private setTokens(t: AuthTokens): void {
    this.accessToken.set(t.accessToken);
    this.refreshToken.set(t.refreshToken);
    localStorage.setItem(ACCESS_KEY, t.accessToken);
    localStorage.setItem(REFRESH_KEY, t.refreshToken);
  }
}
