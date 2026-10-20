import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { VisualIdentityDto } from '@core/models';
import { Observable, catchError, of, tap } from 'rxjs';
import { TenantContextService } from './tenant-context.service';

@Injectable({
  providedIn: 'root',
})
export class VisualIdentityService {
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);
  private readonly tenantContext = inject(TenantContextService);

  private readonly _visualIdentity = signal<VisualIdentityDto | null>(null);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  public readonly visualIdentity = this._visualIdentity.asReadonly();
  public readonly isLoading = this._isLoading.asReadonly();
  public readonly error = this._error.asReadonly();

  public loadVisualIdentity(): Observable<VisualIdentityDto | null> {
    if (this.tenantContext.isCentral()) {
      return of(null);
    }

    this._isLoading.set(true);
    this._error.set(null);

    return this.http.get<VisualIdentityDto>('/api/v1/visual-identity').pipe(
      tap((identity) => {
        this._visualIdentity.set(identity);
        this.applyVisualIdentity(identity);
        this._isLoading.set(false);
      }),
      catchError(() => {
        this._error.set('Não foi possível carregar a identidade visual do tenant.');
        this._isLoading.set(false);
        return of(null);
      }),
    );
  }

  public applyVisualIdentity(identity: VisualIdentityDto): void {
    if (!this.document) {
      return;
    }

    const root = this.document.documentElement;

    if (identity.primary_color) {
      root.style.setProperty('--tenant-primary', identity.primary_color);
    }
    if (identity.secondary_color) {
      root.style.setProperty('--tenant-secondary', identity.secondary_color);
    }
    if (identity.accent_color) {
      root.style.setProperty('--tenant-accent', identity.accent_color);
    }
    if (identity.font_family) {
      root.style.setProperty('--tenant-font', identity.font_family);
      this.document.body.style.fontFamily = `var(--tenant-font), system-ui, sans-serif`;
    }

    if (identity.favicon_url) {
      let link = this.document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (!link) {
        link = this.document.createElement('link');
        link.rel = 'icon';
        this.document.head.appendChild(link);
      }
      link.href = identity.favicon_url;
    }

    if (identity.custom_css) {
      let styleTag = this.document.getElementById('tenant-custom-css') as HTMLStyleElement | null;
      if (!styleTag) {
        styleTag = this.document.createElement('style');
        styleTag.id = 'tenant-custom-css';
        this.document.head.appendChild(styleTag);
      }
      styleTag.textContent = identity.custom_css;
    }
  }
}
