import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const auth = inject(AuthService);
  if (auth.isAuthenticated()) return true;
  const returnUrl = route.url.map(s => s.path).join('/');
  router.navigate(['/auth/login'], returnUrl ? { queryParams: { returnUrl } } : {});
  return false;
};
