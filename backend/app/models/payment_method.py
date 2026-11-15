"""PaymentMethod model, matching the PaymentMethod class in the UML diagram.

NFR-01: never store full card numbers, only a payment token and the last 4 digits.
"""
from app.extensions import db
from app.services import payment_service


class PaymentMethod(db.Model):
    __tablename__ = "payment_method"

    payment_id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("customer.customer_id"), nullable=True)
    cardholder_name = db.Column(db.String(100), nullable=False)
    payment_token = db.Column(db.String(255), nullable=False)
    last4 = db.Column(db.String(4), nullable=False)

    def add_payment_method(self, cardholder_name, card_number):
        """FR-06: get a token from the payment service and save only the token and last 4 digits."""
        digits = card_number.replace(" ", "").replace("-", "")
        self.cardholder_name = cardholder_name.strip()
        self.payment_token = payment_service.get_token(digits)
        self.last4 = digits[-4:]
        # The full card number is not stored anywhere after this point

    def validate_card(self):
        """FR-06: confirm the card details are complete before checkout continues."""
        if not self.cardholder_name:
            return False, "Enter the name on the card."
        if not self.payment_token or not self.last4:
            return False, "Enter a valid card number."
        return True, ""

    def remove_payment_method(self):
        """Delete this saved payment method."""
        db.session.delete(self)
        db.session.commit()
