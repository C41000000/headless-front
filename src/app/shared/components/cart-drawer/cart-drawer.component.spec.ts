import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { CartService } from '@core/cart';
import { ToastService } from '@core/toast';
import { CartDrawerComponent } from './cart-drawer.component';

describe('CartDrawerComponent', () => {
  let component: CartDrawerComponent;
  let fixture: ComponentFixture<CartDrawerComponent>;
  let cartService: CartService;
  let router: { navigate: ReturnType<typeof vi.fn> };
  let toastService: { info: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    router = {
      navigate: vi.fn().mockResolvedValue(true),
    };
    toastService = {
      info: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CartDrawerComponent],
      providers: [
        CartService,
        { provide: Router, useValue: router },
        { provide: ToastService, useValue: toastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CartDrawerComponent);
    component = fixture.componentInstance;
    cartService = TestBed.inject(CartService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should close on escape key when open', () => {
    cartService.open();
    expect(cartService.isOpen()).toBe(true);

    component.onEscape();
    expect(cartService.isOpen()).toBe(false);
  });

  it('should close drawer and navigate on checkout', () => {
    cartService.open();
    component.onCheckout();
    expect(cartService.isOpen()).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/checkout']);
  });
});
