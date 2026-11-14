import { Injectable, computed, signal } from '@angular/core';

export interface CartItem {
  isbn: string;
  title: string;
  price: number;
  quantity: number;
}

const CART_KEY = 'bookworm_cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  // The cart, saved in the browser so it survives a refresh
  readonly items = signal<CartItem[]>(this.load());

  // Total number of books, for the header badge
  readonly count = computed(() => this.items().reduce((sum, i) => sum + i.quantity, 0));

  // Price before tax (the server adds tax at checkout)
  readonly subtotal = computed(() =>
    Math.round(this.items().reduce((sum, i) => sum + i.price * i.quantity, 0) * 100) / 100,
  );

  add(book: { isbn: string; title: string; price: number }, quantity = 1) {
    const existing = this.items().find((i) => i.isbn === book.isbn);
    if (existing) {
      this.updateQuantity(book.isbn, existing.quantity + quantity);
    } else {
      this.save([...this.items(), { ...book, quantity }]);
    }
  }

  updateQuantity(isbn: string, quantity: number) {
    if (quantity < 1) {
      this.remove(isbn);
      return;
    }
    this.save(this.items().map((i) => (i.isbn === isbn ? { ...i, quantity } : i)));
  }

  remove(isbn: string) {
    this.save(this.items().filter((i) => i.isbn !== isbn));
  }

  clear() {
    this.save([]);
  }

  private save(items: CartItem[]) {
    this.items.set(items);
    try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch {}
  }

  private load(): CartItem[] {
    try { return JSON.parse(localStorage.getItem(CART_KEY) ?? '[]'); } catch { return []; }
  }
}