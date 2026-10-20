import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthSession } from '@core/auth/auth-session';
import { TokenService } from '@core/auth/token.service';
import { AuthUserDto, LoginCredentialsDto, LoginResponseDto } from '@core/models';
import { Observable, catchError, of, shareReplay, tap, throwError } from 'rxjs';

const CENTRAL_USER_KEY = 'headless_central_user';

@Injectable({
  providedIn: 'root',
})
export class CentralAuthService implements AuthSession {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private readonly router = inject(Router);

  private readonly _currentUser = signal<AuthUserDto | null>(this.readStoredUser());
  public readonly currentUser = this._currentUser.asReadonly();

  public readonly isAuthenticated = computed(
    () => this.tokenService.isCentralAuthenticated() && this._currentUser() !== null,
  );

  private currentUserRequest: Observable<AuthUserDto> | null = null;

  public login(credentials: LoginCredentialsDto): Observable<LoginResponseDto> {
    return this.http.post<LoginResponseDto>('/api/v1/auth/login', credentials).pipe(
      tap(({ access_token, user }) => {
        this.tokenService.setCentralToken(access_token);
        this.setCurrentUser(user);
        // O login já traz papel e permissions atualizados
        this.currentUserRequest = of(user);
      }),
    );
  }

  /**
   * Busca o usuário logado (papel e permissions) uma vez por carga do app: o que
   * está no localStorage pode ter ficado desatualizado se o papel mudou.
   */
  public loadCurrentUser(): Observable<AuthUserDto> {
    this.currentUserRequest ??= this.http.get<AuthUserDto>('/api/v1/auth/me').pipe(
      tap((user) => this.setCurrentUser(user)),
      catchError((error: unknown) => {
        this.currentUserRequest = null;
        return throwError(() => error);
      }),
      shareReplay(1),
    );
    return this.currentUserRequest;
  }

  /** Descarta o usuário em cache e busca de novo (ex.: depois de editar a própria conta). */
  public refreshCurrentUser(): void {
    this.currentUserRequest = null;
    this.loadCurrentUser().subscribe({ error: () => undefined });
  }

  public can(permission: string): boolean {
    return this._currentUser()?.permissions?.includes(permission) ?? false;
  }

  public logout(): void {
    this.tokenService.clearCentralToken();
    this.currentUserRequest = null;
    this._currentUser.set(null);
    this.removeStoredUser();
    this.router.navigate(['/admin/login']);
  }

  private setCurrentUser(user: AuthUserDto): void {
    this._currentUser.set(user);
    this.writeStoredUser(user);
  }

  private readStoredUser(): AuthUserDto | null {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    const raw = window.localStorage.getItem(CENTRAL_USER_KEY);
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
      window.localStorage.setItem(CENTRAL_USER_KEY, JSON.stringify(user));
    }
  }

  private removeStoredUser(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(CENTRAL_USER_KEY);
    }
  }
}
