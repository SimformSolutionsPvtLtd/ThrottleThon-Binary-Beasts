import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const permissionGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const auth = inject(AuthService);
  const required: string[] = route.data?.['permissions'] ?? [];
  if (!required.length) return true;
  const role = auth.userRole();
  if (role && required.includes(role)) return true;
  router.navigate(['/dashboard']);
  return false;
};
