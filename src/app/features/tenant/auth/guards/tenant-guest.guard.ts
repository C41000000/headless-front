import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TenantContextService } from '@core/tenant';
import { TenantAuthService } from '../services/tenant-auth.service';

export const tenantGuestGuard: CanActivateFn = () => {
  const authService = inject(TenantAuthService);
  const tenantContext = inject(TenantContextService);
  const router = inject(Router);

  if (tenantContext.isCentral()) {
    return router.createUrlTree(['/admin/login']);
  }

  if (!authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/painel']);
};
