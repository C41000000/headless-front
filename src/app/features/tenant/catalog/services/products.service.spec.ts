import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PaginatedResponse, ProductDto } from '@core/models';
import { ProductsService } from './products.service';

const product: ProductDto = {
  uuid: 'prod-1',
  name: 'Tênis Esportivo',
  slug: 'tenis-esportivo',
  description: 'Tênis confortável para corrida',
  price: 299.9,
  promotional_price: 249.9,
  stock: 20,
  sku: 'TENIS-01',
  image_url: 'https://cdn.example.com/tenis.webp',
  is_active: true,
  is_featured: true,
  category: {
    uuid: 'cat-1',
    name: 'Calçados',
    slug: 'calcados',
    description: null,
    is_active: true,
    order: 0,
    created_at: '',
    updated_at: '',
  },
  created_at: '',
  updated_at: '',
};

const paginatedProducts: PaginatedResponse<ProductDto> = {
  data: [product],
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

describe('ProductsService', () => {
  let service: ProductsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProductsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should list admin products with pagination', () => {
    service.getProducts({ page: 1, search: 'tênis' }).subscribe((res) => {
      expect(res.data.length).toBe(1);
      expect(res.data[0].uuid).toBe('prod-1');
    });

    const req = httpMock.expectOne('/api/v1/admin/products?search=t%C3%AAnis&page=1');
    expect(req.request.method).toBe('GET');
    req.flush(paginatedProducts);
  });

  it('should list public products', () => {
    service.getPublicProducts({ category_slug: 'calcados' }).subscribe((res) => {
      expect(res.data[0].slug).toBe('tenis-esportivo');
    });

    const req = httpMock.expectOne('/api/v1/products?category_slug=calcados');
    expect(req.request.method).toBe('GET');
    req.flush(paginatedProducts);
  });

  it('should get public product by slug', () => {
    service.getPublicProduct('tenis-esportivo').subscribe((res) => {
      expect(res.name).toBe('Tênis Esportivo');
    });

    const req = httpMock.expectOne('/api/v1/products/tenis-esportivo');
    expect(req.request.method).toBe('GET');
    req.flush(product);
  });

  it('should create product', () => {
    const payload = { name: 'Novo Tênis', price: 199.9 };

    service.createProduct(payload).subscribe((res) => {
      expect(res.uuid).toBe('prod-1');
    });

    const req = httpMock.expectOne('/api/v1/admin/products');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(product);
  });

  it('should update product', () => {
    service.updateProduct('prod-1', { price: 219.9 }).subscribe((res) => {
      expect(res.price).toBe(219.9);
    });

    const req = httpMock.expectOne('/api/v1/admin/products/prod-1');
    expect(req.request.method).toBe('PATCH');
    req.flush({ ...product, price: 219.9 });
  });

  it('should delete product', () => {
    service.deleteProduct('prod-1').subscribe();

    const req = httpMock.expectOne('/api/v1/admin/products/prod-1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });
});
