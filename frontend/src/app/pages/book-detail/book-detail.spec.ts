import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { API_BASE_URL } from '../../api/api.config';
import { Book } from '../../api/book';
import { Review } from '../../api/review';
import { AuthService, Customer } from '../../services/auth.service';
import { BookDetail } from './book-detail';

const ISBN = '9780441172719';
const BOOK_URL = `${API_BASE_URL}/books/${ISBN}`;
const REVIEWS_URL = `${BOOK_URL}/reviews`;

const BOOK: Book = {
  isbn: ISBN,
  title: 'Dune',
  author: 'Frank Herbert',
  genre: 'Science Fiction',
  publicationYear: 1965,
  price: 18.99,
  stockQty: 8,
  inStock: true,
  description: 'Spice and sand.',
  coverUrl: null,
  averageRating: 4.5,
  reviewCount: 2,
};

const ADA: Customer = { customerId: 1, name: 'Ada', email: 'ada@example.com', phone: null };

function makeReview(overrides: Partial<Review>): Review {
  return {
    reviewId: 1,
    isbn: ISBN,
    customerId: 2,
    reviewerName: 'Bob',
    rating: 4,
    reviewText: 'Pretty good.',
    reviewDate: '2026-11-01',
    ...overrides,
  };
}

const BOBS_REVIEW = makeReview({ reviewId: 1, customerId: 2, reviewerName: 'Bob' });
const ADAS_REVIEW = makeReview({ reviewId: 2, customerId: 1, reviewerName: 'Ada', rating: 5, reviewText: 'Loved it.' });

describe('BookDetail', () => {
  let http: HttpTestingController;
  let harness: RouterTestingHarness;
  let el: HTMLElement;
  const customer = signal<Customer | null>(null);

  async function open(reviews: Review[]) {
    await navigate();
    http.expectOne(BOOK_URL).flush(BOOK);
    http.expectOne(REVIEWS_URL).flush(reviews);
    await settle();
  }

  async function navigate() {
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(`/books/${ISBN}`, BookDetail);
    harness.fixture.detectChanges();
    el = harness.routeNativeElement!;
  }

  async function settle() {
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();
  }

  function button(text: string): HTMLButtonElement {
    const found = [...el.querySelectorAll('button')].find((b) => b.textContent!.includes(text));
    if (!found) throw new Error(`No button "${text}"`);
    return found;
  }

  function hasButton(text: string): boolean {
    return [...el.querySelectorAll('button')].some((b) => b.textContent!.includes(text));
  }

  async function fillForm(rating: number, text: string) {
    el.querySelectorAll<HTMLInputElement>('input[type=radio]')[rating - 1].click();
    const textarea = el.querySelector('textarea')!;
    textarea.value = text;
    textarea.dispatchEvent(new Event('input'));
    await settle();
  }

  /** After a change the page reloads the book and reviews, so the average updates. */
  function flushRefresh(reviews: Review[], book: Partial<Book> = {}) {
    harness.fixture.detectChanges();
    http.expectOne(REVIEWS_URL).flush(reviews);
    http.expectOne(BOOK_URL).flush({ ...BOOK, ...book });
  }

  beforeEach(() => {
    customer.set(null);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'books/:isbn', component: BookDetail }]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: { customer, isLoggedIn: computed(() => customer() !== null) },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('shows the book with its average rating and reviews', async () => {
    await open([BOBS_REVIEW]);
    expect(el.querySelector('h1')!.textContent).toContain('Dune');
    expect(el.textContent).toContain('4.5 (2 reviews)');
    expect(el.textContent).toContain('Pretty good.');
    expect(el.textContent).toContain('Bob');
  });

  it('asks logged-out users to log in, and has no form', async () => {
    await open([BOBS_REVIEW]);
    const link = [...el.querySelectorAll('a')].find((a) => a.textContent!.includes('Log in'))!;
    expect(link.getAttribute('href')).toBe(`/login?returnUrl=%2Fbooks%2F${ISBN}`);
    expect(el.querySelector('form')).toBeNull();
    expect(hasButton('Edit')).toBe(false);
  });

  it("doesn't let users edit or delete someone else's review", async () => {
    customer.set(ADA);
    await open([BOBS_REVIEW]);
    expect(hasButton('Edit')).toBe(false);
    expect(hasButton('Delete')).toBe(false);
  });

  it('lets a logged-in user post a review', async () => {
    customer.set(ADA);
    await open([BOBS_REVIEW]);
    await fillForm(5, 'Loved it.');
    button('Post review').click();

    const req = http.expectOne(REVIEWS_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ rating: 5, reviewText: 'Loved it.' });
    req.flush(ADAS_REVIEW);
    flushRefresh([ADAS_REVIEW, BOBS_REVIEW], { averageRating: 4.5 });
    await settle();

    expect(el.textContent).toContain('Your review was posted.');
    expect(el.querySelector('form')).toBeNull(); // one review per book
    expect(hasButton('Edit')).toBe(true);
  });

  it('checks the rating and text before sending', async () => {
    customer.set(ADA);
    await open([]);
    button('Post review').click();
    await settle();
    expect(el.querySelector('[role=alert]')!.textContent).toContain('Choose a rating');

    await fillForm(3, '   ');
    button('Post review').click();
    await settle();
    expect(el.querySelector('[role=alert]')!.textContent).toContain('Write a short review');
    // No request was sent (http.verify() in afterEach)
  });

  it("shows the backend's error message", async () => {
    customer.set(ADA);
    await open([]);
    await fillForm(4, 'Good');
    button('Post review').click();
    http.expectOne(REVIEWS_URL).flush(
      { error: "You've already reviewed this book. Edit your review instead." },
      { status: 400, statusText: 'Bad Request' },
    );
    await settle();
    expect(el.querySelector('[role=alert]')!.textContent).toContain('already reviewed');
  });

  it('lets users edit their own review', async () => {
    customer.set(ADA);
    await open([ADAS_REVIEW, BOBS_REVIEW]);
    button('Edit').click();
    await settle();

    expect(el.querySelector('h3')!.textContent).toContain('Edit your review');
    expect(el.querySelector('textarea')!.value).toBe('Loved it.');

    await fillForm(3, 'Changed my mind.');
    button('Save changes').click();
    const req = http.expectOne(`${API_BASE_URL}/reviews/2`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ rating: 3, reviewText: 'Changed my mind.' });
    const edited = { ...ADAS_REVIEW, rating: 3, reviewText: 'Changed my mind.' };
    req.flush(edited);
    flushRefresh([edited, BOBS_REVIEW], { averageRating: 3.5 });
    await settle();

    expect(el.textContent).toContain('Your review was updated.');
    expect(el.textContent).toContain('Changed my mind.');
    expect(el.textContent).toContain('3.5 (2 reviews)');
  });

  it('lets users delete their own review after confirming', async () => {
    customer.set(ADA);
    await open([ADAS_REVIEW, BOBS_REVIEW]);
    button('Delete').click();
    await settle();
    expect(el.textContent).toContain("Delete your review? This can't be undone.");

    button('Yes, delete').click();
    const req = http.expectOne(`${API_BASE_URL}/reviews/2`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
    flushRefresh([BOBS_REVIEW], { averageRating: 4, reviewCount: 1 });
    await settle();

    expect(el.textContent).toContain('Your review was deleted.');
    expect(el.textContent).not.toContain('Loved it.');
    expect(el.querySelector('form')).not.toBeNull(); // they can write a new one
  });

  it('says when a book has no reviews', async () => {
    await open([]);
    expect(el.textContent).toContain('No reviews yet.');
  });

  it('shows a not-found message for an unknown book', async () => {
    await navigate();
    http.expectOne(BOOK_URL).flush({ error: 'Book not found' }, { status: 404, statusText: 'Not Found' });
    http.expectOne(REVIEWS_URL).flush({ error: 'Book not found' }, { status: 404, statusText: 'Not Found' });
    await settle();
    expect(el.textContent).toContain("We couldn't find that book.");
  });
});
