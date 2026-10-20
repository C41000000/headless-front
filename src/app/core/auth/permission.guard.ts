import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AUTH_SESSION } from './auth-session';

/**
 * Libera a rota só para quem tem a permission, usando a sessão do contexto
 * (AUTH_SESSION, fornecida pelo layout). O usuário é recarregado da API, pois o
 * papel pode ter mudado desde o login; a API continua barrando com 403.
 */
export function permissionGuard(permission: string, fallbackUrl: string): CanActivateFn {
  return () => {
    const session = inject(AUTH_SESSION);
    const fallback = inject(Router).parseUrl(fallbackUrl);

    return session.loadCurrentUser().pipe(
      // Sem toast aqui: o ToastService (snackbar) pesaria no bundle inicial, onde as rotas ficam
      map((user) => (user.permissions.includes(permission) ? true : fallback)),
      // 401 já é tratado pelo apiErrorInterceptor (redireciona ao login)
      catchError(() => of(fallback)),
    );
  };
}
