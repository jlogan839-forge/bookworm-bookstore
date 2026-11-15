import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../api/api.config';
import { Book, BookQuery } from '../api/book';

/**
 * Talks to the /api/books endpoints. Keep this thin: build the request and return typed data.
 * Search, filtering, and stock rules belong to the backend (catalog_service.py).
 */
@Injectable({ providedIn: 'root' })
export class BookService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_BASE_URL}/books`;

  getBooks(query: BookQuery = {}): Observable<Book[]> {
    let params = new HttpParams();
    if (query.q) params = params.set('q', query.q);
    if (query.genre) params = params.set('genre', query.genre);
    return this.http.get<Book[]>(this.url, { params });
  }

  getBook(isbn: string): Observable<Book> {
    return this.http.get<Book>(`${this.url}/${encodeURIComponent(isbn)}`);
  }
}
