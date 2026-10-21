import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { AUTH_SESSION } from '@core/auth/auth-session';
import { CategoryDto } from '@core/models';
import { ToastService } from '@core/toast';
import { of } from 'rxjs';
import { CategoriesService } from '../../services/categories.service';
import { CategoryListComponent } from './category-list.component';

const mockCategory: CategoryDto = {
  uuid: 'cat-1',
  name: 'Eletrônicos',
  slug: 'eletronicos',
  description: 'Smartphones e computadores',
  is_active: true,
  order: 1,
  products_count: 10,
  created_at: '',
  updated_at: '',
};

describe('CategoryListComponent', () => {
  let component: CategoryListComponent;
  let fixture: ComponentFixture<CategoryListComponent>;
  let categoriesService: {
    getCategories: ReturnType<typeof vi.fn>;
    updateCategory: ReturnType<typeof vi.fn>;
    deleteCategory: ReturnType<typeof vi.fn>;
  };
  let toastService: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    categoriesService = {
      getCategories: vi.fn().mockReturnValue(of([mockCategory])),
      updateCategory: vi.fn().mockReturnValue(of({ ...mockCategory, is_active: false })),
      deleteCategory: vi.fn().mockReturnValue(of(undefined)),
    };

    toastService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CategoryListComponent],
      providers: [
        provideNoopAnimations(),
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

    fixture = TestBed.createComponent(CategoryListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load categories', () => {
    expect(component).toBeTruthy();
    expect(component.categories().length).toBe(1);
    expect(component.categories()[0].name).toBe('Eletrônicos');
  });

  it('should filter categories by search term', () => {
    component.search.set('smart');
    expect(component.filteredCategories().length).toBe(1);

    component.search.set('inexistente');
    expect(component.filteredCategories().length).toBe(0);
  });
});
