import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { SKIP_ERROR_TOAST } from './http-context';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const auth = inject(AuthService);
  const snackBar = inject(MatSnackBar);

  const silent = req.context.get(SKIP_ERROR_TOAST);
  const show = (msg: string) => {
    if (!silent) snackBar.open(msg, 'Dismiss', { duration: 4000 });
  };

  return next(req).pipe(
    catchError(err => {
      const serverMsg = err?.error?.message;
      switch (err.status) {
        case 400:
          show(serverMsg || 'Bad request');
          break;
        case 401:
          show('Session expired. Please sign in again.');
          auth.currentUser.set(null);
          auth.accessToken.set(null);
          auth.refreshTokenStr.set(null);
          router.navigate(['/auth/login']);
          break;
        case 403:
          show('Permission denied.');
          break;
        case 404:
          show('Not found.');
          break;
        case 429:
          show('Too many requests. Wait a moment and try again.');
          break;
        default:
          if (err.status >= 500) show('Something went wrong. Please try again.');
      }
      return throwError(() => err);
    })
  );
};
