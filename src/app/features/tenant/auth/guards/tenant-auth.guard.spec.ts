import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { TenantContextService } from '@core/tenant';
import { tenantAuthGuard } from './tenant-auth.guard';
import { tenantGuestGuard } from './tenant-guest.guard';

describe('Tenant guards', () => {
  let tenantContext: TenantContextService;
  let router: Router;

  const runGuard = (guard: typeof tenantAuthGuard) =>
    TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

  // Grava direto no storage: os serviços leem o estado inicial ao serem criados
  const loginAsTenantUser = () => {
    localStorage.setItem('headless_tenant_token', 'tenant-token');
    localStorage.setItem(
      'headless_tenant_user',
      JSON.stringify({ uuid: 'u1', name: 'Admin', email: 'a@b.com', is_active: true }),
    );
  };

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  const setup = () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideRouter([])],
    });
    tenantContext = TestBed.inject(TenantContextService);
    router = TestBed.inject(Router);
  };

  it('should redirect to central admin when not on a tenant domain', () => {
    setup();

    const result = runGuard(tenantAuthGuard) as UrlTree;
    expect(router.serializeUrl(result)).toBe('/admin');
  });

  it('should redirect unauthenticated tenant users to the tenant login', () => {
    setup();
    tenantContext.setDevTenantOverride('empresa.localhost');

    const result = runGuard(tenantAuthGuard) as UrlTree;
    expect(router.serializeUrl(result)).toBe('/auth/login');
    expect(runGuard(tenantGuestGuard)).toBe(true);
  });

  it('should allow authenticated tenant users into the panel', () => {
    localStorage.setItem('headless_dev_tenant_override', 'empresa.localhost');
    loginAsTenantUser();
    setup();

    expect(runGuard(tenantAuthGuard)).toBe(true);
    const result = runGuard(tenantGuestGuard) as UrlTree;
    expect(router.serializeUrl(result)).toBe('/painel');
  });
});
