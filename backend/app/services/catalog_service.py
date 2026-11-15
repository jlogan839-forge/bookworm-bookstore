"""Catalog business logic, matching the Catalog class in the UML diagram.

Routes call these functions; these functions use the models.
Routes should never query the database directly.
"""
from sqlalchemy import func

from app.extensions import db
from app.models import Book

DEFAULT_PER_PAGE = 24  # fills the catalog's 4-column grid evenly
MAX_PER_PAGE = 100


def get_book(isbn):
    return Book.query.get(isbn)


def _escape_like(text):
    """Make % and _ in user input match literally instead of acting as wildcards."""
    return text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def find_books(query=None, genre=None, page=1, per_page=DEFAULT_PER_PAGE):
    """FR-01 search and FR-02 browse by genre, together, one page at a time.

    - query: matches ISBN, title, or author (case-insensitive, partial)
    - genre: exact genre name (case-insensitive)
    Either, both, or neither can be given. Returns a Flask-SQLAlchemy Pagination;
    a page past the end has no items rather than raising an error.
    """
    books = Book.query
    if query:
        pattern = f"%{_escape_like(query)}%"
        books = books.filter(
            Book.isbn.ilike(pattern, escape="\\")
            | Book.title.ilike(pattern, escape="\\")
            | Book.author.ilike(pattern, escape="\\")
        )
    if genre:
        books = books.filter(func.lower(Book.genre) == genre.lower())

    return books.order_by(Book.title, Book.isbn).paginate(
        page=page, per_page=per_page, max_per_page=MAX_PER_PAGE, error_out=False
    )


def get_genres():
    """Every genre in the catalog with how many books it has, sorted by name."""
    rows = (
        db.session.query(Book.genre, func.count(Book.isbn))
        .group_by(Book.genre)
        .order_by(Book.genre)
        .all()
    )
    return [{"genre": genre, "count": count} for genre, count in rows]


def filter_by_top_rated():
    """FR-14: placeholder until the Review model exists."""
    raise NotImplementedError("Add once the Review model is built")
