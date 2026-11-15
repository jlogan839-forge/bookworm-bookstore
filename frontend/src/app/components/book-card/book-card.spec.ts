import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Book } from '../../api/book';
import { BookCard } from './book-card';

const BOOK: Book = {
  isbn: '9780441172719',
  title: 'Dune',
  author: 'Frank Herbert',
  genre: 'Science Fiction',
  publicationYear: 1965,
  price: 18.99,
  stockQty: 8,
  inStock: true,
  description: null,
  coverUrl: null,
};

describe('BookCard', () => {
  let fixture: ComponentFixture<BookCard>;
  let el: HTMLElement;

  async function render(book: Book) {
    fixture.componentRef.setInput('book', book);
    await fixture.whenStable();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookCard],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(BookCard);
    el = fixture.nativeElement;
  });

  it('shows the title, author, price, and links to the detail page', async () => {
    await render(BOOK);
    const link = el.querySelector('h2 a')!;
    expect(link.textContent).toContain('Dune');
    expect(link.getAttribute('href')).toBe('/books/9780441172719');
    expect(el.textContent).toContain('Frank Herbert');
    expect(el.textContent).toContain('$18.99');
    expect(el.textContent).toContain('In stock');
  });

  it('disables add to cart when out of stock', async () => {
    await render({ ...BOOK, stockQty: 0, inStock: false });
    expect(el.textContent).toContain('Out of stock');
    expect(el.querySelector('button')!.disabled).toBe(true);
  });

  it('emits the book when add to cart is clicked', async () => {
    await render(BOOK);
    const emitted: Book[] = [];
    fixture.componentInstance.addToCart.subscribe((b) => emitted.push(b));
    el.querySelector('button')!.click();
    expect(emitted).toEqual([BOOK]);
  });

  it('shows a placeholder when there is no cover', async () => {
    await render(BOOK);
    expect(el.querySelector('img')).toBeNull();
  });

  it('shows the cover image when there is one', async () => {
    await render({ ...BOOK, coverUrl: 'https://example.com/dune.jpg' });
    expect(el.querySelector('img')!.getAttribute('alt')).toBe('Cover of Dune');
  });
});
