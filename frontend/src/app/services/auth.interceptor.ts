import { HttpInterceptorFn } from '@angular/common/http';

// Adds login token to every request sent to our API
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  let token: string | null = null;
  try { token = localStorage.getItem('bookworm_token'); } catch {}
  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};