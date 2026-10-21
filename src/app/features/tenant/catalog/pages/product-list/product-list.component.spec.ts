import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { AUTH_SESSION } from '@core/auth/auth-session';
import { PaginatedResponse, ProductDto } from '@core/models';
import { ToastService } from '@core/toast';
import { of } from 'rxjs';
import { CategoriesService } from '../../services/categories.service';
import { ProductsService } from '../../services/products.service';
import { ProductListComponent } from './product-list.component';

const mockProduct: ProductDto = {
  uuid: 'prod-1',
  name: 'Camisa Polo',
  slug: 'camisa-polo',
  description: 'Camisa polo azul',
  price: 99.9,
  promotional_price: 79.9,
  stock: 12,
  sku: 'POLO-01',
  image_url: null,
  is_active: true,
  is_featured: true,
  category: {
    uuid: 'cat-1',
    name: 'Vestuário',
    slug: 'vestuario',
    description: null,
    is_active: true,
    order: 0,
    created_at: '',
    updated_at: '',
  },
  created_at: '',
  updated_at: '',
};

const paginated: PaginatedResponse<ProductDto> = {
  data: [mockProduct],
  links: { first: null, last: null, prev: null, next: null },
  meta: {
    current_page: 1,
    from: 1,
    last_page: 1,
    path: '',
    per_page: 15,
    to: 1,
    total: 1,
  },
};

describe('ProductListComponent', () => {
  let component: ProductListComponent;
  let fixture: ComponentFixture<ProductListComponent>;
  let productsService: {
    getProducts: ReturnType<typeof vi.fn>;
    updateProduct: ReturnType<typeof vi.fn>;
    deleteProduct: ReturnType<typeof vi.fn>;
  };
  let categoriesService: { getCategories: ReturnType<typeof vi.fn> };
  let toastService: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    productsService = {
      getProducts: vi.fn().mockReturnValue(of(paginated)),
      updateProduct: vi.fn().mockReturnValue(of({ ...mockProduct, is_active: false })),
      deleteProduct: vi.fn().mockReturnValue(of(undefined)),
    };

    categoriesService = {
      getCategories: vi.fn().mockReturnValue(of([])),
    };

    toastService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ProductListComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: ProductsService, useValue: productsService },
        { provide: CategoriesService, useValue: categoriesService },
        { provide: ToastService, useValue: toastService },
        {
          provide: AUTH_SESSION,
          useValue: {
            user: () => null,
            can: () => true,
          },
        },
        {
          provide: MatDialog,
          useValue: {
            open: vi.fn().mockReturnValue({ afterClosed: () => of(undefined) }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load products', () => {
    expect(component).toBeTruthy();
    expect(component.products().length).toBe(1);
    expect(component.products()[0].name).toBe('Camisa Polo');
    expect(component.totalItems()).toBe(1);
  });
});
