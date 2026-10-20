import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { VisualIdentityAdminService } from './visual-identity-admin.service';

describe('VisualIdentityAdminService', () => {
  let service: VisualIdentityAdminService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(VisualIdentityAdminService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should get the visual identity', () => {
    service.getVisualIdentity().subscribe((res) => {
      expect(res.primary_color).toBe('#0D6EFD');
    });

    const req = httpMock.expectOne('/api/v1/admin/visual-identity');
    expect(req.request.method).toBe('GET');
    req.flush({ uuid: 'vi-1', primary_color: '#0D6EFD' });
  });

  it('should update only the given fields', () => {
    service.updateVisualIdentity({ primary_color: '#D9501C' }).subscribe();

    const req = httpMock.expectOne('/api/v1/admin/visual-identity');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ primary_color: '#D9501C' });
    req.flush({ uuid: 'vi-1', primary_color: '#D9501C' });
  });
});
