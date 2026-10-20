import { AuthUserDto } from './auth.model';

/** Papéis do banco central, do maior para o menor nível. */
export type CentralRole = 'super-admin' | 'admin' | 'employee';

/** O que o usuário autenticado pode fazer com outro usuário (calculado pela UserPolicy). */
export interface UserAbilitiesDto {
  update: boolean;
  toggle_status: boolean;
  delete: boolean;
}

export interface UserDto {
  uuid: string;
  name: string;
  email: string;
  is_active: boolean;
  role: CentralRole | null;
  abilities?: UserAbilitiesDto;
  created_at: string;
  updated_at: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role: CentralRole;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  is_active?: boolean;
  role?: CentralRole;
}

export interface UserFiltersDto {
  search?: string;
  role?: CentralRole | null;
  is_active?: boolean | null;
}

/** Usuário logado no central, com o papel e as permissions efetivas. */
export interface CentralAuthUserDto extends AuthUserDto {
  role: CentralRole | null;
  permissions: string[];
}
