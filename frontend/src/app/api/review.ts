/**
 * A review as returned by GET /api/books/{isbn}/reviews, POST /api/books/{isbn}/reviews,
 * and PUT /api/reviews/{id}.
 *
 * This matches Review.to_dict() in backend/app/models/review.py (the API response),
 * not the database columns. If to_dict() changes, update this in the same PR.
 */
export interface Review {
  reviewId: number;
  isbn: string;
  /** Compare with AuthService.customer().customerId to tell if this is the user's own review. */
  customerId: number;
  reviewerName: string;
  /** Whole number from 1 to 5. */
  rating: number;
  reviewText: string;
  /** ISO date (YYYY-MM-DD) the review was written or last edited. */
  reviewDate: string | null;
}

/** Body for writing or editing a review. The backend checks the rules (1-5 stars, 1-1000 characters). */
export interface ReviewInput {
  rating: number;
  reviewText: string;
}

/** Longest review text the backend accepts. Used only for the character counter. */
export const MAX_REVIEW_LENGTH = 1000;
