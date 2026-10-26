"""Book endpoints.

GET /api/books               all books
GET /api/books?q=tolkien     search by ISBN, title, or author
GET /api/books?genre=Fantasy browse by genre
GET /api/books/<isbn>        one book's details
"""
from flask import Blueprint, jsonify, request

from app.services import catalog_service

books_bp = Blueprint("books", __name__)


@books_bp.get("")
def list_books():
    query = request.args.get("q")
    genre = request.args.get("genre")

    if query:
        books = catalog_service.search_books(query)
    elif genre:
        books = catalog_service.browse_by_genre(genre)
    else:
        books = catalog_service.get_all_books()

    return jsonify([book.get_details() for book in books])


@books_bp.get("/<isbn>")
def get_book(isbn):
    book = catalog_service.get_book(isbn)
    if book is None:
        return jsonify({"error": "Book not found"}), 404
    return jsonify(book.get_details())
