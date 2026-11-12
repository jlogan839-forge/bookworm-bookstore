import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource, takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';

import { Book } from '../../api/book';
import { BookCard } from '../../components/book-card/book-card';
import { BookService } from '../../services/book.service';

/**
 * FR-01 (search) and FR-02 (browse by genre).
 * Search and genre live in the URL (?q=...&genre=...) so results can be linked and the
 * back button works.
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

  private readonly queryParams = toSignal(this.route.queryParamMap, { requireSync: true });
  protected readonly q = computed(() => this.queryParams().get('q')?.trim() ?? '');
  protected readonly genre = computed(() => this.queryParams().get('genre') ?? '');
  protected readonly hasFilters = computed(() => !!this.q() || !!this.genre());

  protected readonly searchControl = new FormControl(this.q(), { nonNullable: true });

  protected readonly books = rxResource({
    params: () => ({ q: this.q(), genre: this.genre() }),
    stream: ({ params }) => this.bookService.getBooks(params),
  });

  // TODO: replace with a GET /api/books/genres endpoint once the backend has one.
  private readonly genres = rxResource({
    stream: () =>
      this.bookService.getBooks().pipe(map((books) => [...new Set(books.map((b) => b.genre))].sort())),
  });
  protected readonly genreOptions = computed(() =>
    this.genres.hasValue() ? this.genres.value() : [],
  );

  protected readonly visibleBooks = computed<Book[]>(() => {
    if (!this.books.hasValue()) return [];
    const books = this.books.value();
    // TODO: temporary. The backend ignores ?genre= when ?q= is also sent, so we narrow the
    // search results here. Remove once catalog_service supports both filters together.
    const genre = this.genre().toLowerCase();
    return this.q() && genre ? books.filter((b) => b.genre.toLowerCase() === genre) : books;
  });

  /** Announced to screen readers whenever the results change. */
  protected readonly resultsSummary = computed(() => {
    if (this.books.isLoading()) return 'Loading books…';
    if (this.books.error()) return '';
    const count = this.visibleBooks().length;
    let text = `${count} ${count === 1 ? 'book' : 'books'}`;
    if (this.q()) text += ` matching “${this.q()}”`;
    if (this.genre()) text += ` in ${this.genre()}`;
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

  protected onAddToCart(book: Book): void {
    this.cartMessage.set(`“${book.title}” can't be added yet. The cart isn't built.`);
  }

  private setQuery(changes: { q?: string; genre?: string }, replaceUrl = false): void {
    const current = { q: this.q(), genre: this.genre() };
    const next = { ...current, ...changes };
    if (next.q === current.q && next.genre === current.genre) return;

    this.router.navigate([], {
      relativeTo: this.route,
      // Empty values are removed from the URL
      queryParams: { q: next.q || null, genre: next.genre || null },
      queryParamsHandling: 'merge',
      replaceUrl,
    });
  }
}
