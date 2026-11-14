import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface OrderRequest {
  email: string;
  cardholderName: string;
  cardNumber: string;
  address: { street: string; city: string; state: string; zip: string };
  items: { isbn: string; quantity: number }[];
}

export interface OrderConfirmation {
  success: boolean;
  message: string;
  orderId: number;
  subtotal: number;
  tax: number;
  total: number;
  cardLast4: string;
  transaction: { transactionId: string; date: string };
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/orders`;

  placeOrder(order: OrderRequest): Observable<OrderConfirmation> {
    return this.http.post<OrderConfirmation>(this.api, order);
  }
}