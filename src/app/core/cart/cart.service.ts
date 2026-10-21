import { Injectable, computed, inject, signal } from '@angular/core';
import { CartItem, ProductDto } from '@core/models';
import { ToastService } from '@core/toast';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly toastService = inject(ToastService);
  private readonly STORAGE_KEY = 'headless_store_cart';

  public readonly items = signal<CartItem[]>(this.loadInitialCart());
  public readonly isOpen = signal<boolean>(false);

  public readonly totalItems = computed(() =>
    this.items().reduce((acc, item) => acc + item.quantity, 0),
  );

  public readonly subtotal = computed(() =>
    this.items().reduce((acc, item) => acc + item.price * item.quantity, 0),
  );

  public readonly isEmpty = computed(() => this.items().length === 0);

  public addItem(product: ProductDto, quantity = 1): boolean {
    if (product.stock <= 0) {
      this.toastService.warning('Produto esgotado no momento.');
      return false;
    }

    const currentItems = this.items();
    const existingIndex = currentItems.findIndex((i) => i.product_uuid === product.uuid);
    const effectivePrice = product.promotional_price ?? product.price;

    if (existingIndex > -1) {
      const existing = currentItems[existingIndex];
      const targetQty = existing.quantity + quantity;

      if (targetQty > product.stock) {
        if (existing.quantity >= product.stock) {
          this.toastService.info(
            `Você já adicionou a quantidade máxima disponível (${product.stock}).`,
          );
          this.open();
          return false;
        }

        const updated = [...currentItems];
        updated[existingIndex] = {
          ...existing,
          quantity: product.stock,
          stock: product.stock,
          price: effectivePrice,
        };
        this.items.set(updated);
        this.persist();
        this.toastService.info(`Quantidade ajustada para o estoque disponível (${product.stock}).`);
        this.open();
        return true;
      }

      const updated = [...currentItems];
      updated[existingIndex] = {
        ...existing,
        quantity: targetQty,
        stock: product.stock,
        price: effectivePrice,
      };
      this.items.set(updated);
    } else {
      const initialQty = Math.min(quantity, product.stock);
      const newItem: CartItem = {
        product_uuid: product.uuid,
        name: product.name,
        slug: product.slug,
        price: effectivePrice,
        original_price: product.price,
        promotional_price: product.promotional_price,
        image_url: product.image_url,
        quantity: initialQty,
        stock: product.stock,
      };
      this.items.set([...currentItems, newItem]);
    }

    this.persist();
    this.toastService.success(`"${product.name}" adicionado ao carrinho!`);
    this.open();
    return true;
  }

  public updateQuantity(productUuid: string, newQuantity: number): void {
    if (newQuantity <= 0) {
      this.removeItem(productUuid);
      return;
    }

    const currentItems = this.items();
    const index = currentItems.findIndex((i) => i.product_uuid === productUuid);
    if (index === -1) {
      return;
    }

    const item = currentItems[index];
    const clampedQty = Math.min(newQuantity, item.stock);

    if (newQuantity > item.stock) {
      this.toastService.info(`Estoque máximo disponível: ${item.stock}`);
    }

    const updated = [...currentItems];
    updated[index] = {
      ...item,
      quantity: clampedQty,
    };
    this.items.set(updated);
    this.persist();
  }

  public removeItem(productUuid: string): void {
    const currentItems = this.items();
    const removedItem = currentItems.find((i) => i.product_uuid === productUuid);
    this.items.set(currentItems.filter((i) => i.product_uuid !== productUuid));
    this.persist();

    if (removedItem) {
      this.toastService.info(`"${removedItem.name}" removido do carrinho.`);
    }
  }

  public clear(): void {
    this.items.set([]);
    this.persist();
  }

  public open(): void {
    this.isOpen.set(true);
  }

  public close(): void {
    this.isOpen.set(false);
  }

  public toggle(): void {
    this.isOpen.update((v) => !v);
  }

  private loadInitialCart(): CartItem[] {
    if (typeof window === 'undefined') {
      return [];
    }
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private persist(): void {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.items()));
    } catch {
      // Falha silenciosa em caso de cota excedida
    }
  }
}
