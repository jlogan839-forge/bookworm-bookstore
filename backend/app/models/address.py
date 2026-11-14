"""Address model, matching the Address class in the UML diagram."""
import re

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
        if street:
            self.street = street.strip()
        if city:
            self.city = city.strip()
        if state:
            self.state = state.strip()
        if zip:
            self.zip = zip.strip()

    def validate_address(self):
        """Return (True, "") if every field is filled in and the ZIP is valid."""
        if not all([self.street, self.city, self.state, self.zip]):
            return False, "Please provide your full shipping address."
        if not re.fullmatch(r"\d{5}(-\d{4})?", self.zip.strip()):
            return False, "Enter a 5-digit ZIP code."
        return True, ""
