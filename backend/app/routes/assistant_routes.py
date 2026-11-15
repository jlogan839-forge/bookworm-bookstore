"""AI reading assistant endpoint.

POST /api/assistant   ask for book recommendations
"""
from flask import Blueprint, jsonify, request

from app.services import ai_assistant_service
from app.services.ai_assistant_service import AssistantError

assistant_bp = Blueprint("assistant", __name__)


@assistant_bp.post("")
def ask():
    data = request.get_json(silent=True) or {}
    try:
        answer = ai_assistant_service.recommend_books(data.get("message"))
    except AssistantError as e:
        return jsonify({"error": str(e)}), 400
    return jsonify(answer)