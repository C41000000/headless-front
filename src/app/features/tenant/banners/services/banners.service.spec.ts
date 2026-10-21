import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BannerDto } from '@core/models';
import { BannersService } from './banners.service';

const banner: BannerDto = {
  uuid: 'banner-1',
  title: 'Promoção',
  subtitle: null,
  image_url: 'https://cdn.example.com/hero.webp',
  mobile_image_url: null,
  link_url: null,
  target: '_self',
  placement: 'home',
  order: 0,
  is_active: true,
  starts_at: null,
  ends_at: null,
  created_at: '',
  updated_at: '',
};

describe('BannersService', () => {
  let service: BannersService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BannersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should list banners as a plain array', () => {
    service.getBanners().subscribe((banners) => {
      expect(banners[0].uuid).toBe('banner-1');
    });

    const req = httpMock.expectOne('/api/v1/admin/banners');
    expect(req.request.method).toBe('GET');
    req.flush([banner]);
  });

  it('should send the filters when listing banners', () => {
    service.getBanners({ placement: 'home', is_active: false }).subscribe();

    httpMock.expectOne('/api/v1/admin/banners?placement=home&is_active=0').flush([]);
  });

  it('should list public banners with placement filter', () => {
    service.getPublicBanners('home').subscribe((banners) => {
      expect(banners.length).toBe(1);
      expect(banners[0].uuid).toBe('banner-1');
    });

    const req = httpMock.expectOne('/api/v1/banners?placement=home');
    expect(req.request.method).toBe('GET');
    req.flush([banner]);
  });

  it('should create banner', () => {
    const payload = { image_url: 'https://cdn.example.com/hero.webp', placement: 'home' };

    service.createBanner(payload).subscribe((res) => {
      expect(res.uuid).toBe('banner-1');
    });

    const req = httpMock.expectOne('/api/v1/admin/banners');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(banner);
  });

  it('should update banner and return it', () => {
    service.updateBanner('banner-1', { is_active: false }).subscribe((res) => {
      expect(res.is_active).toBe(false);
    });

    const req = httpMock.expectOne('/api/v1/admin/banners/banner-1');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ is_active: false });
    req.flush({ ...banner, is_active: false });
  });

  it('should delete banner', () => {
    service.deleteBanner('banner-1').subscribe();

    const req = httpMock.expectOne('/api/v1/admin/banners/banner-1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });
});
