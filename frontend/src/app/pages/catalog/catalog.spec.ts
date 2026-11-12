import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { API_BASE_URL } from '../../api/api.config';
import { Book } from '../../api/book';
import { Catalog } from './catalog';

const BOOKS_URL = `${API_BASE_URL}/books`;

function makeBook(overrides: Partial<Book>): Book {
  return {
    isbn: '0000000000000',
    title: 'Untitled',
    author: 'Anonymous',
    genre: 'Fantasy',
    publicationYear: 2000,
    price: 10,
    stockQty: 1,
    inStock: true,
    description: null,
    coverUrl: null,
    ...overrides,
  };
}

const BOOKS = [
  makeBook({ isbn: '1', title: 'Dune', genre: 'Science Fiction' }),
  makeBook({ isbn: '2', title: 'The Hobbit', genre: 'Fantasy' }),
];

describe('Catalog', () => {
  let fixture: ComponentFixture<Catalog>;
  let http: HttpTestingController;
  let el: HTMLElement;

  /** Answer the books request(s) for the current URL params, and the genre-list request. */
  function flushBooks(results: Book[], allBooks: Book[] = BOOKS) {
    for (const req of http.match((r) => r.url === BOOKS_URL)) {
      req.flush(req.request.params.keys().length ? results : allBooks);
    }
  }

  async function setup(url = '/') {
    await TestBed.configureTestingModule({
      imports: [Catalog],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: '', component: Catalog }]),
      ],
    }).compileComponents();
    await TestBed.inject(Router).navigateByUrl(url);
    fixture = TestBed.createComponent(Catalog);
    http = TestBed.inject(HttpTestingController);
    el = fixture.nativeElement;
    fixture.detectChanges();
  }

  async function settle() {
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('renders a card for each book and the result count', async () => {
    await setup();
    flushBooks(BOOKS);
    await settle();
    expect(el.querySelectorAll('app-book-card').length).toBe(2);
    expect(el.textContent).toContain('2 books');
  });

  it('builds the genre dropdown from the books', async () => {
    await setup();
    flushBooks(BOOKS);
    await settle();
    const options = [...el.querySelectorAll('#catalog-genre option')].map((o) => o.textContent?.trim());
    expect(options).toEqual(['All genres', 'Fantasy', 'Science Fiction']);
  });

  it('sends the search from the URL to the API', async () => {
    await setup('/?q=dune');
    const req = http.expectOne((r) => r.url === BOOKS_URL && r.params.get('q') === 'dune');
    req.flush([BOOKS[0]]);
    flushBooks([]);
    await settle();
    expect(el.textContent).toContain('1 book matching “dune”');
    expect((el.querySelector('#catalog-search') as HTMLInputElement).value).toBe('dune');
  });

  it('shows an empty state with a clear filters button', async () => {
    await setup('/?q=zzz');
    flushBooks([]);
    await settle();
    expect(el.textContent).toContain('No books match your search.');
    expect(el.textContent).toContain('Clear filters');
  });

  it('shows an error with a retry button when the API fails', async () => {
    await setup();
    for (const req of http.match((r) => r.url === BOOKS_URL)) {
      req.flush('down', { status: 500, statusText: 'Server Error' });
    }
    await settle();
    expect(el.querySelector('[role="alert"]')?.textContent).toContain("couldn't load the catalog");
    expect(el.textContent).toContain('Retry');
  });
});
