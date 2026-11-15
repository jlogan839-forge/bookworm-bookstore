import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../api/api.config';
import { BookPage } from '../api/book';
import { BookService } from './book.service';

const EMPTY_PAGE: BookPage = { items: [], total: 0, page: 1, perPage: 24, totalPages: 0 };

describe('BookService', () => {
  let service: BookService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BookService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests the first page of all books with no params', () => {
    service.getBooks().subscribe();
    const req = http.expectOne(`${API_BASE_URL}/books`);
    expect(req.request.params.keys()).toEqual([]);
    req.flush(EMPTY_PAGE);
  });

  it('sends q and genre when given, and skips empty values', () => {
    service.getBooks({ q: 'dune', genre: '' }).subscribe();
    const req = http.expectOne((r) => r.url === `${API_BASE_URL}/books`);
    expect(req.request.params.get('q')).toBe('dune');
    expect(req.request.params.has('genre')).toBe(false);
    req.flush(EMPTY_PAGE);
  });

  it('sends q and genre together', () => {
    service.getBooks({ q: 'ring', genre: 'Fantasy' }).subscribe();
    const req = http.expectOne((r) => r.url === `${API_BASE_URL}/books`);
    expect(req.request.params.get('q')).toBe('ring');
    expect(req.request.params.get('genre')).toBe('Fantasy');
    req.flush(EMPTY_PAGE);
  });

  it('sends page and per_page, leaving out page 1', () => {
    service.getBooks({ page: 3, perPage: 10 }).subscribe();
    const req = http.expectOne((r) => r.url === `${API_BASE_URL}/books`);
    expect(req.request.params.get('page')).toBe('3');
    expect(req.request.params.get('per_page')).toBe('10');
    req.flush(EMPTY_PAGE);

    service.getBooks({ page: 1 }).subscribe();
    const first = http.expectOne((r) => r.url === `${API_BASE_URL}/books`);
    expect(first.request.params.has('page')).toBe(false);
    first.flush(EMPTY_PAGE);
  });

  it('requests the genre list', () => {
    let genres: unknown;
    service.getGenres().subscribe((value) => (genres = value));
    http.expectOne(`${API_BASE_URL}/books/genres`).flush([{ genre: 'Fantasy', count: 50 }]);
    expect(genres).toEqual([{ genre: 'Fantasy', count: 50 }]);
  });

  it('requests one book by ISBN', () => {
    service.getBook('9780441172719').subscribe();
    http.expectOne(`${API_BASE_URL}/books/9780441172719`).flush({});
  });
});
