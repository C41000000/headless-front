import { Injectable, computed, signal } from '@angular/core';

const CENTRAL_TOKEN_KEY = 'headless_central_token';
const TENANT_TOKEN_KEY = 'headless_tenant_token';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private readonly _centralToken = signal<string | null>(this.readStorage(CENTRAL_TOKEN_KEY));
  private readonly _tenantToken = signal<string | null>(this.readStorage(TENANT_TOKEN_KEY));

  public readonly centralToken = this._centralToken.asReadonly();
  public readonly tenantToken = this._tenantToken.asReadonly();

  public readonly isCentralAuthenticated = computed(() => !!this._centralToken());
  public readonly isTenantAuthenticated = computed(() => !!this._tenantToken());

  public setCentralToken(token: string): void {
    this._centralToken.set(token);
    this.writeStorage(CENTRAL_TOKEN_KEY, token);
  }

  public clearCentralToken(): void {
    this._centralToken.set(null);
    this.removeStorage(CENTRAL_TOKEN_KEY);
  }

  public setTenantToken(token: string): void {
    this._tenantToken.set(token);
    this.writeStorage(TENANT_TOKEN_KEY, token);
  }

  public clearTenantToken(): void {
    this._tenantToken.set(null);
    this.removeStorage(TENANT_TOKEN_KEY);
  }

  public clearAllTokens(): void {
    this.clearCentralToken();
    this.clearTenantToken();
  }

  private readStorage(key: string): string | null {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    return window.localStorage.getItem(key);
  }

  private writeStorage(key: string, value: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  }

  private removeStorage(key: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  }
}
