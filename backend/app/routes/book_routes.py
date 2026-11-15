"""Book endpoints.

GET  /api/books                       first page of all books
GET  /api/books?q=tolkien             search by ISBN, title, or author
GET  /api/books?genre=Fantasy         browse by genre
GET  /api/books?q=ring&genre=Fantasy  both filters together
GET  /api/books?page=2&per_page=24    any of the above, one page at a time
GET  /api/books/genres                every genre with its book count
GET  /api/books/<isbn>                one book's details
GET  /api/books/<isbn>/reviews        the book's reviews, newest first
POST /api/books/<isbn>/reviews        write a review (needs the login token)
"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.services import catalog_service, review_service
from app.services.review_service import ReviewError, ReviewNotFound

books_bp = Blueprint("books", __name__)


def _positive_int(name, default):
    """Read a whole-number query parameter. Missing, invalid, or < 1 means the default."""
    value = request.args.get(name, type=int)
    return value if value is not None and value >= 1 else default


@books_bp.get("")
def list_books():
    page = catalog_service.find_books(
        query=request.args.get("q", "").strip(),
        genre=request.args.get("genre", "").strip(),
        page=_positive_int("page", 1),
        per_page=_positive_int("per_page", catalog_service.DEFAULT_PER_PAGE),
    )
    ratings = review_service.rating_summaries([book.isbn for book in page.items])
    return jsonify({
        "items": [book.get_details(ratings.get(book.isbn)) for book in page.items],
        "total": page.total,
        "page": page.page,
        "perPage": page.per_page,
        "totalPages": page.pages,
    })


# Registered before /<isbn> so "genres" is never treated as an ISBN
@books_bp.get("/genres")
def list_genres():
    return jsonify(catalog_service.get_genres())


@books_bp.get("/<isbn>")
def get_book(isbn):
    book = catalog_service.get_book(isbn)
    if book is None:
        return jsonify({"error": "Book not found"}), 404
    rating = review_service.rating_summaries([isbn]).get(isbn)
    return jsonify(book.get_details(rating))


@books_bp.get("/<isbn>/reviews")
def list_reviews(isbn):
    if catalog_service.get_book(isbn) is None:
        return jsonify({"error": "Book not found"}), 404
    return jsonify([review.to_dict() for review in review_service.list_reviews(isbn)])


@books_bp.post("/<isbn>/reviews")
@jwt_required()
def submit_review(isbn):
    data = request.get_json(silent=True) or {}
    try:
        review = review_service.submit_review(
            int(get_jwt_identity()), isbn, data.get("rating"), data.get("reviewText")
        )
    except ReviewNotFound as e:
        return jsonify({"error": str(e)}), 404
    except ReviewError as e:
        return jsonify({"error": str(e)}), 400
    return jsonify(review.to_dict()), 201
