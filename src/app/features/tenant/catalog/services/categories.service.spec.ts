import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CategoryDto } from '@core/models';
import { CategoriesService } from './categories.service';

const category: CategoryDto = {
  uuid: 'cat-1',
  name: 'Camisetas',
  slug: 'camisetas',
  description: 'Camisetas em algodão',
  is_active: true,
  order: 1,
  products_count: 5,
  created_at: '',
  updated_at: '',
};

describe('CategoriesService', () => {
  let service: CategoriesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CategoriesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should list categories as a plain array', () => {
    service.getCategories().subscribe((categories) => {
      expect(categories[0].uuid).toBe('cat-1');
    });

    const req = httpMock.expectOne('/api/v1/admin/categories');
    expect(req.request.method).toBe('GET');
    req.flush([category]);
  });

  it('should send search and status filters', () => {
    service.getCategories({ search: 'cami', is_active: true }).subscribe();

    httpMock.expectOne('/api/v1/admin/categories?search=cami&is_active=1').flush([]);
  });

  it('should list public categories', () => {
    service.getPublicCategories().subscribe((categories) => {
      expect(categories.length).toBe(1);
    });

    const req = httpMock.expectOne('/api/v1/categories');
    expect(req.request.method).toBe('GET');
    req.flush([category]);
  });

  it('should create category', () => {
    const payload = { name: 'Acessórios' };

    service.createCategory(payload).subscribe((res) => {
      expect(res.uuid).toBe('cat-1');
    });

    const req = httpMock.expectOne('/api/v1/admin/categories');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(category);
  });

  it('should update category', () => {
    service.updateCategory('cat-1', { name: 'Vestuário' }).subscribe((res) => {
      expect(res.name).toBe('Vestuário');
    });

    const req = httpMock.expectOne('/api/v1/admin/categories/cat-1');
    expect(req.request.method).toBe('PATCH');
    req.flush({ ...category, name: 'Vestuário' });
  });

  it('should delete category', () => {
    service.deleteCategory('cat-1').subscribe();

    const req = httpMock.expectOne('/api/v1/admin/categories/cat-1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });
});
