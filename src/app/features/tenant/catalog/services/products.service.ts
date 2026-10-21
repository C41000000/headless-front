import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  PaginatedResponse,
  ProductDto,
  ProductFiltersDto,
  CreateProductDto,
  UpdateProductDto,
} from '@core/models';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  private readonly http = inject(HttpClient);

  public getProducts(filters: ProductFiltersDto = {}): Observable<PaginatedResponse<ProductDto>> {
    let params = this.buildParams(filters);
    return this.http.get<PaginatedResponse<ProductDto>>('/api/v1/admin/products', { params });
  }

  public getPublicProducts(
    filters: ProductFiltersDto = {},
  ): Observable<PaginatedResponse<ProductDto>> {
    let params = this.buildParams(filters);
    return this.http.get<PaginatedResponse<ProductDto>>('/api/v1/products', { params });
  }

  public getPublicProduct(slug: string): Observable<ProductDto> {
    return this.http.get<ProductDto>(`/api/v1/products/${slug}`);
  }

  public getProduct(uuid: string): Observable<ProductDto> {
    return this.http.get<ProductDto>(`/api/v1/admin/products/${uuid}`);
  }

  public createProduct(dto: CreateProductDto): Observable<ProductDto> {
    return this.http.post<ProductDto>('/api/v1/admin/products', dto);
  }

  public updateProduct(uuid: string, dto: UpdateProductDto): Observable<ProductDto> {
    return this.http.patch<ProductDto>(`/api/v1/admin/products/${uuid}`, dto);
  }

  public deleteProduct(uuid: string): Observable<void> {
    return this.http.delete<void>(`/api/v1/admin/products/${uuid}`);
  }

  private buildParams(filters: ProductFiltersDto): HttpParams {
    let params = new HttpParams();
    if (filters.search) {
      params = params.set('search', filters.search);
    }
    if (filters.category_uuid) {
      params = params.set('category_uuid', filters.category_uuid);
    }
    if (filters.category_slug) {
      params = params.set('category_slug', filters.category_slug);
    }
    if (filters.is_active !== undefined && filters.is_active !== null) {
      params = params.set('is_active', filters.is_active ? '1' : '0');
    }
    if (filters.is_featured !== undefined && filters.is_featured !== null) {
      params = params.set('is_featured', filters.is_featured ? '1' : '0');
    }
    if (filters.page) {
      params = params.set('page', filters.page.toString());
    }
    return params;
  }
}
