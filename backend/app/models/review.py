"""Review model, matching the Review class in the UML diagram."""
from app.extensions import db


class Review(db.Model):
    __tablename__ = "review"

    review_id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("customer.customer_id"), nullable=False)
    isbn = db.Column(db.String(13), db.ForeignKey("book.isbn"), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    review_text = db.Column(db.Text)
    review_date = db.Column(db.Date)

    def submit_review(self):
        """FR-12: save a new review. Rating must be 1-5."""
        pass

    def edit_review(self, rating=None, review_text=None):
        """FR-12: change an existing review."""
        pass

    def delete_review(self):
        """FR-12: remove this review."""
        pass
