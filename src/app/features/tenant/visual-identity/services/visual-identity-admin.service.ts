import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { UpdateVisualIdentityDto, VisualIdentityDto } from '@core/models';
import { Observable } from 'rxjs';

/** Endpoints autenticados da identidade visual (o público fica no VisualIdentityService). */
@Injectable({
  providedIn: 'root',
})
export class VisualIdentityAdminService {
  private readonly http = inject(HttpClient);

  public getVisualIdentity(): Observable<VisualIdentityDto> {
    return this.http.get<VisualIdentityDto>('/api/v1/admin/visual-identity');
  }

  public updateVisualIdentity(dto: UpdateVisualIdentityDto): Observable<VisualIdentityDto> {
    return this.http.patch<VisualIdentityDto>('/api/v1/admin/visual-identity', dto);
  }
}
