import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { UserDto } from '@core/models';
import { UsersService } from './users.service';

const user: UserDto = {
  uuid: 'user-1',
  name: 'Maria',
  email: 'maria@example.com',
  is_active: true,
  role: 'employee',
  abilities: { update: true, toggle_status: true, delete: false },
  created_at: '',
  updated_at: '',
};

describe('UsersService', () => {
  let service: UsersService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UsersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should get paginated users', () => {
    service.getUsers(1).subscribe((res) => {
      expect(res.data[0].role).toBe('employee');
    });

    const req = httpMock.expectOne('/api/v1/users?page=1');
    expect(req.request.method).toBe('GET');
    req.flush({
      data: [user],
      links: { first: '', last: '', prev: null, next: null },
      meta: { current_page: 1, from: 1, last_page: 1, path: '', per_page: 15, to: 1, total: 1 },
    });
  });

  it('should send the filters when listing users', () => {
    service.getUsers(2, { search: 'maria', role: 'admin', is_active: false }).subscribe();

    const req = httpMock.expectOne('/api/v1/users?page=2&search=maria&role=admin&is_active=0');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], links: {}, meta: {} });
  });

  it('should create user', () => {
    const payload = {
      name: 'Maria',
      email: 'maria@example.com',
      password: 'senha-segura',
      role: 'employee' as const,
    };

    service.createUser(payload).subscribe((res) => {
      expect(res.uuid).toBe('user-1');
    });

    const req = httpMock.expectOne('/api/v1/users');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(user);
  });

  it('should update user', () => {
    service.updateUser('user-1', { role: 'admin' }).subscribe();

    const req = httpMock.expectOne('/api/v1/users/user-1');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ role: 'admin' });
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('should toggle user status', () => {
    service.toggleStatus('user-1').subscribe((res) => {
      expect(res.is_active).toBe(false);
    });

    const req = httpMock.expectOne('/api/v1/users/user-1/toggle-status');
    expect(req.request.method).toBe('PATCH');
    req.flush({ ...user, is_active: false });
  });

  it('should delete user', () => {
    service.deleteUser('user-1').subscribe();

    const req = httpMock.expectOne('/api/v1/users/user-1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });
});
