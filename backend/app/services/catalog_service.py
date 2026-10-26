"""Catalog business logic, matching the Catalog class in the UML diagram.

Routes call these functions; these functions use the models.
Routes should never query the database directly.
"""
from app.models import Book


def get_all_books():
    return Book.query.order_by(Book.title).all()


def get_book(isbn):
    return Book.query.get(isbn)


def search_books(query):
    """FR-01: search by ISBN, title, or author (case-insensitive)."""
    pattern = f"%{query}%"
    return (
        Book.query.filter(
            Book.isbn.ilike(pattern)
            | Book.title.ilike(pattern)
            | Book.author.ilike(pattern)
        )
        .order_by(Book.title)
        .all()
    )


def browse_by_genre(genre):
    """FR-02: browse books in one genre."""
    return Book.query.filter(Book.genre.ilike(genre)).order_by(Book.title).all()


def filter_by_top_rated():
    """FR-14: placeholder until the Review model exists."""
    raise NotImplementedError("Add once the Review model is built")
