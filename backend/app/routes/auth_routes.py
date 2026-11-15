"""Account endpoints.

POST /api/auth/register   create an account, returns a login token
POST /api/auth/login      log in, returns a login token
GET  /api/auth/me         the logged-in customer's profile (needs the token)
"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required

from app.services import auth_service
from app.services.auth_service import AuthError

auth_bp = Blueprint("auth", __name__)

def _token_response(customer, status=200):
    token = create_access_token(identity=str(customer.customer_id))
    return jsonify({"token": token, "customer": auth_service.profile(customer)}), status

@auth_bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    try:
        customer = auth_service.register_customer(
            data.get("name"), data.get("email"), data.get("password"), data.get("phone")
        )
    except AuthError as e:
        return jsonify({"error": str(e)}), 400
    return _token_response(customer, 201)

@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    try:
        customer = auth_service.authenticate(data.get("email"), data.get("password"))
    except AuthError as e:
        return jsonify({"error": str(e)}), 401
    return _token_response(customer)

@auth_bp.get("/me")
@jwt_required()
def me():
    customer = auth_service.get_customer(int(get_jwt_identity()))
    if customer is None:
        return jsonify({"error": "Account not found"}), 404
    return jsonify(auth_service.profile(customer))
