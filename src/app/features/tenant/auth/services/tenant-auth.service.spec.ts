import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TokenService } from '@core/auth/token.service';
import { TenantAuthService } from './tenant-auth.service';

describe('TenantAuthService', () => {
  let service: TenantAuthService;
  let httpMock: HttpTestingController;
  let tokenService: TokenService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'auth/login', component: class {} }]),
        TokenService,
      ],
    });
    service = TestBed.inject(TenantAuthService);
    httpMock = TestBed.inject(HttpTestingController);
    tokenService = TestBed.inject(TokenService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should authenticate user and store tenant token/user on login success', () => {
    const mockResponse = {
      access_token: 'tenant-jwt-123',
      token_type: 'Bearer',
      expires_in: 3600,
      user: {
        uuid: 'user-uuid-1',
        name: 'Admin Empresa',
        email: 'admin@empresa.com',
        is_active: true,
        role: 'admin',
        permissions: ['banners.create', 'users.view'],
        created_at: '2026-10-20T10:00:00Z',
        updated_at: '2026-10-20T10:00:00Z',
      },
    };

    service.login({ email: 'admin@empresa.com', password: 'password' }).subscribe((res) => {
      expect(res.access_token).toBe('tenant-jwt-123');
      expect(service.currentUser()?.name).toBe('Admin Empresa');
      expect(service.isAuthenticated()).toBe(true);
      expect(tokenService.tenantToken()).toBe('tenant-jwt-123');
      expect(tokenService.centralToken()).toBeNull();
      expect(service.can('banners.create')).toBe(true);
      expect(service.can('users.delete')).toBe(false);
    });

    const req = httpMock.expectOne('/api/v1/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should load the current tenant user from /auth/me', () => {
    service.loadCurrentUser().subscribe((user) => {
      expect(user.role).toBe('employee');
    });

    httpMock.expectOne('/api/v1/auth/me').flush({
      uuid: 'user-uuid-1',
      name: 'Funcionária',
      email: 'func@empresa.com',
      is_active: true,
      role: 'employee',
      permissions: ['users.view'],
      created_at: '',
      updated_at: '',
    });

    expect(service.can('users.view')).toBe(true);
  });

  it('should clear tenant token and user state on logout', () => {
    tokenService.setTenantToken('token');
    service.logout();

    expect(tokenService.tenantToken()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });
});
