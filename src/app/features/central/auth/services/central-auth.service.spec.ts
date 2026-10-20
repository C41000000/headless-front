import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TokenService } from '@core/auth/token.service';
import { CentralAuthService } from './central-auth.service';

describe('CentralAuthService', () => {
  let service: CentralAuthService;
  let httpMock: HttpTestingController;
  let tokenService: TokenService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'admin/login', component: class {} }]),
        TokenService,
      ],
    });
    service = TestBed.inject(CentralAuthService);
    httpMock = TestBed.inject(HttpTestingController);
    tokenService = TestBed.inject(TokenService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should authenticate user and store token/user on login success', () => {
    const mockResponse = {
      access_token: 'jwt-token-123',
      token_type: 'Bearer',
      expires_in: 3600,
      user: {
        uuid: 'user-uuid-1',
        name: 'Super Admin',
        email: 'admin@example.com',
        is_active: true,
        role: 'super-admin',
        permissions: ['users.view', 'users.create'],
        created_at: '2026-10-20T10:00:00Z',
        updated_at: '2026-10-20T10:00:00Z',
      },
    };

    service.login({ email: 'admin@example.com', password: 'password' }).subscribe((res) => {
      expect(res.access_token).toBe('jwt-token-123');
      expect(service.currentUser()?.name).toBe('Super Admin');
      expect(service.isAuthenticated()).toBe(true);
      expect(tokenService.centralToken()).toBe('jwt-token-123');
      expect(service.can('users.create')).toBe(true);
      expect(service.can('users.delete')).toBe(false);
    });

    const req = httpMock.expectOne('/api/v1/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should load the current user only once', () => {
    const me = {
      uuid: 'user-uuid-1',
      name: 'Funcionária',
      email: 'func@example.com',
      is_active: true,
      role: 'employee',
      permissions: ['users.view'],
      created_at: '',
      updated_at: '',
    };

    service.loadCurrentUser().subscribe();
    service.loadCurrentUser().subscribe((user) => {
      expect(user.role).toBe('employee');
    });

    httpMock.expectOne('/api/v1/auth/me').flush(me);

    expect(service.can('users.view')).toBe(true);
    expect(service.can('users.create')).toBe(false);
  });

  it('should clear token and user state on logout', () => {
    tokenService.setCentralToken('token');
    service.logout();

    expect(tokenService.centralToken()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });
});
