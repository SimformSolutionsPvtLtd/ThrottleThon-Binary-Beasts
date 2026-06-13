import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { APP_ROUTES } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { APP_CONFIG } from './core/services/api.service';
import { TenantBrandingService } from './core/services/tenant-branding.service';
import { environment } from '../environments/environment';

function initBranding(brandingService: TenantBrandingService): () => Promise<void> {
  return () => {
    const slug = brandingService.getSlugFromContext();
    return brandingService.loadBranding(slug);
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(APP_ROUTES, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideAnimations(),
    {
      provide: APP_CONFIG,
      useValue: {
        apiBaseUrl: environment.apiBaseUrl,
        production: environment.production,
      },
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initBranding,
      deps: [TenantBrandingService],
      multi: true,
    },
  ],
};
