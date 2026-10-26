"""Book model, matching the Book class in the UML diagram."""
from app.extensions import db


class Book(db.Model):
    __tablename__ = "book"

    isbn = db.Column(db.String(13), primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    author = db.Column(db.String(200), nullable=False)
    genre = db.Column(db.String(50), nullable=False)
    publication_year = db.Column(db.Integer)
    price = db.Column(db.Float, nullable=False)
    stock_qty = db.Column(db.Integer, nullable=False, default=0)
    description = db.Column(db.Text)
    cover_url = db.Column(db.String(500))

    def get_details(self):
        """Return the book as a dictionary for JSON responses."""
        return {
            "isbn": self.isbn,
            "title": self.title,
            "author": self.author,
            "genre": self.genre,
            "publicationYear": self.publication_year,
            "price": self.price,
            "stockQty": self.stock_qty,
            "inStock": self.check_availability(),
            "description": self.description,
            "coverUrl": self.cover_url,
        }

    def check_availability(self):
        """FR-07: a book with zero stock is out of stock."""
        return self.stock_qty > 0

    def update_stock(self, change):
        """Add or subtract stock. Stock can't go below zero."""
        self.stock_qty = max(0, self.stock_qty + change)

    def update_price(self, new_price):
        if new_price < 0:
            raise ValueError("Price can't be negative")
        self.price = new_price
