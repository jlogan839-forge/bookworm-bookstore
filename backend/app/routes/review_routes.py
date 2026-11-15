"""Review endpoints for changing an existing review (FR-12).

PUT    /api/reviews/<id>   edit your own review (needs the login token)
DELETE /api/reviews/<id>   delete your own review (needs the login token)

Listing and writing reviews are under /api/books/<isbn>/reviews in book_routes.py.
"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.services import review_service
from app.services.review_service import ReviewError, ReviewNotFound, ReviewPermissionError

reviews_bp = Blueprint("reviews", __name__)


@reviews_bp.put("/<int:review_id>")
@jwt_required()
def edit_review(review_id):
    data = request.get_json(silent=True) or {}
    try:
        review = review_service.edit_review(
            int(get_jwt_identity()),
            review_id,
            rating=data.get("rating"),
            review_text=data.get("reviewText"),
        )
    except ReviewNotFound as e:
        return jsonify({"error": str(e)}), 404
    except ReviewPermissionError as e:
        return jsonify({"error": str(e)}), 403
    except ReviewError as e:
        return jsonify({"error": str(e)}), 400
    return jsonify(review.to_dict())


@reviews_bp.delete("/<int:review_id>")
@jwt_required()
def delete_review(review_id):
    try:
        review_service.delete_review(int(get_jwt_identity()), review_id)
    except ReviewNotFound as e:
        return jsonify({"error": str(e)}), 404
    except ReviewPermissionError as e:
        return jsonify({"error": str(e)}), 403
    return "", 204
