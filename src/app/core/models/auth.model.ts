export interface AuthUserDto {
  uuid: string;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentialsDto {
  email: string;
  password: string;
}

export interface LoginResponseDto {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: AuthUserDto;
}
