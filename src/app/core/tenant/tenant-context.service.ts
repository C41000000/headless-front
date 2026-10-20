import { Injectable, computed, signal } from '@angular/core';
import { environment } from '@env/environment';

const DEV_TENANT_OVERRIDE_KEY = 'headless_dev_tenant_override';

@Injectable({
  providedIn: 'root',
})
export class TenantContextService {
  private readonly _tenantDomain = signal<string | null>(this.resolveInitialTenantDomain());

  public readonly tenantDomain = this._tenantDomain.asReadonly();
  public readonly isCentral = computed(() => this._tenantDomain() === null);
  public readonly isTenant = computed(() => this._tenantDomain() !== null);

  public readonly apiBaseUrl = computed(() => {
    const defaultUrl = environment.centralApiUrl.replace(/\/+$/, '');
    const domain = this._tenantDomain();

    if (!domain) {
      return defaultUrl;
    }

    try {
      const parsedUrl = new URL(defaultUrl);
      parsedUrl.hostname = domain;
      return parsedUrl.origin;
    } catch {
      return defaultUrl;
    }
  });

  public setDevTenantOverride(domain: string | null): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (domain) {
        window.localStorage.setItem(DEV_TENANT_OVERRIDE_KEY, domain);
      } else {
        window.localStorage.removeItem(DEV_TENANT_OVERRIDE_KEY);
      }
    }
    this._tenantDomain.set(domain);
  }

  private resolveInitialTenantDomain(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    // 1. Verificação de override para desenvolvimento (URL query param "?tenant=xyz")
    const searchParams = new URLSearchParams(window.location.search);
    const queryTenant = searchParams.get('tenant');
    if (queryTenant) {
      this.writeDevOverride(queryTenant);
      return queryTenant;
    }

    // 2. Verificação de override no localStorage
    const storedOverride = this.readDevOverride();
    if (storedOverride) {
      return storedOverride;
    }

    // 3. Resolução automática pelo hostname
    const hostname = window.location.hostname.toLowerCase();
    const isCentralDomain = environment.centralDomains.some(
      (central) => hostname === central.toLowerCase(),
    );

    if (isCentralDomain) {
      return null;
    }

    // Se não for domínio central, o hostname inteiro é o tenant_domain
    return hostname;
  }

  private readDevOverride(): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(DEV_TENANT_OVERRIDE_KEY);
    }
    return null;
  }

  private writeDevOverride(domain: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(DEV_TENANT_OVERRIDE_KEY, domain);
    }
  }
}
