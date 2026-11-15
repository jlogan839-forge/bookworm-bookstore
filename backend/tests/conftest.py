"""Shared test setup: a fresh in-memory database for every test."""
import pytest

from app import create_app
from app.extensions import db
from app.models import Book


@pytest.fixture
def app():
    app = create_app({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "SEED_BOOKS": False,
        "JWT_SECRET_KEY": "test-secret-key-at-least-32-bytes-long",
    })
    with app.app_context():
        db.session.add_all([
            Book(isbn="9780441172719", title="Dune", author="Frank Herbert",
                 genre="Science Fiction", price=18.99, stock_qty=8),
            Book(isbn="9780547928227", title="The Hobbit", author="J.R.R. Tolkien",
                 genre="Fantasy", price=14.99, stock_qty=3),
        ])
        db.session.commit()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def register(client):
    """Create an account and return headers carrying its login token."""
    def _register(name="Ada", email=None):
        email = email or f"{name.lower()}@example.com"
        res = client.post("/api/auth/register",
                          json={"name": name, "email": email, "password": "password123"})
        assert res.status_code == 201, res.get_json()
        return {"Authorization": f"Bearer {res.get_json()['token']}"}
    return _register
