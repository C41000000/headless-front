import { RoleOption } from '@shared/user-management';

/**
 * Espelha o enum Tenant\RoleName do backend. A API continua sendo quem valida:
 * isto só serve para rotular e desabilitar opções.
 */
export const TENANT_ROLES: readonly RoleOption[] = [
  {
    value: 'admin',
    label: 'Admin',
    level: 2,
    description: 'Acesso total ao painel: usuários, banners e identidade visual.',
  },
  {
    value: 'employee',
    label: 'Funcionário',
    level: 1,
    description: 'Apenas visualiza usuários, banners e a identidade visual.',
  },
];
