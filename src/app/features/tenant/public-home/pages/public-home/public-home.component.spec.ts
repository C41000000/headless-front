import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BannerDto, CategoryDto, PaginatedResponse, ProductDto } from '@core/models';
import { TenantContextService, VisualIdentityService } from '@core/tenant';
import { ThemeService } from '@core/theme';
import { of } from 'rxjs';
import { BannersService } from '../../../banners/services/banners.service';
import { CategoriesService } from '../../../catalog/services/categories.service';
import { ProductsService } from '../../../catalog/services/products.service';
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

const mockCategory: CategoryDto = {
  uuid: 'cat-1',
  name: 'Eletrônicos',
  slug: 'eletronicos',
  description: 'Aparelhos e acessórios',
  order: 0,
  is_active: true,
  products_count: 5,
  created_at: '',
  updated_at: '',
};

const mockProduct: ProductDto = {
  uuid: 'prod-1',
  name: 'Smartphone Pro',
  slug: 'smartphone-pro',
  description: 'Celular topo de linha',
  price: 2000,
  promotional_price: 1600,
  sku: 'SP-01',
  stock: 12,
  is_active: true,
  is_featured: true,
  image_url: 'https://cdn.example.com/phone.webp',
  category: mockCategory,
  created_at: '',
  updated_at: '',
};

const mockProductsResponse: PaginatedResponse<ProductDto> = {
  data: [mockProduct],
  links: { first: '', last: '', prev: null, next: null },
  meta: {
    current_page: 1,
    from: 1,
    last_page: 1,
    links: [],
    path: '',
    per_page: 12,
    to: 1,
    total: 1,
  },
};

describe('PublicHomeComponent', () => {
  let component: PublicHomeComponent;
  let fixture: ComponentFixture<PublicHomeComponent>;
  let bannersServiceMock: { getPublicBanners: ReturnType<typeof vi.fn> };
  let categoriesServiceMock: { getPublicCategories: ReturnType<typeof vi.fn> };
  let productsServiceMock: { getPublicProducts: ReturnType<typeof vi.fn> };
  let tenantContextMock: {
    tenantDomain: ReturnType<typeof vi.fn>;
    isTenant: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    bannersServiceMock = {
      getPublicBanners: vi.fn().mockReturnValue(of([mockBanner])),
    };
    categoriesServiceMock = {
      getPublicCategories: vi.fn().mockReturnValue(of([mockCategory])),
    };
    productsServiceMock = {
      getPublicProducts: vi.fn().mockReturnValue(of(mockProductsResponse)),
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
        { provide: CategoriesService, useValue: categoriesServiceMock },
        { provide: ProductsService, useValue: productsServiceMock },
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

  it('should load categories and products on init', () => {
    expect(categoriesServiceMock.getPublicCategories).toHaveBeenCalled();
    expect(component.categories().length).toBe(1);
    expect(component.categories()[0].name).toBe('Eletrônicos');

    expect(productsServiceMock.getPublicProducts).toHaveBeenCalledWith({
      category_slug: undefined,
      search: undefined,
      is_featured: undefined,
      page: 1,
    });
    expect(component.products().length).toBe(1);
    expect(component.products()[0].name).toBe('Smartphone Pro');
  });

  it('should filter by category when selected', () => {
    component.selectCategory('eletronicos');
    expect(component.selectedCategorySlug()).toBe('eletronicos');
    expect(productsServiceMock.getPublicProducts).toHaveBeenLastCalledWith(
      expect.objectContaining({ category_slug: 'eletronicos', page: 1 }),
    );
  });

  it('should filter by search query on submit and clear', () => {
    component.searchQuery.set('Smartphone');
    component.onSearchSubmit();
    expect(component.activeSearch()).toBe('Smartphone');
    expect(productsServiceMock.getPublicProducts).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: 'Smartphone', page: 1 }),
    );

    component.clearSearch();
    expect(component.activeSearch()).toBe('');
    expect(component.searchQuery()).toBe('');
    expect(productsServiceMock.getPublicProducts).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: undefined, page: 1 }),
    );
  });

  it('should toggle only featured products', () => {
    component.toggleOnlyFeatured();
    expect(component.onlyFeatured()).toBe(true);
    expect(productsServiceMock.getPublicProducts).toHaveBeenLastCalledWith(
      expect.objectContaining({ is_featured: true, page: 1 }),
    );
  });

  it('should calculate discount percentage correctly', () => {
    const discount = component.discountPercentage(mockProduct);
    // 2000 -> 1600 = 20%
    expect(discount).toBe(20);

    const noDiscount = component.discountPercentage({
      ...mockProduct,
      promotional_price: null,
    });
    expect(noDiscount).toBeNull();
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

  it('should add product to cart', () => {
    component.addToCart(mockProduct);
    expect(component.cartService.items().length).toBe(1);
    expect(component.cartService.items()[0].name).toBe('Smartphone Pro');
  });
});
