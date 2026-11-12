"""Creates and configures the Flask app (application factory pattern)."""
import os

from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager

from app.extensions import db


def create_app():
    app = Flask(__name__)

    # SQLite database file stored in backend/instance/bookworm.db
    os.makedirs(app.instance_path, exist_ok=True)
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + os.path.join(
        app.instance_path, "bookworm.db"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # Login tokens (FR-09). Set JWT_SECRET_KEY in backend/.env
    load_dotenv()
    app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "dev-only-change-me")
    JWTManager(app)
    db.init_app(app)

    # The Angular dev server (localhost:4200) calls this API
    CORS(app, origins=["http://localhost:4200"])

    # Routes layer
    from app.routes.book_routes import books_bp
    app.register_blueprint(books_bp, url_prefix="/api/books")
    from app.routes.auth_routes import auth_bp
    app.register_blueprint(auth_bp, url_prefix="/api/auth")

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    # Creates tables and adds sample books the first time the app runs
    with app.app_context():
        from app import models  # noqa: F401  (registers the models)
        from app.seed import seed_books
        db.create_all()
        seed_books()

    return app
