import { InjectionToken } from '@angular/core';

export interface RoleOption {
  value: string;
  label: string;
  /** Nível na hierarquia do backend: só se atribui papel de nível igual ou menor que o seu. */
  level: number;
  description: string;
}

/**
 * O que muda entre as telas de usuários do central e as de um tenant. A API tem
 * o mesmo formato nos dois contextos; a sessão vem de AUTH_SESSION.
 */
export interface UserManagementConfig {
  /** Rota da listagem, ex.: `/admin/usuarios`. */
  basePath: string;
  subtitle: string;
  /** Papéis do contexto, do maior para o menor nível. */
  roles: readonly RoleOption[];
  /** Papel pré-selecionado na criação. */
  defaultRole: string;
}

export const USER_MANAGEMENT = new InjectionToken<UserManagementConfig>('USER_MANAGEMENT');

export function findRole(
  roles: readonly RoleOption[],
  role: string | null | undefined,
): RoleOption | undefined {
  return roles.find((option) => option.value === role);
}

export function roleLabel(roles: readonly RoleOption[], role: string | null | undefined): string {
  return findRole(roles, role)?.label ?? 'Sem papel';
}

export function roleLevel(roles: readonly RoleOption[], role: string | null | undefined): number {
  return findRole(roles, role)?.level ?? 0;
}
