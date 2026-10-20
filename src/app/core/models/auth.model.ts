export interface AuthUserDto {
  uuid: string;
  name: string;
  email: string;
  is_active: boolean;
  /** Papel de maior nível (central: super-admin/admin/employee; tenant: admin/employee). */
  role: string | null;
  /** Permissions efetivas, ex.: `users.create`. */
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export interface LoginCredentialsDto {
  email: string;
  password: string;
}

export interface LoginResponseDto<TUser extends AuthUserDto = AuthUserDto> {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: TUser;
}
