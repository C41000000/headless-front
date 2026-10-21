import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BannerDto } from '@core/models';
import { TenantContextService, VisualIdentityService } from '@core/tenant';
import { ThemeService } from '@core/theme';
import { of } from 'rxjs';
import { BannersService } from '../../../banners/services/banners.service';
import { PublicHomeComponent } from './public-home.component';

const mockBanner: BannerDto = {
  uuid: 'banner-public-1',
  title: 'Grande Inauguração',
  subtitle: 'Conheça nossa nova plataforma',
  image_url: 'https://cdn.example.com/banner1.webp',
  mobile_image_url: null,
  link_url: 'https://exemplo.com/saiba-mais',
  target: '_blank',
  placement: 'home',
  order: 0,
  is_active: true,
  starts_at: null,
  ends_at: null,
  created_at: '',
  updated_at: '',
};

describe('PublicHomeComponent', () => {
  let component: PublicHomeComponent;
  let fixture: ComponentFixture<PublicHomeComponent>;
  let bannersServiceMock: { getPublicBanners: ReturnType<typeof vi.fn> };
  let tenantContextMock: {
    tenantDomain: ReturnType<typeof vi.fn>;
    isTenant: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    bannersServiceMock = {
      getPublicBanners: vi.fn().mockReturnValue(of([mockBanner])),
    };
    tenantContextMock = {
      tenantDomain: vi.fn().mockReturnValue('empresa.localhost'),
      isTenant: vi.fn().mockReturnValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [PublicHomeComponent],
      providers: [
        provideRouter([]),
        { provide: BannersService, useValue: bannersServiceMock },
        { provide: TenantContextService, useValue: tenantContextMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PublicHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the public home component', () => {
    expect(component).toBeTruthy();
  });

  it('should load public banners on init', () => {
    expect(bannersServiceMock.getPublicBanners).toHaveBeenCalledWith('home');
    expect(component.banners().length).toBe(1);
    expect(component.banners()[0].title).toBe('Grande Inauguração');
  });

  it('should navigate through slides', () => {
    component.banners.set([
      mockBanner,
      { ...mockBanner, uuid: 'banner-2', title: 'Segundo Banner' },
    ]);
    expect(component.currentSlide()).toBe(0);

    component.nextSlide();
    expect(component.currentSlide()).toBe(1);

    component.nextSlide();
    expect(component.currentSlide()).toBe(0);

    component.prevSlide();
    expect(component.currentSlide()).toBe(1);
  });

  it('should display tenant domain in header and footer', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('empresa.localhost');
  });
});
