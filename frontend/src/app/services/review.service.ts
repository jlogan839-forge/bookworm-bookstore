import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../api/api.config';
import { Review, ReviewInput } from '../api/review';

/**
 * Talks to the review endpoints (FR-12). The login token is added by authInterceptor.
 * Rating rules, one-review-per-book, and who may edit or delete are enforced by the
 * backend (review_service.py); this service only sends requests.
 */
@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly http = inject(HttpClient);

  /** A book's reviews, newest first. */
  getReviews(isbn: string): Observable<Review[]> {
    return this.http.get<Review[]>(this.bookReviewsUrl(isbn));
  }

  submitReview(isbn: string, review: ReviewInput): Observable<Review> {
    return this.http.post<Review>(this.bookReviewsUrl(isbn), review);
  }

  editReview(reviewId: number, review: ReviewInput): Observable<Review> {
    return this.http.put<Review>(`${API_BASE_URL}/reviews/${reviewId}`, review);
  }

  deleteReview(reviewId: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/reviews/${reviewId}`);
  }

  private bookReviewsUrl(isbn: string): string {
    return `${API_BASE_URL}/books/${encodeURIComponent(isbn)}/reviews`;
  }
}
