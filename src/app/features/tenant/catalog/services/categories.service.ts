import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  CategoryDto,
  CategoryFiltersDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from '@core/models';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CategoriesService {
  private readonly http = inject(HttpClient);

  public getCategories(filters: CategoryFiltersDto = {}): Observable<CategoryDto[]> {
    let params = new HttpParams();
    if (filters.search) {
      params = params.set('search', filters.search);
    }
    if (filters.is_active !== undefined && filters.is_active !== null) {
      params = params.set('is_active', filters.is_active ? '1' : '0');
    }
    return this.http.get<CategoryDto[]>('/api/v1/admin/categories', { params });
  }

  public getPublicCategories(): Observable<CategoryDto[]> {
    return this.http.get<CategoryDto[]>('/api/v1/categories');
  }

  public getCategory(uuid: string): Observable<CategoryDto> {
    return this.http.get<CategoryDto>(`/api/v1/admin/categories/${uuid}`);
  }

  public createCategory(dto: CreateCategoryDto): Observable<CategoryDto> {
    return this.http.post<CategoryDto>('/api/v1/admin/categories', dto);
  }

  public updateCategory(uuid: string, dto: UpdateCategoryDto): Observable<CategoryDto> {
    return this.http.patch<CategoryDto>(`/api/v1/admin/categories/${uuid}`, dto);
  }

  public deleteCategory(uuid: string): Observable<void> {
    return this.http.delete<void>(`/api/v1/admin/categories/${uuid}`);
  }
}
