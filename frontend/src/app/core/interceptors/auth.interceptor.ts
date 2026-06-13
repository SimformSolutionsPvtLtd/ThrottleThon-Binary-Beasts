import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap, catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const auth = inject(AuthService);
  const token = auth.accessToken();

  const addToken = (r: HttpRequest<unknown>, t: string) =>
    r.clone({ setHeaders: { Authorization: `Bearer ${t}` } });

  if (!token) return next(req);

  return next(addToken(req, token)).pipe(
    catchError(err => {
      if (err.status === 401 && auth.refreshTokenStr()) {
        return from(auth.refreshAccessToken()).pipe(
          switchMap(() => {
            const newToken = auth.accessToken();
            return newToken ? next(addToken(req, newToken)) : throwError(() => err);
          }),
          catchError(refreshErr => {
            auth.logout();
            return throwError(() => refreshErr);
          })
        );
      }
      return throwError(() => err);
    })
  );
};
