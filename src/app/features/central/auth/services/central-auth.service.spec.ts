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
      data: {
        access_token: 'jwt-token-123',
        token_type: 'Bearer',
        expires_in: 3600,
        user: {
          uuid: 'user-uuid-1',
          name: 'Super Admin',
          email: 'admin@example.com',
          is_active: true,
          created_at: '2026-10-20T10:00:00Z',
          updated_at: '2026-10-20T10:00:00Z',
        },
      },
    };

    service.login({ email: 'admin@example.com', password: 'password' }).subscribe((res) => {
      const payload = 'data' in res ? res.data : res;
      expect(payload.access_token).toBe('jwt-token-123');
      expect(service.currentUser()?.name).toBe('Super Admin');
      expect(service.isAuthenticated()).toBe(true);
      expect(tokenService.centralToken()).toBe('jwt-token-123');
    });

    const req = httpMock.expectOne('/api/v1/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should clear token and user state on logout', () => {
    tokenService.setCentralToken('token');
    service.logout();

    expect(tokenService.centralToken()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });
});
