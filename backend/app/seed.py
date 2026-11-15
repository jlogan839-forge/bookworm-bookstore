"""Load the book catalog into the database the first time the app runs.

The books come from app/data/books.json, a snapshot of real books from the
Open Library API built by scripts/import_books.py. To reload the catalog,
delete backend/instance/bookworm.db and start the app again.
"""
import json
from pathlib import Path

from app.extensions import db
from app.models import Book

BOOKS_FILE = Path(__file__).resolve().parent / "data" / "books.json"

BOOK_FIELDS = (
    "isbn", "title", "author", "genre", "publication_year",
    "price", "stock_qty", "description", "cover_url",
)


def load_books(path=BOOKS_FILE):
    """Read the snapshot and return one dict per book, with only Book columns."""
    with open(path, encoding="utf-8") as f:
        snapshot = json.load(f)
    return [{field: book.get(field) for field in BOOK_FIELDS} for book in snapshot["books"]]


def seed_books():
    """Add the catalog only if the book table is empty."""
    if Book.query.first() is None:
        db.session.execute(db.insert(Book), load_books())
        db.session.commit()
