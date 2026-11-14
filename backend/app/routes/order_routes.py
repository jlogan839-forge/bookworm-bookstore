"""Order endpoints.

POST /api/orders          place an order (guest checkout)
GET  /api/orders/<id>     one order's details
"""
from flask import Blueprint, jsonify, request

from app.services import checkout_service
from app.services.checkout_service import CheckoutError

orders_bp = Blueprint("orders", __name__)


@orders_bp.post("")
def place_order():
    data = request.get_json(silent=True) or {}
    try:
        confirmation = checkout_service.place_order(data)
    except CheckoutError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    return jsonify(confirmation), 201


@orders_bp.get("/<int:order_id>")
def get_order(order_id):
    order = checkout_service.get_order(order_id)
    if order is None:
        return jsonify({"error": "Order not found"}), 404
    return jsonify(checkout_service.order_details(order))
