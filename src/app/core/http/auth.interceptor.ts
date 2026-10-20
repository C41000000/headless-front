import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '@core/auth/token.service';
import { TenantContextService } from '@core/tenant/tenant-context.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const tenantContext = inject(TenantContextService);

  const token = tenantContext.isCentral()
    ? tokenService.centralToken()
    : tokenService.tenantToken();

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const authReq = req.clone({
    setHeaders: headers,
    withCredentials: true,
  });

  return next(authReq);
};
