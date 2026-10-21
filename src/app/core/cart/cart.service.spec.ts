import { TestBed } from '@angular/core/testing';
import { ProductDto } from '@core/models';
import { ToastService } from '@core/toast';
import { CartService } from './cart.service';

const mockProduct: ProductDto = {
  uuid: 'prod-1',
  name: 'Camisa Polo',
  slug: 'camisa-polo',
  description: 'Camisa de algodão',
  price: 100,
  promotional_price: 80,
  stock: 5,
  sku: 'POLO-01',
  image_url: null,
  is_active: true,
  is_featured: false,
  created_at: '',
  updated_at: '',
};

describe('CartService', () => {
  let service: CartService;
  let toastService: {
    success: ReturnType<typeof vi.fn>;
    warning: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    localStorage.clear();
    toastService = {
      success: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [CartService, { provide: ToastService, useValue: toastService }],
    });

    service = TestBed.inject(CartService);
    service.clear();
  });

  it('should initialize empty', () => {
    expect(service.items().length).toBe(0);
    expect(service.totalItems()).toBe(0);
    expect(service.subtotal()).toBe(0);
    expect(service.isEmpty()).toBe(true);
  });

  it('should add item and use promotional price if available', () => {
    const added = service.addItem(mockProduct, 2);
    expect(added).toBe(true);
    expect(service.items().length).toBe(1);
    expect(service.items()[0].price).toBe(80);
    expect(service.items()[0].quantity).toBe(2);
    expect(service.totalItems()).toBe(2);
    expect(service.subtotal()).toBe(160);
    expect(service.isOpen()).toBe(true);
    expect(toastService.success).toHaveBeenCalled();
  });

  it('should not add item if stock is 0', () => {
    const outOfStock = { ...mockProduct, stock: 0 };
    const added = service.addItem(outOfStock, 1);
    expect(added).toBe(false);
    expect(service.items().length).toBe(0);
    expect(toastService.warning).toHaveBeenCalled();
  });

  it('should clamp quantity to max stock when adding repeatedly', () => {
    service.addItem(mockProduct, 3);
    service.addItem(mockProduct, 4); // Exceeds stock of 5
    expect(service.items()[0].quantity).toBe(5);
    expect(toastService.info).toHaveBeenCalled();
  });

  it('should update quantity or remove when zero', () => {
    service.addItem(mockProduct, 2);
    service.updateQuantity('prod-1', 4);
    expect(service.items()[0].quantity).toBe(4);

    service.updateQuantity('prod-1', 0);
    expect(service.items().length).toBe(0);
  });

  it('should remove item', () => {
    service.addItem(mockProduct, 1);
    service.removeItem('prod-1');
    expect(service.items().length).toBe(0);
    expect(toastService.info).toHaveBeenCalled();
  });

  it('should toggle, open and close drawer', () => {
    expect(service.isOpen()).toBe(false);
    service.open();
    expect(service.isOpen()).toBe(true);
    service.close();
    expect(service.isOpen()).toBe(false);
    service.toggle();
    expect(service.isOpen()).toBe(true);
  });
});
