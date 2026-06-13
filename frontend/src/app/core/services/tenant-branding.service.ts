import { Injectable, signal, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { TenantBranding } from '../models/tenant.model';

@Injectable({ providedIn: 'root' })
export class TenantBrandingService {
  private readonly api = inject(ApiService);

  readonly branding = signal<TenantBranding | null>(null);

  async loadBranding(slug: string): Promise<void> {
    try {
      const res = await firstValueFrom(this.api.getTenantBranding(slug));
      const b = res.data;
      this.branding.set(b);
      this.applyBrandingToDOM(b);
    } catch {
      // keep defaults
    }
  }

  private applyBrandingToDOM(b: TenantBranding): void {
    const root = document.documentElement;
    if (b.primaryColor) {
      root.style.setProperty('--brand-primary', b.primaryColor);
    }
  }

  getSlugFromContext(): string {
    // Try query param first
    const params = new URLSearchParams(window.location.search);
    const qSlug = params.get('tenant');
    if (qSlug) return qSlug;

    // Try subdomain (e.g. vectorfin.app.com)
    const host = window.location.hostname;
    const parts = host.split('.');
    if (parts.length >= 3) return parts[0];

    return 'vectorfin';
  }
}
