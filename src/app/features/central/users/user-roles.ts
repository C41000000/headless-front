import { RoleOption } from '@shared/user-management';

/**
 * Espelha o enum RoleName do backend (nível e permissions de cada papel). A API
 * continua sendo quem valida: isto só serve para rotular e desabilitar opções.
 */
export const CENTRAL_ROLES: readonly RoleOption[] = [
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
