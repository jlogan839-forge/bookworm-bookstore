"""Creates and configures the Flask app (application factory pattern)."""
import os

from flask import Flask
from flask_cors import CORS

from app.extensions import db


def create_app():
    app = Flask(__name__)

    # SQLite database file stored in backend/instance/bookworm.db
    os.makedirs(app.instance_path, exist_ok=True)
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + os.path.join(
        app.instance_path, "bookworm.db"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)

    # Let the Angular dev server (localhost:4200) call this API
    CORS(app, origins=["http://localhost:4200"])

    # Routes layer
    from app.routes.book_routes import books_bp
    app.register_blueprint(books_bp, url_prefix="/api/books")

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    # Create tables and add sample books the first time the app runs
    with app.app_context():
        from app import models  # noqa: F401  (registers the models)
        from app.seed import seed_books
        db.create_all()
        seed_books()

    return app
