import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../api/api.config';
import { Book, BookPage, BookQuery, Genre } from '../api/book';

/**
 * Talks to the /api/books endpoints. Keep this thin: build the request and return typed data.
 * Search, filtering, and stock rules belong to the backend (catalog_service.py).
 */
@Injectable({ providedIn: 'root' })
export class BookService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_BASE_URL}/books`;

  /** One page of books. Empty values are left out of the request. */
  getBooks(query: BookQuery = {}): Observable<BookPage> {
    let params = new HttpParams();
    if (query.q) params = params.set('q', query.q);
    if (query.genre) params = params.set('genre', query.genre);
    if (query.page && query.page > 1) params = params.set('page', query.page);
    if (query.perPage) params = params.set('per_page', query.perPage);
    return this.http.get<BookPage>(this.url, { params });
  }

  /** Every genre in the catalog with its book count, sorted by name. */
  getGenres(): Observable<Genre[]> {
    return this.http.get<Genre[]>(`${this.url}/genres`);
  }

  getBook(isbn: string): Observable<Book> {
    return this.http.get<Book>(`${this.url}/${encodeURIComponent(isbn)}`);
  }
}
