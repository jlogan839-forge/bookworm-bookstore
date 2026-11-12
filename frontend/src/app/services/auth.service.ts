import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Customer {
  customerId: number;
  name: string;
  email: string;
  phone: string | null;
}

interface AuthResponse {
  token: string;
  customer: Customer;
}

const TOKEN_KEY = 'bookworm_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private api = `${environment.apiUrl}/auth`;

  // Who's logged in (null = nobody)
  readonly customer = signal<Customer | null>(null);
  readonly isLoggedIn = computed(() => this.customer() !== null);

  constructor() {
    // If a token was saved from an earlier visit, find out who it belongs to
    if (this.getToken()) {
      this.http.get<Customer>(`${this.api}/me`).subscribe({
        next: (c) => this.customer.set(c),
        error: () => this.logout(),
      });
    }
  }

  register(name: string, email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.api}/register`, { name, email, password })
      .pipe(tap((res) => this.saveLogin(res)));
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.api}/login`, { email, password })
      .pipe(tap((res) => this.saveLogin(res)));
  }

  logout() {
    try { localStorage.removeItem(TOKEN_KEY); } catch {}
    this.customer.set(null);
    this.router.navigate(['/']);
  }

  getToken(): string | null {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  }

  private saveLogin(res: AuthResponse) {
    try { localStorage.setItem(TOKEN_KEY, res.token); } catch {}
    this.customer.set(res.customer);
  }
}