import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavigationEnd, provideRouter, Router } from '@angular/router';
import { filter, firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../../api/api.config';
import { Book, BookPage, Genre } from '../../api/book';
import { Catalog } from './catalog';

const BOOKS_URL = `${API_BASE_URL}/books`;
const GENRES_URL = `${API_BASE_URL}/books/genres`;

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

const GENRES: Genre[] = [
  { genre: 'Fantasy', count: 1 },
  { genre: 'Science Fiction', count: 1 },
];

/** A single page holding all of `items`, unless overridden. */
function makePage(items: Book[], overrides: Partial<BookPage> = {}): BookPage {
  return {
    items,
    total: items.length,
    page: 1,
    perPage: 24,
    totalPages: items.length ? 1 : 0,
    ...overrides,
  };
}

/** 24 books, i.e. one full page. */
const FULL_PAGE = Array.from({ length: 24 }, (_, i) => makeBook({ isbn: `${i}`, title: `Book ${i}` }));

describe('Catalog', () => {
  let fixture: ComponentFixture<Catalog>;
  let http: HttpTestingController;
  let router: Router;
  let el: HTMLElement;

  /** Answer any pending books request(s) with `result`, and the genre-list request. */
  function flush(result: BookPage) {
    for (const req of http.match((r) => r.url === BOOKS_URL)) req.flush(result);
    for (const req of http.match(GENRES_URL)) req.flush(GENRES);
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
    router = TestBed.inject(Router);
    await router.navigateByUrl(url);
    fixture = TestBed.createComponent(Catalog);
    http = TestBed.inject(HttpTestingController);
    el = fixture.nativeElement;
    fixture.detectChanges();
  }

  async function settle() {
    await fixture.whenStable();
    fixture.detectChanges();
  }

  /** Resolves when the next router navigation finishes. Call it before triggering one. */
  function nextNavigation(): Promise<unknown> {
    return firstValueFrom(router.events.pipe(filter((e) => e instanceof NavigationEnd)));
  }

  /** Navigate, then answer the books request the new URL triggers. */
  async function navigateAndFlush(url: string, result: BookPage) {
    await router.navigateByUrl(url);
    fixture.detectChanges();
    flush(result);
    await settle();
  }

  function button(label: string): HTMLButtonElement {
    const found = [...el.querySelectorAll('button')].find((b) => b.textContent?.trim().startsWith(label));
    if (!found) throw new Error(`No button labelled "${label}"`);
    return found;
  }

  it('renders a card for each book and the result count', async () => {
    await setup();
    flush(makePage(BOOKS));
    await settle();
    expect(el.querySelectorAll('app-book-card').length).toBe(2);
    expect(el.textContent).toContain('2 books');
  });

  it('builds the genre dropdown from the genres endpoint, with counts', async () => {
    await setup();
    flush(makePage(BOOKS));
    await settle();
    const options = [...el.querySelectorAll('#catalog-genre option')].map((o) => o.textContent?.trim());
    expect(options).toEqual(['All genres', 'Fantasy (1)', 'Science Fiction (1)']);
  });

  it('sends the search from the URL to the API', async () => {
    await setup('/?q=dune');
    const req = http.expectOne((r) => r.url === BOOKS_URL && r.params.get('q') === 'dune');
    req.flush(makePage([BOOKS[0]]));
    flush(makePage([]));
    await settle();
    expect(el.textContent).toContain('1 book matching “dune”');
    expect((el.querySelector('#catalog-search') as HTMLInputElement).value).toBe('dune');
  });

  it('sends search and genre together and shows what the API returns', async () => {
    await setup('/?q=dune&genre=Fantasy');
    const req = http.expectOne((r) => r.url === BOOKS_URL);
    expect(req.request.params.get('q')).toBe('dune');
    expect(req.request.params.get('genre')).toBe('Fantasy');
    req.flush(makePage([BOOKS[1]]));
    flush(makePage([]));
    await settle();
    expect(el.querySelectorAll('app-book-card').length).toBe(1);
    expect(el.textContent).toContain('1 book matching “dune” in Fantasy');
  });

  it('shows an empty state with a clear filters button', async () => {
    await setup('/?q=zzz');
    flush(makePage([]));
    await settle();
    expect(el.textContent).toContain('No books match your search.');
    expect(el.textContent).toContain('Clear filters');
  });

  it('shows an error with a retry button when the API fails', async () => {
    await setup();
    for (const req of http.match((r) => r.url === BOOKS_URL)) {
      req.flush('down', { status: 500, statusText: 'Server Error' });
    }
    flush(makePage([]));
    await settle();
    expect(el.querySelector('[role="alert"]')?.textContent).toContain("couldn't load the catalog");
    expect(el.textContent).toContain('Retry');
  });

  describe('pagination', () => {
    it('hides the page controls when everything fits on one page', async () => {
      await setup();
      flush(makePage(BOOKS));
      await settle();
      expect(el.querySelector('nav[aria-label="Pages"]')).toBeNull();
    });

    it('requests the page from the URL and shows where it is', async () => {
      await setup('/?page=2');
      const req = http.expectOne((r) => r.url === BOOKS_URL);
      expect(req.request.params.get('page')).toBe('2');
      req.flush(makePage(FULL_PAGE, { total: 50, page: 2, totalPages: 3 }));
      flush(makePage([]));
      await settle();
      expect(el.textContent).toContain('Showing 25–48 of 50 books');
      expect(el.textContent).toContain('Page 2 of 3');
      expect(button('Previous').disabled).toBe(false);
      expect(button('Next').disabled).toBe(false);
    });

    it('disables Previous on the first page and Next on the last', async () => {
      await setup();
      flush(makePage(FULL_PAGE, { total: 50, totalPages: 3 }));
      await settle();
      expect(button('Previous').disabled).toBe(true);
      expect(button('Next').disabled).toBe(false);

      await navigateAndFlush('/?page=3', makePage(BOOKS, { total: 50, page: 3, totalPages: 3 }));
      expect(button('Previous').disabled).toBe(false);
      expect(button('Next').disabled).toBe(true);
    });

    it('moves to the next page in the URL', async () => {
      await setup('/?genre=Fantasy');
      flush(makePage(FULL_PAGE, { total: 50, totalPages: 3 }));
      await settle();
      const navigated = nextNavigation();
      button('Next').click();
      await navigated;
      expect(router.url).toBe('/?genre=Fantasy&page=2');
    });

    it('goes back to page 1 when the genre changes', async () => {
      await setup('/?page=3');
      flush(makePage(BOOKS, { total: 50, page: 3, totalPages: 3 }));
      await settle();
      const select = el.querySelector('#catalog-genre') as HTMLSelectElement;
      select.value = 'Fantasy';
      const navigated = nextNavigation();
      select.dispatchEvent(new Event('change'));
      await navigated;
      expect(router.url).toBe('/?genre=Fantasy');
    });

    it('treats an invalid page in the URL as page 1', async () => {
      await setup('/?page=abc');
      const req = http.expectOne((r) => r.url === BOOKS_URL);
      expect(req.request.params.has('page')).toBe(false);
      req.flush(makePage(BOOKS));
      flush(makePage([]));
    });

    it('offers a way back when the page is past the end', async () => {
      await setup('/?page=99');
      flush(makePage([], { total: 50, page: 99, totalPages: 3 }));
      await settle();
      expect(el.textContent).toContain("This page doesn't exist.");
      const navigated = nextNavigation();
      button('Go to the first page').click();
      await navigated;
      expect(router.url).toBe('/');
    });
  });
});
