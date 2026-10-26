"""PaymentMethod model, matching the PaymentMethod class in the UML diagram.

NFR-01: never store full card numbers, only a payment token and the last 4 digits.
"""
from app.extensions import db


class PaymentMethod(db.Model):
    __tablename__ = "payment_method"

    payment_id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("customer.customer_id"), nullable=True)
    cardholder_name = db.Column(db.String(100), nullable=False)
    payment_token = db.Column(db.String(255), nullable=False)
    last4 = db.Column(db.String(4), nullable=False)

    def add_payment_method(self, cardholder_name, card_number):
        """FR-06: get a token from the payment service and save only the token and last 4 digits."""
        pass

    def validate_card(self):
        """FR-06: confirm the card is valid before checkout continues."""
        pass

    def remove_payment_method(self):
        """Delete this saved payment method."""
        pass
