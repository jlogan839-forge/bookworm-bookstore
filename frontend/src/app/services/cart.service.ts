import { Injectable, signal, computed } from '@angular/core';

export interface CartItem {
  isbn: string;
  title: string;
  author: string;
  price: number;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  items = signal<CartItem[]>([
    {
      isbn: '9780439708180',
      title: "Harry Potter and the Sorcerer's Stone",
      author: 'J.K. Rowling',
      price: 8.99,
      quantity: 1,
    },
    {
      isbn: '9780061120084',
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      price: 12.5,
      quantity: 2,
    },
  ]);

  count = computed(() => this.items().reduce((sum, item) => sum + item.quantity, 0));

  total = computed(() => this.items().reduce((sum, item) => sum + item.price * item.quantity, 0));

  remove(isbn: string) {
    this.items.update((list) => list.filter((item) => item.isbn !== isbn));
  }
}
