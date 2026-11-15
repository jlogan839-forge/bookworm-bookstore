import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../api/api.config';
import { Review } from '../api/review';
import { ReviewService } from './review.service';

const REVIEW: Review = {
  reviewId: 7,
  isbn: '9780441172719',
  customerId: 1,
  reviewerName: 'Ada',
  rating: 5,
  reviewText: 'Loved it.',
  reviewDate: '2026-11-15',
};

describe('ReviewService', () => {
  let service: ReviewService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReviewService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it("requests a book's reviews", () => {
    let reviews: Review[] = [];
    service.getReviews('9780441172719').subscribe((value) => (reviews = value));
    const req = http.expectOne(`${API_BASE_URL}/books/9780441172719/reviews`);
    expect(req.request.method).toBe('GET');
    req.flush([REVIEW]);
    expect(reviews).toEqual([REVIEW]);
  });

  it('posts a new review for a book', () => {
    service.submitReview('9780441172719', { rating: 5, reviewText: 'Loved it.' }).subscribe();
    const req = http.expectOne(`${API_BASE_URL}/books/9780441172719/reviews`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ rating: 5, reviewText: 'Loved it.' });
    req.flush(REVIEW);
  });

  it('puts an edited review by id', () => {
    service.editReview(7, { rating: 3, reviewText: 'Changed my mind.' }).subscribe();
    const req = http.expectOne(`${API_BASE_URL}/reviews/7`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ rating: 3, reviewText: 'Changed my mind.' });
    req.flush({ ...REVIEW, rating: 3 });
  });

  it('deletes a review by id', () => {
    service.deleteReview(7).subscribe();
    const req = http.expectOne(`${API_BASE_URL}/reviews/7`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });
});
