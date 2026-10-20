import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  CreateDomainDto,
  CreateTenantDto,
  DomainDto,
  PaginatedResponse,
  TenantDto,
  UpdateDomainDto,
  UpdateTenantDto,
} from '@core/models';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TenantsService {
  private readonly http = inject(HttpClient);

  public getTenants(page = 1): Observable<PaginatedResponse<TenantDto>> {
    const params = new HttpParams().set('page', page.toString());
    return this.http.get<PaginatedResponse<TenantDto>>('/api/v1/tenants', { params });
  }

  public getTenant(uuid: string): Observable<TenantDto> {
    return this.http.get<TenantDto>(`/api/v1/tenants/${uuid}`);
  }

  public createTenant(dto: CreateTenantDto): Observable<TenantDto> {
    return this.http.post<TenantDto>('/api/v1/tenants', dto);
  }

  public updateTenant(uuid: string, dto: UpdateTenantDto): Observable<TenantDto> {
    return this.http.patch<TenantDto>(`/api/v1/tenants/${uuid}`, dto);
  }

  public deleteTenant(uuid: string): Observable<void> {
    return this.http.delete<void>(`/api/v1/tenants/${uuid}`);
  }

  public getDomains(tenantUuid: string): Observable<DomainDto[]> {
    return this.http.get<DomainDto[]>(`/api/v1/tenants/${tenantUuid}/domains`);
  }

  public addDomain(tenantUuid: string, dto: CreateDomainDto): Observable<DomainDto> {
    return this.http.post<DomainDto>(`/api/v1/tenants/${tenantUuid}/domains`, dto);
  }

  public updateDomain(
    tenantUuid: string,
    domainUuid: string,
    dto: UpdateDomainDto,
  ): Observable<DomainDto> {
    return this.http.patch<DomainDto>(`/api/v1/tenants/${tenantUuid}/domains/${domainUuid}`, dto);
  }

  public deleteDomain(tenantUuid: string, domainUuid: string): Observable<void> {
    return this.http.delete<void>(`/api/v1/tenants/${tenantUuid}/domains/${domainUuid}`);
  }
}
