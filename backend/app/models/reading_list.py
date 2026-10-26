"""ReadingList model, matching the ReadingList class in the UML diagram."""
from app.extensions import db


class ReadingList(db.Model):
    __tablename__ = "reading_list"

    list_id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("customer.customer_id"), nullable=False)
    name = db.Column(db.String(100), nullable=False)

    def add_book(self, isbn):
        """FR-15: add a book to this list."""
        pass

    def remove_book(self, isbn):
        """FR-15: remove a book from this list."""
        pass

    def rename(self, new_name):
        """FR-15: change the list's name."""
        pass
