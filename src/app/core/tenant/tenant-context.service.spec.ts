import { TestBed } from '@angular/core/testing';
import { TenantContextService } from './tenant-context.service';

describe('TenantContextService', () => {
  let service: TenantContextService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(TenantContextService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should detect central context by default when running on localhost', () => {
    expect(service.isCentral()).toBe(true);
    expect(service.isTenant()).toBe(false);
    expect(service.tenantDomain()).toBeNull();
  });

  it('should update context dynamically when setting dev tenant override', () => {
    service.setDevTenantOverride('cliente-teste.localhost');

    expect(service.isCentral()).toBe(false);
    expect(service.isTenant()).toBe(true);
    expect(service.tenantDomain()).toBe('cliente-teste.localhost');
    expect(service.apiBaseUrl()).toContain('cliente-teste.localhost');

    service.setDevTenantOverride(null);
    expect(service.isCentral()).toBe(true);
    expect(service.isTenant()).toBe(false);
    expect(service.tenantDomain()).toBeNull();
  });
});
