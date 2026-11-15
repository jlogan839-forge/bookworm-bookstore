import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Read-only star rating, e.g. ★★★★☆ 4.2 (13 reviews).
 * The stars are hidden from screen readers, which hear the same information as text instead.
 */
@Component({
  selector: 'app-star-rating',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (rating() !== null) {
      <span class="inline-flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
        <span class="relative inline-block text-base leading-none text-gray-300 dark:text-gray-600" aria-hidden="true">
          ★★★★★
          <span
            class="absolute inset-0 overflow-hidden whitespace-nowrap text-amber-600 dark:text-amber-400"
            [style.width.%]="percent()"
          >★★★★★</span>
        </span>
        <span aria-hidden="true">{{ visibleText() }}</span>
        <span class="sr-only">{{ label() }}</span>
      </span>
    } @else {
      <span class="text-sm text-gray-600 dark:text-gray-400">No reviews yet</span>
    }
  `,
})
export class StarRating {
  /** 1-5, or null when there are no reviews. */
  readonly rating = input.required<number | null>();
  /** Number of reviews. Leave out to show a single review's rating. */
  readonly count = input<number | null>(null);

  protected readonly percent = computed(() => ((this.rating() ?? 0) / 5) * 100);

  private readonly countText = computed(() => {
    const count = this.count();
    return count === null ? '' : `${count} ${count === 1 ? 'review' : 'reviews'}`;
  });

  protected readonly visibleText = computed(() => {
    const rating = this.rating()!.toFixed(1);
    return this.countText() ? `${rating} (${this.countText()})` : rating;
  });

  protected readonly label = computed(() => {
    const text = `Rated ${this.rating()!.toFixed(1)} out of 5`;
    return this.countText() ? `${text} from ${this.countText()}` : text;
  });
}
