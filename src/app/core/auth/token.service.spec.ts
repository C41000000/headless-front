import { TestBed } from '@angular/core/testing';
import { TokenService } from './token.service';

describe('TokenService', () => {
  let service: TokenService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(TokenService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize with null tokens when storage is empty', () => {
    expect(service.centralToken()).toBeNull();
    expect(service.tenantToken()).toBeNull();
    expect(service.isCentralAuthenticated()).toBe(false);
    expect(service.isTenantAuthenticated()).toBe(false);
  });

  it('should set and clear central token with reactive signal update', () => {
    service.setCentralToken('central-jwt-123');
    expect(service.centralToken()).toBe('central-jwt-123');
    expect(service.isCentralAuthenticated()).toBe(true);

    service.clearCentralToken();
    expect(service.centralToken()).toBeNull();
    expect(service.isCentralAuthenticated()).toBe(false);
  });

  it('should set and clear tenant token with reactive signal update', () => {
    service.setTenantToken('tenant-jwt-abc');
    expect(service.tenantToken()).toBe('tenant-jwt-abc');
    expect(service.isTenantAuthenticated()).toBe(true);

    service.clearTenantToken();
    expect(service.tenantToken()).toBeNull();
    expect(service.isTenantAuthenticated()).toBe(false);
  });
});
