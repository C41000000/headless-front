import { CentralRole } from '@core/models';

export interface CentralRoleOption {
  value: CentralRole;
  label: string;
  level: number;
  description: string;
}

/**
 * Espelha o enum RoleName do backend (nível e permissions de cada papel). A API
 * continua sendo quem valida: isto só serve para rotular e desabilitar opções.
 */
export const CENTRAL_ROLES: readonly CentralRoleOption[] = [
  {
    value: 'super-admin',
    label: 'Super admin',
    level: 3,
    description: 'Acesso total: gerencia usuários, tenants e domínios, inclusive exclusões.',
  },
  {
    value: 'admin',
    label: 'Admin',
    level: 2,
    description:
      'Cria e edita usuários, tenants e domínios e ativa ou desativa usuários. Não exclui nada.',
  },
  {
    value: 'employee',
    label: 'Funcionário',
    level: 1,
    description: 'Apenas visualiza usuários, tenants e domínios.',
  },
];

export function roleLabel(role: CentralRole | null): string {
  return CENTRAL_ROLES.find((option) => option.value === role)?.label ?? 'Sem papel';
}

export function roleLevel(role: CentralRole | null): number {
  return CENTRAL_ROLES.find((option) => option.value === role)?.level ?? 0;
}
