import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TenantContextService } from '@core/tenant/tenant-context.service';

export const apiBaseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  // Ignora requisições que já possuem URL absoluta
  if (req.url.startsWith('http://') || req.url.startsWith('https://')) {
    return next(req);
  }

  const tenantContext = inject(TenantContextService);
  const baseUrl = tenantContext.apiBaseUrl();
  const cleanPath = req.url.startsWith('/') ? req.url : `/${req.url}`;
  const absoluteUrl = `${baseUrl}${cleanPath}`;

  const clonedReq = req.clone({
    url: absoluteUrl,
  });

  return next(clonedReq);
};
