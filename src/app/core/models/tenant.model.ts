export interface DomainDto {
  uuid: string;
  domain: string;
  created_at: string;
  updated_at: string;
}

export interface TenantDto {
  uuid: string;
  name: string;
  domains?: DomainDto[];
  created_at: string;
  updated_at: string;
}

export interface CreateTenantDto {
  name: string;
  domains: string[];
}

export interface UpdateTenantDto {
  name?: string;
}

export interface CreateDomainDto {
  domain: string;
}

export interface UpdateDomainDto {
  domain: string;
}
