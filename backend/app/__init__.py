"""Creates and configures the Flask app (application factory pattern)."""
import os

from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager

from app.extensions import db


def create_app(test_config=None):
    """test_config overrides settings, e.g. an in-memory database for tests."""
    app = Flask(__name__)

    # SQLite database file stored in backend/instance/bookworm.db
    os.makedirs(app.instance_path, exist_ok=True)
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + os.path.join(
        app.instance_path, "bookworm.db"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SEED_BOOKS"] = True

    # Login tokens (FR-09). Set JWT_SECRET_KEY in backend/.env
    load_dotenv()
    app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "dev-only-change-me")

    if test_config:
        app.config.update(test_config)
    JWTManager(app)
    db.init_app(app)

    # The Angular dev server (localhost:4200) calls this API
    CORS(app, origins=["http://localhost:4200"])

    # Routes layer
    from app.routes.book_routes import books_bp
    app.register_blueprint(books_bp, url_prefix="/api/books")
    from app.routes.auth_routes import auth_bp
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    from app.routes.order_routes import orders_bp
    app.register_blueprint(orders_bp, url_prefix="/api/orders")
    from app.routes.review_routes import reviews_bp
    app.register_blueprint(reviews_bp, url_prefix="/api/reviews")
    from app.routes.assistant_routes import assistant_bp
    app.register_blueprint(assistant_bp, url_prefix="/api/assistant")

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    # Creates tables and adds sample books the first time the app runs
    with app.app_context():
        from app import models  # noqa: F401  (registers the models)
        from app.seed import seed_books
        db.create_all()
        if app.config["SEED_BOOKS"]:
            seed_books()

    return app
