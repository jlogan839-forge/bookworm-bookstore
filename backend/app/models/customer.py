"""Customer model, matching the Customer class in the UML diagram."""
from app.extensions import db


class Customer(db.Model):
    __tablename__ = "customer"

    customer_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(20))

    def register(self, name, email, password, phone=None):
        """FR-09: create an account and store the password as a hash (NFR-04)."""
        pass

    def login(self, email, password):
        """FR-09: check the email and password against the stored hash."""
        pass

    def update_profile(self, name=None, email=None, phone=None):
        """FR-09: change the customer's profile details."""
        pass

    def add_to_cart(self, isbn, quantity=1):
        """FR-03: add a book to this customer's cart."""
        pass

    def place_order(self, address_id, payment_id):
        """FR-05/06: turn the cart into an order."""
        pass

    def write_review(self, isbn, rating, review_text):
        """FR-12: write a 1-5 star review for a book."""
        pass
