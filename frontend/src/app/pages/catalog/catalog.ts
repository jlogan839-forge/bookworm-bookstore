import { ViewportScroller } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource, takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';

import { Book, BookPage } from '../../api/book';
import { BookCard } from '../../components/book-card/book-card';
import { BookService } from '../../services/book.service';

/**
 * FR-01 (search) and FR-02 (browse by genre), one page at a time.
 * Search, genre, and page live in the URL (?q=...&genre=...&page=...) so results can be
 * linked and the back button works.
 */
@Component({
  selector: 'app-catalog',
  imports: [BookCard, ReactiveFormsModule],
  templateUrl: './catalog.html',
  styleUrl: './catalog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Catalog {
  private readonly bookService = inject(BookService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly scroller = inject(ViewportScroller);

  private readonly queryParams = toSignal(this.route.queryParamMap, { requireSync: true });
  protected readonly q = computed(() => this.queryParams().get('q')?.trim() ?? '');
  protected readonly genre = computed(() => this.queryParams().get('genre') ?? '');
  /** Page number from the URL. Missing or invalid means page 1. */
  protected readonly page = computed(() => {
    const page = Number(this.queryParams().get('page'));
    return Number.isInteger(page) && page >= 1 ? page : 1;
  });
  protected readonly hasFilters = computed(() => !!this.q() || !!this.genre());

  protected readonly searchControl = new FormControl(this.q(), { nonNullable: true });

  protected readonly books = rxResource({
    params: () => ({ q: this.q(), genre: this.genre(), page: this.page() }),
    stream: ({ params }) => this.bookService.getBooks(params),
  });

  private readonly genres = rxResource({ stream: () => this.bookService.getGenres() });
  protected readonly genreOptions = computed(() =>
    this.genres.hasValue() ? this.genres.value() : [],
  );

  /** The loaded page of results, or null while loading or after an error. */
  private readonly result = computed<BookPage | null>(() =>
    this.books.hasValue() ? this.books.value() : null,
  );
  protected readonly visibleBooks = computed<Book[]>(() => this.result()?.items ?? []);
  protected readonly totalPages = computed(() => this.result()?.totalPages ?? 0);
  /** True when the URL asks for a page past the last one. */
  protected readonly pageOutOfRange = computed(() => {
    const result = this.result();
    return !!result && result.items.length === 0 && result.total > 0;
  });

  /** Announced to screen readers whenever the results change. */
  protected readonly resultsSummary = computed(() => {
    if (this.books.isLoading()) return 'Loading books…';
    const result = this.result();
    if (!result) return '';

    const { total, page, perPage, items } = result;
    let text = `${total.toLocaleString('en-US')} ${total === 1 ? 'book' : 'books'}`;
    if (this.q()) text += ` matching “${this.q()}”`;
    if (this.genre()) text += ` in ${this.genre()}`;
    if (result.totalPages > 1 && items.length) {
      const first = (page - 1) * perPage + 1;
      text = `Showing ${first}–${first + items.length - 1} of ${text}`;
    }
    return text;
  });

  /** Placeholder feedback until the cart is built. */
  protected readonly cartMessage = signal('');

  protected readonly skeletons = Array.from({ length: 8 }, (_, i) => i);

  constructor() {
    // Search as the user types, without adding a history entry per keystroke
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        map((value) => value.trim()),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe((value) => this.setQuery({ q: value }, true));

    // Keep the search box in sync when the URL changes (back button, "Clear filters")
    effect(() => {
      const q = this.q();
      if (this.searchControl.value.trim() !== q) {
        this.searchControl.setValue(q, { emitEvent: false });
      }
    });
  }

  protected search(event: Event): void {
    event.preventDefault();
    this.setQuery({ q: this.searchControl.value.trim() });
  }

  protected selectGenre(event: Event): void {
    this.setQuery({ genre: (event.target as HTMLSelectElement).value });
  }

  protected clearFilters(): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  /** Each page change is a history entry, so the back button returns to the previous page. */
  protected goToPage(page: number): void {
    if (page < 1 || page === this.page()) return;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: page > 1 ? page : null },
      queryParamsHandling: 'merge',
    });
    this.scroller.scrollToPosition([0, 0]);
  }

  protected onAddToCart(book: Book): void {
    this.cartMessage.set(`“${book.title}” can't be added yet. The cart isn't built.`);
  }

  /** Change the search or genre. Either change starts the results over at page 1. */
  private setQuery(changes: { q?: string; genre?: string }, replaceUrl = false): void {
    const current = { q: this.q(), genre: this.genre() };
    const next = { ...current, ...changes };
    if (next.q === current.q && next.genre === current.genre) return;

    this.router.navigate([], {
      relativeTo: this.route,
      // Empty values are removed from the URL
      queryParams: { q: next.q || null, genre: next.genre || null, page: null },
      queryParamsHandling: 'merge',
      replaceUrl,
    });
  }
}
