import { InjectionToken, Signal } from '@angular/core';
import { AuthUserDto } from '@core/models';
import { Observable } from 'rxjs';

/**
 * Sessão do contexto atual (central ou tenant). Cada layout fornece a sua em
 * AUTH_SESSION, e o que é comum aos dois (navegação, guard de permissão, telas
 * de usuários) depende só desta interface.
 */
export interface AuthSession {
  readonly currentUser: Signal<AuthUserDto | null>;
  /** Busca papel e permissions atualizados (uma vez por carga do app). */
  loadCurrentUser(): Observable<AuthUserDto>;
  /** Descarta o usuário em cache e busca de novo. */
  refreshCurrentUser(): void;
  can(permission: string): boolean;
  logout(): void;
}

export const AUTH_SESSION = new InjectionToken<AuthSession>('AUTH_SESSION');
