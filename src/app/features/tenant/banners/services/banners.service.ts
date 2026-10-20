import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BannerDto, BannerFiltersDto, CreateBannerDto, UpdateBannerDto } from '@core/models';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BannersService {
  private readonly http = inject(HttpClient);

  /** Lista completa (sem paginação), já ordenada pela API por `order`. */
  public getBanners(filters: BannerFiltersDto = {}): Observable<BannerDto[]> {
    let params = new HttpParams();
    if (filters.placement) {
      params = params.set('placement', filters.placement);
    }
    if (filters.is_active !== undefined && filters.is_active !== null) {
      params = params.set('is_active', filters.is_active ? '1' : '0');
    }
    return this.http.get<BannerDto[]>('/api/v1/admin/banners', { params });
  }

  public getBanner(uuid: string): Observable<BannerDto> {
    return this.http.get<BannerDto>(`/api/v1/admin/banners/${uuid}`);
  }

  public createBanner(dto: CreateBannerDto): Observable<BannerDto> {
    return this.http.post<BannerDto>('/api/v1/admin/banners', dto);
  }

  // Diferente de usuários e tenants, o update de banner devolve o banner atualizado (200).
  public updateBanner(uuid: string, dto: UpdateBannerDto): Observable<BannerDto> {
    return this.http.patch<BannerDto>(`/api/v1/admin/banners/${uuid}`, dto);
  }

  public deleteBanner(uuid: string): Observable<void> {
    return this.http.delete<void>(`/api/v1/admin/banners/${uuid}`);
  }
}
