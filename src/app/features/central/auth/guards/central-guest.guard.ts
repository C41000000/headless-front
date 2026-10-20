import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CentralAuthService } from '../services/central-auth.service';

export const centralGuestGuard: CanActivateFn = () => {
  const authService = inject(CentralAuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/admin/tenants']);
};
