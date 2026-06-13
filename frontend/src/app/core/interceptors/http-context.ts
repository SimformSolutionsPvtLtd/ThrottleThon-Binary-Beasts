import { HttpContext, HttpContextToken } from '@angular/common/http';

/**
 * When set on a request's context, the error interceptor will not show a
 * global snackbar for that request. Use for calls where a non-2xx response
 * is an expected/handled outcome (e.g. probing for an optional resource).
 */
export const SKIP_ERROR_TOAST = new HttpContextToken<boolean>(() => false);

/** Convenience helper to build a context that skips the error toast. */
export function skipErrorToast(): HttpContext {
  return new HttpContext().set(SKIP_ERROR_TOAST, true);
}
