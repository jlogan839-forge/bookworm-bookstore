import { CurrencyPipe, DatePipe, NgOptimizedImage } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map, Observable } from 'rxjs';

import { MAX_REVIEW_LENGTH, Review } from '../../api/review';
import { StarRating } from '../../components/star-rating/star-rating';
import { AuthService } from '../../services/auth.service';
import { BookService } from '../../services/book.service';
import { ReviewService } from '../../services/review.service';

/** Rejects text that is only spaces. The backend trims and checks this too. */
function notBlank(control: AbstractControl<string>): ValidationErrors | null {
  return control.value.trim() ? null : { blank: true };
}

/**
 * One book's details and its reviews (FR-12).
 * Logged-in customers can write one review per book, and edit or delete their own.
 * The backend enforces all of these rules; this page only hides buttons that wouldn't work.
 */
@Component({
  selector: 'app-book-detail',
  imports: [CurrencyPipe, DatePipe, NgOptimizedImage, ReactiveFormsModule, RouterLink, StarRating],
  templateUrl: './book-detail.html',
  styleUrl: './book-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookDetail {
  private readonly bookService = inject(BookService);
  private readonly reviewService = inject(ReviewService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly title = inject(Title);
  private readonly injector = inject(Injector);

  protected readonly isbn = toSignal(this.route.paramMap.pipe(map((p) => p.get('isbn') ?? '')), {
    requireSync: true,
  });

  protected readonly book = rxResource({
    params: () => this.isbn(),
    stream: ({ params }) => this.bookService.getBook(params),
  });

  protected readonly reviews = rxResource({
    params: () => this.isbn(),
    stream: ({ params }) => this.reviewService.getReviews(params),
  });

  protected readonly bookNotFound = computed(() => {
    const error = this.book.error();
    return error instanceof HttpErrorResponse && error.status === 404;
  });

  protected readonly isLoggedIn = this.auth.isLoggedIn;
  protected readonly reviewList = computed<Review[]>(() =>
    this.reviews.hasValue() ? this.reviews.value() : [],
  );
  /** The logged-in customer's review of this book, if they've written one. */
  protected readonly myReview = computed(() => {
    const me = this.auth.customer()?.customerId;
    return me === undefined ? undefined : this.reviewList().find((r) => r.customerId === me);
  });

  /** True while the customer is changing their existing review. */
  protected readonly editing = signal(false);
  protected readonly confirmingDelete = signal(false);
  protected readonly saving = signal(false);
  protected readonly showForm = computed(
    () => this.isLoggedIn() && (!this.myReview() || this.editing()),
  );

  /** Error shown above the form or delete button. */
  protected readonly formError = signal('');
  /** Announced to screen readers after a review is posted, updated, or deleted. */
  protected readonly status = signal('');

  protected readonly maxLength = MAX_REVIEW_LENGTH;
  protected readonly stars = [1, 2, 3, 4, 5];
  protected readonly form = inject(FormBuilder).nonNullable.group({
    rating: [0, [Validators.min(1), Validators.max(5)]],
    reviewText: ['', [Validators.required, Validators.maxLength(MAX_REVIEW_LENGTH), notBlank]],
  });
  private readonly formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });
  protected readonly selectedRating = computed(() => this.formValue().rating ?? 0);
  protected readonly textLength = computed(() => (this.formValue().reviewText ?? '').length);

  private readonly formHeading = viewChild<ElementRef<HTMLElement>>('formHeading');
  private readonly reviewsHeading = viewChild<ElementRef<HTMLElement>>('reviewsHeading');

  constructor() {
    effect(() => {
      if (this.book.hasValue()) this.title.setTitle(`${this.book.value().title} | Bookworm`);
    });
  }

  protected startEdit(review: Review): void {
    this.form.setValue({ rating: review.rating, reviewText: review.reviewText });
    this.formError.set('');
    this.status.set('');
    this.confirmingDelete.set(false);
    this.editing.set(true);
    this.focusAfterRender(this.formHeading);
  }

  protected cancelEdit(): void {
    this.editing.set(false);
    this.resetForm();
  }

  protected submit(): void {
    const error = this.validationMessage();
    if (error) {
      this.form.markAllAsTouched();
      this.formError.set(error);
      return;
    }

    const input = this.form.getRawValue();
    const existing = this.myReview();
    const request: Observable<Review> =
      this.editing() && existing
        ? this.reviewService.editReview(existing.reviewId, input)
        : this.reviewService.submitReview(this.isbn(), input);
    const message = this.editing() ? 'Your review was updated.' : 'Your review was posted.';

    this.saving.set(true);
    this.formError.set('');
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.editing.set(false);
        this.resetForm();
        this.status.set(message);
        this.refresh();
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.formError.set(this.errorMessage(err));
      },
    });
  }

  protected deleteMyReview(): void {
    const review = this.myReview();
    if (!review) return;
    this.saving.set(true);
    this.formError.set('');
    this.reviewService.deleteReview(review.reviewId).subscribe({
      next: () => {
        this.saving.set(false);
        this.confirmingDelete.set(false);
        this.status.set('Your review was deleted.');
        this.refresh();
        // The Delete button is gone, so move focus somewhere sensible
        this.focusAfterRender(this.reviewsHeading);
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.formError.set(this.errorMessage(err));
      },
    });
  }

  /** Reload reviews and the book, so the average rating updates too. */
  private refresh(): void {
    this.reviews.reload();
    this.book.reload();
  }

  private resetForm(): void {
    this.form.reset();
    this.formError.set('');
  }

  private validationMessage(): string {
    const { rating, reviewText } = this.form.controls;
    if (rating.invalid) return 'Choose a rating from 1 to 5 stars.';
    if (reviewText.hasError('maxlength')) {
      return `Keep your review to ${MAX_REVIEW_LENGTH} characters or fewer.`;
    }
    if (reviewText.invalid) return 'Write a short review.';
    return '';
  }

  private errorMessage(err: HttpErrorResponse): string {
    if (err.status === 401) return 'Your login has expired. Log in again to continue.';
    return err.error?.error ?? 'Something went wrong. Try again.';
  }

  private focusAfterRender(target: () => ElementRef<HTMLElement> | undefined): void {
    afterNextRender(() => target()?.nativeElement.focus(), { injector: this.injector });
  }
}
