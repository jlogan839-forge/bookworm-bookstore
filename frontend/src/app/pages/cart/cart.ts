import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-cart',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Cart {
  cart = inject(CartService);

  // ISBN of the row being edited, or null when no row is being edited
  editing = signal<string | null>(null);

  saveQuantity(isbn: string, event: Event) {
    const quantity = Number((event.target as HTMLInputElement).value);
    this.cart.updateQuantity(isbn, quantity);
  }
}
