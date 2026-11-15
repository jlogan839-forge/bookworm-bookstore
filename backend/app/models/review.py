"""Review model, matching the Review class in the UML diagram."""
from datetime import date

from app.extensions import db

MIN_RATING = 1
MAX_RATING = 5
MAX_TEXT_LENGTH = 1000


class ReviewError(Exception):
    """Raised when a review is invalid. The message is for users."""


class Review(db.Model):
    __tablename__ = "review"

    review_id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("customer.customer_id"), nullable=False)
    isbn = db.Column(db.String(13), db.ForeignKey("book.isbn"), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    review_text = db.Column(db.Text)
    review_date = db.Column(db.Date)

    customer = db.relationship("Customer")

    def submit_review(self):
        """FR-12: save a new review. Rating must be 1-5.

        Adds the review to the session; the caller commits.
        """
        self.rating = _valid_rating(self.rating)
        self.review_text = _valid_text(self.review_text)
        self.review_date = date.today()
        db.session.add(self)

    def edit_review(self, rating=None, review_text=None):
        """FR-12: change an existing review. Only the fields given are changed."""
        if rating is None and review_text is None:
            raise ReviewError("Change the rating or the review text.")
        # Validate both before changing either, so a bad value changes nothing
        new_rating = self.rating if rating is None else _valid_rating(rating)
        new_text = self.review_text if review_text is None else _valid_text(review_text)
        self.rating = new_rating
        self.review_text = new_text
        self.review_date = date.today()

    def delete_review(self):
        """FR-12: remove this review. The caller commits."""
        db.session.delete(self)

    def to_dict(self):
        """The review as JSON. Never includes the reviewer's email."""
        return {
            "reviewId": self.review_id,
            "isbn": self.isbn,
            "customerId": self.customer_id,
            "reviewerName": self.customer.name if self.customer else "Former customer",
            "rating": self.rating,
            "reviewText": self.review_text,
            "reviewDate": self.review_date.isoformat() if self.review_date else None,
        }


def _valid_rating(rating):
    # bool is a subclass of int, so reject it explicitly
    if isinstance(rating, bool) or not isinstance(rating, int):
        raise ReviewError(f"Choose a rating from {MIN_RATING} to {MAX_RATING} stars.")
    if not MIN_RATING <= rating <= MAX_RATING:
        raise ReviewError(f"Choose a rating from {MIN_RATING} to {MAX_RATING} stars.")
    return rating


def _valid_text(text):
    if not isinstance(text, str) or not text.strip():
        raise ReviewError("Write a short review.")
    text = text.strip()
    if len(text) > MAX_TEXT_LENGTH:
        raise ReviewError(f"Keep your review to {MAX_TEXT_LENGTH} characters or fewer.")
    return text
