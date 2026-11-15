"""Review business logic (FR-12): list, write, edit, and delete reviews.

Anyone can read reviews. Only logged-in customers can write one, and only the
customer who wrote a review can edit or delete it. Routes pass the customer ID
from the login token, never from the request body.
"""
from sqlalchemy import func

from app.extensions import db
from app.models import Book, Review
from app.models.review import ReviewError  # noqa: F401  (re-exported for routes)


class ReviewNotFound(Exception):
    """The review or book doesn't exist."""


class ReviewPermissionError(Exception):
    """The customer is trying to change someone else's review."""


def list_reviews(isbn):
    """Reviews for one book, newest first."""
    return (
        Review.query.filter_by(isbn=isbn)
        .order_by(Review.review_date.desc(), Review.review_id.desc())
        .all()
    )


def submit_review(customer_id, isbn, rating, review_text):
    if db.session.get(Book, isbn) is None:
        raise ReviewNotFound("Book not found")
    if Review.query.filter_by(customer_id=customer_id, isbn=isbn).first():
        raise ReviewError("You've already reviewed this book. Edit your review instead.")

    review = Review(customer_id=customer_id, isbn=isbn, rating=rating, review_text=review_text)
    review.submit_review()
    db.session.commit()
    return review


def edit_review(customer_id, review_id, rating=None, review_text=None):
    review = _own_review(customer_id, review_id)
    review.edit_review(rating=rating, review_text=review_text)
    db.session.commit()
    return review


def delete_review(customer_id, review_id):
    review = _own_review(customer_id, review_id)
    review.delete_review()
    db.session.commit()


def _own_review(customer_id, review_id):
    review = db.session.get(Review, review_id)
    if review is None:
        raise ReviewNotFound("Review not found")
    if review.customer_id != customer_id:
        raise ReviewPermissionError("You can only change your own reviews.")
    return review


def rating_summaries(isbns):
    """Average rating and review count for each ISBN, in one query.

    Returns {isbn: (average, count)}. Books with no reviews are left out.
    """
    if not isbns:
        return {}
    rows = (
        db.session.query(Review.isbn, func.avg(Review.rating), func.count(Review.review_id))
        .filter(Review.isbn.in_(isbns))
        .group_by(Review.isbn)
        .all()
    )
    return {isbn: (float(average), count) for isbn, average, count in rows}
