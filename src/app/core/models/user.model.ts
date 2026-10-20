/** Papéis do banco central, do maior para o menor nível. */
export type CentralRole = 'super-admin' | 'admin' | 'employee';

/** Papéis de um tenant, do maior para o menor nível. */
export type TenantRole = 'admin' | 'employee';

/** O que o usuário autenticado pode fazer com outro usuário (calculado pela UserPolicy). */
export interface UserAbilitiesDto {
  update: boolean;
  toggle_status: boolean;
  delete: boolean;
}

/** Usuário do central ou de um tenant: os dois contextos expõem o mesmo formato. */
export interface UserDto {
  uuid: string;
  name: string;
  email: string;
  is_active: boolean;
  role: string | null;
  abilities?: UserAbilitiesDto;
  created_at: string;
  updated_at: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  is_active?: boolean;
  role?: string;
}

export interface UserFiltersDto {
  search?: string;
  role?: string | null;
  is_active?: boolean | null;
}
