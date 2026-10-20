import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TenantContextService } from '@core/tenant';
import { CentralAuthService } from '../services/central-auth.service';

export const centralGuestGuard: CanActivateFn = () => {
  const authService = inject(CentralAuthService);
  const tenantContext = inject(TenantContextService);
  const router = inject(Router);

  if (tenantContext.isTenant()) {
    return router.createUrlTree(['/painel']);
  }

  if (!authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/admin/tenants']);
};
