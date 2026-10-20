import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TenantsService } from './tenants.service';

describe('TenantsService', () => {
  let service: TenantsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TenantsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should get paginated tenants', () => {
    const mockData = {
      data: [{ uuid: 'tenant-1', name: 'Tenant 1', created_at: '', updated_at: '' }],
      links: { first: '', last: '', prev: null, next: null },
      meta: { current_page: 1, from: 1, last_page: 1, path: '', per_page: 15, to: 1, total: 1 },
    };

    service.getTenants(1).subscribe((res) => {
      expect(res.data.length).toBe(1);
      expect(res.data[0].name).toBe('Tenant 1');
    });

    const req = httpMock.expectOne('/api/v1/tenants?page=1');
    expect(req.request.method).toBe('GET');
    req.flush(mockData);
  });

  it('should send the search term when filtering tenants', () => {
    service.getTenants(2, 'gama').subscribe();

    const req = httpMock.expectOne('/api/v1/tenants?page=2&search=gama');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], links: {}, meta: {} });
  });

  it('should create tenant', () => {
    const payload = { name: 'New Tenant', domains: ['new.localhost'] };
    const mockRes = { uuid: 'tenant-new', name: 'New Tenant', created_at: '', updated_at: '' };

    service.createTenant(payload).subscribe((res) => {
      expect(res.uuid).toBe('tenant-new');
    });

    const req = httpMock.expectOne('/api/v1/tenants');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(mockRes);
  });

  it('should add domain to tenant', () => {
    const payload = { domain: 'new-domain.localhost' };
    const mockRes = {
      uuid: 'domain-1',
      domain: 'new-domain.localhost',
      created_at: '',
      updated_at: '',
    };

    service.addDomain('tenant-uuid', payload).subscribe((res) => {
      expect(res.uuid).toBe('domain-1');
    });

    const req = httpMock.expectOne('/api/v1/tenants/tenant-uuid/domains');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(mockRes);
  });

  it('should delete domain from tenant', () => {
    service.deleteDomain('tenant-uuid', 'domain-uuid').subscribe();

    const req = httpMock.expectOne('/api/v1/tenants/tenant-uuid/domains/domain-uuid');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
