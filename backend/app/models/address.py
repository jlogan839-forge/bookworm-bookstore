"""Address model, matching the Address class in the UML diagram."""
from app.extensions import db


class Address(db.Model):
    __tablename__ = "address"

    address_id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("customer.customer_id"), nullable=True)
    street = db.Column(db.String(200), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    state = db.Column(db.String(50), nullable=False)
    zip = db.Column(db.String(10), nullable=False)

    def update_address(self, street=None, city=None, state=None, zip=None):
        """Change any part of the address."""
        pass

    def validate_address(self):
        """Check that all fields are filled in and the ZIP code is valid."""
        pass
