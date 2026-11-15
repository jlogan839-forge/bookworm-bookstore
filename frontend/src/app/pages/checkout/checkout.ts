import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { OrderConfirmation, OrderService } from '../../services/order.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe],
  selector: 'app-checkout',
  styleUrl: './checkout.css',
  templateUrl: './checkout.html',
})
export class Checkout {
  cart = inject(CartService);
  private orders = inject(OrderService);

  form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    street: ['', Validators.required],
    city: ['', Validators.required],
    state: ['', Validators.required],
    zip: ['', [Validators.required, Validators.pattern(/^\d{5}(-\d{4})?$/)]],
    cardholderName: ['', Validators.required],
    cardNumber: ['', [Validators.required, Validators.pattern(/^[\d\s-]{13,23}$/)]],
  });

  error = signal('');
  submitting = signal(false);
  confirmation = signal<OrderConfirmation | null>(null);

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Review every field. ZIP is 5 digits.');
      return;
    }
    this.submitting.set(true);
    this.error.set('');
    const f = this.form.getRawValue();

    this.orders.placeOrder({
      email: f.email,
      cardholderName: f.cardholderName,
      cardNumber: f.cardNumber,
      address: { street: f.street, city: f.city, state: f.state, zip: f.zip },
      items: this.cart.items().map((i) => ({ isbn: i.isbn, quantity: i.quantity })),
    }).subscribe({
      next: (result) => {
        this.confirmation.set(result);
        this.cart.clear();
        this.submitting.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.error?.error ?? 'Something went wrong. Try again.');
        this.submitting.set(false);
      },
    });
  }
}