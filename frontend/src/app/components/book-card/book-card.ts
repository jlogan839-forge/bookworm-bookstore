import { CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Book } from '../../api/book';

/** One book in a grid: cover, title, author, price, stock, and an add-to-cart button. */
@Component({
  selector: 'app-book-card',
  imports: [CurrencyPipe, NgOptimizedImage, RouterLink],
  templateUrl: './book-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookCard {
  readonly book = input.required<Book>();
  readonly addToCart = output<Book>();

  /** True if the cover image failed to load, so we show the placeholder instead. */
  protected readonly coverFailed = signal(false);
}
