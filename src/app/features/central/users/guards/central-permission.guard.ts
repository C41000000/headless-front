import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { CentralAuthService } from '../../auth/services/central-auth.service';

/**
 * Libera a rota só para quem tem a permission. Usa o usuário recarregado da API
 * (papel pode ter mudado desde o login); a API continua barrando com 403.
 */
export function centralPermissionGuard(permission: string): CanActivateFn {
  return () => {
    const authService = inject(CentralAuthService);
    const router = inject(Router);
    const fallback = router.createUrlTree(['/admin/tenants']);

    return authService.loadCurrentUser().pipe(
      // Sem toast aqui: o ToastService (snackbar) pesaria no bundle inicial, onde as rotas ficam
      map((user) => (user.permissions.includes(permission) ? true : fallback)),
      // 401 já é tratado pelo apiErrorInterceptor (redireciona ao login)
      catchError(() => of(fallback)),
    );
  };
}
