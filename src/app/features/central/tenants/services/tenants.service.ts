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
import { Observable, map } from 'rxjs';

function unwrap<T>(res: T | { data: T }): T {
  if (res && typeof res === 'object' && 'data' in res && (res as any).data !== undefined) {
    return (res as { data: T }).data;
  }
  return res as T;
}

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
    return this.http.get<TenantDto | { data: TenantDto }>(`/api/v1/tenants/${uuid}`).pipe(
      map(unwrap),
    );
  }

  public createTenant(dto: CreateTenantDto): Observable<TenantDto> {
    return this.http.post<TenantDto | { data: TenantDto }>('/api/v1/tenants', dto).pipe(
      map(unwrap),
    );
  }

  public updateTenant(uuid: string, dto: UpdateTenantDto): Observable<TenantDto> {
    return this.http.patch<TenantDto | { data: TenantDto }>(`/api/v1/tenants/${uuid}`, dto).pipe(
      map(unwrap),
    );
  }

  public deleteTenant(uuid: string): Observable<void> {
    return this.http.delete<void>(`/api/v1/tenants/${uuid}`);
  }

  public getDomains(tenantUuid: string): Observable<DomainDto[]> {
    return this.http.get<DomainDto[] | { data: DomainDto[] }>(`/api/v1/tenants/${tenantUuid}/domains`).pipe(
      map(unwrap),
    );
  }

  public addDomain(tenantUuid: string, dto: CreateDomainDto): Observable<DomainDto> {
    return this.http.post<DomainDto | { data: DomainDto }>(`/api/v1/tenants/${tenantUuid}/domains`, dto).pipe(
      map(unwrap),
    );
  }

  public updateDomain(
    tenantUuid: string,
    domainUuid: string,
    dto: UpdateDomainDto,
  ): Observable<DomainDto> {
    return this.http.patch<DomainDto | { data: DomainDto }>(
      `/api/v1/tenants/${tenantUuid}/domains/${domainUuid}`,
      dto,
    ).pipe(
      map(unwrap),
    );
  }

  public deleteDomain(tenantUuid: string, domainUuid: string): Observable<void> {
    return this.http.delete<void>(`/api/v1/tenants/${tenantUuid}/domains/${domainUuid}`);
  }
}
