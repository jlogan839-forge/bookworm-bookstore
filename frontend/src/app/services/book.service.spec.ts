import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../api/api.config';
import { BookService } from './book.service';

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

  it('requests all books with no params', () => {
    service.getBooks().subscribe();
    const req = http.expectOne(`${API_BASE_URL}/books`);
    expect(req.request.params.keys()).toEqual([]);
    req.flush([]);
  });

  it('sends q and genre when given, and skips empty values', () => {
    service.getBooks({ q: 'dune', genre: '' }).subscribe();
    const req = http.expectOne((r) => r.url === `${API_BASE_URL}/books`);
    expect(req.request.params.get('q')).toBe('dune');
    expect(req.request.params.has('genre')).toBe(false);
    req.flush([]);
  });

  it('requests one book by ISBN', () => {
    service.getBook('9780441172719').subscribe();
    http.expectOne(`${API_BASE_URL}/books/9780441172719`).flush({});
  });
});
