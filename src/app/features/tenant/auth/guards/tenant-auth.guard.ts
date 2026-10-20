import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TenantContextService } from '@core/tenant';
import { TenantAuthService } from '../services/tenant-auth.service';

export const tenantAuthGuard: CanActivateFn = () => {
  const authService = inject(TenantAuthService);
  const tenantContext = inject(TenantContextService);
  const router = inject(Router);

  // Sem domínio de tenant as chamadas iriam para a API central
  if (tenantContext.isCentral()) {
    return router.createUrlTree(['/admin']);
  }

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/auth/login']);
};
