import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  CreateUserDto,
  PaginatedResponse,
  UpdateUserDto,
  UserDto,
  UserFiltersDto,
} from '@core/models';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private readonly http = inject(HttpClient);

  public getUsers(page = 1, filters: UserFiltersDto = {}): Observable<PaginatedResponse<UserDto>> {
    let params = new HttpParams().set('page', page.toString());
    if (filters.search) {
      params = params.set('search', filters.search);
    }
    if (filters.role) {
      params = params.set('role', filters.role);
    }
    if (filters.is_active !== undefined && filters.is_active !== null) {
      params = params.set('is_active', filters.is_active ? '1' : '0');
    }
    return this.http.get<PaginatedResponse<UserDto>>('/api/v1/users', { params });
  }

  public getUser(uuid: string): Observable<UserDto> {
    return this.http.get<UserDto>(`/api/v1/users/${uuid}`);
  }

  public createUser(dto: CreateUserDto): Observable<UserDto> {
    return this.http.post<UserDto>('/api/v1/users', dto);
  }

  // O backend responde 204 sem corpo nas atualizações.
  public updateUser(uuid: string, dto: UpdateUserDto): Observable<void> {
    return this.http.patch<void>(`/api/v1/users/${uuid}`, dto);
  }

  public toggleStatus(uuid: string): Observable<UserDto> {
    return this.http.patch<UserDto>(`/api/v1/users/${uuid}/toggle-status`, {});
  }

  public deleteUser(uuid: string): Observable<void> {
    return this.http.delete<void>(`/api/v1/users/${uuid}`);
  }
}
