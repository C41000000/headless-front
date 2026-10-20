import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TokenService } from '@core/auth/token.service';
import { AuthUserDto, LoginCredentialsDto, LoginResponseDto } from '@core/models';
import { Observable, tap } from 'rxjs';

const TENANT_USER_KEY = 'headless_tenant_user';

@Injectable({
  providedIn: 'root',
})
export class TenantAuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private readonly router = inject(Router);

  private readonly _currentUser = signal<AuthUserDto | null>(this.readStoredUser());
  public readonly currentUser = this._currentUser.asReadonly();

  public readonly isAuthenticated = computed(
    () => this.tokenService.isTenantAuthenticated() && this._currentUser() !== null,
  );

  public login(credentials: LoginCredentialsDto): Observable<LoginResponseDto> {
    // Mesma rota do central: o apiBaseUrlInterceptor aponta para o domínio do tenant
    return this.http.post<LoginResponseDto>('/api/v1/auth/login', credentials).pipe(
      tap(({ access_token, user }) => {
        this.tokenService.setTenantToken(access_token);
        this._currentUser.set(user);
        this.writeStoredUser(user);
      }),
    );
  }

  public logout(): void {
    this.tokenService.clearTenantToken();
    this._currentUser.set(null);
    this.removeStoredUser();
    this.router.navigate(['/auth/login']);
  }

  private readStoredUser(): AuthUserDto | null {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    const raw = window.localStorage.getItem(TENANT_USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as AuthUserDto;
    } catch {
      return null;
    }
  }

  private writeStoredUser(user: AuthUserDto): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(TENANT_USER_KEY, JSON.stringify(user));
    }
  }

  private removeStoredUser(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(TENANT_USER_KEY);
    }
  }
}
