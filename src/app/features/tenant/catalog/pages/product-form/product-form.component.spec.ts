import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { AUTH_SESSION } from '@core/auth/auth-session';
import { ProductDto } from '@core/models';
import { ToastService } from '@core/toast';
import { of } from 'rxjs';
import { CategoriesService } from '../../services/categories.service';
import { ProductsService } from '../../services/products.service';
import { ProductFormComponent } from './product-form.component';

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
  is_featured: false,
  category: null,
  created_at: '',
  updated_at: '',
};

describe('ProductFormComponent', () => {
  let component: ProductFormComponent;
  let fixture: ComponentFixture<ProductFormComponent>;
  let productsService: {
    getProduct: ReturnType<typeof vi.fn>;
    createProduct: ReturnType<typeof vi.fn>;
    updateProduct: ReturnType<typeof vi.fn>;
    deleteProduct: ReturnType<typeof vi.fn>;
  };
  let categoriesService: { getCategories: ReturnType<typeof vi.fn> };
  let toastService: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    productsService = {
      getProduct: vi.fn().mockReturnValue(of(mockProduct)),
      createProduct: vi.fn().mockReturnValue(of(mockProduct)),
      updateProduct: vi.fn().mockReturnValue(of(mockProduct)),
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
      imports: [ProductFormComponent],
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
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'uuid' ? 'prod-1' : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load product for editing', () => {
    expect(component).toBeTruthy();
    expect(component.isEdit).toBe(true);
    expect(component.form.controls.name.value).toBe('Camisa Polo');
    expect(component.form.controls.price.value).toBe(99.9);
  });

  it('should invalidate when promotional price is greater than or equal to regular price', () => {
    component.form.controls.price.setValue(100);
    component.form.controls.promotional_price.setValue(120);

    expect(component.form.hasError('promoGtePrice')).toBe(true);

    component.form.controls.promotional_price.setValue(80);
    expect(component.form.hasError('promoGtePrice')).toBe(false);
  });
});
