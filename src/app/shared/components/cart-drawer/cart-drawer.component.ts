import { CurrencyPipe } from '@angular/common';
import { Component, HostListener, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { CartService } from '@core/cart';
import { ToastService } from '@core/toast';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CurrencyPipe, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './cart-drawer.component.html',
  styleUrl: './cart-drawer.component.scss',
})
export class CartDrawerComponent {
  public readonly cartService = inject(CartService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  @HostListener('document:keydown.escape')
  public onEscape(): void {
    if (this.cartService.isOpen()) {
      this.cartService.close();
    }
  }

  public onCheckout(): void {
    this.cartService.close();
    this.router.navigate(['/checkout']).catch(() => {
      this.toastService.info('Checkout será disponibilizado no próximo passo!');
    });
  }
}
