"""Order model, matching the Order class in the UML diagram.

customer_id and payment_id can be empty so guests can check out (FR-05).
"""
from app.extensions import db


class Order(db.Model):
    __tablename__ = "order"

    order_id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("customer.customer_id"), nullable=True)
    address_id = db.Column(db.Integer, db.ForeignKey("address.address_id"), nullable=False)
    payment_id = db.Column(db.Integer, db.ForeignKey("payment_method.payment_id"), nullable=True)
    order_date = db.Column(db.Date)
    total_amount = db.Column(db.Float)
    status = db.Column(db.String(20), default="Pending")
    guest_email = db.Column(db.String(120))

    def calculate_total(self):
        """Add up the subtotals of all order items."""
        pass

    def update_status(self, new_status):
        """Change the order's status, such as Pending to Shipped."""
        pass

    def cancel_order(self):
        """Cancel the order if it hasn't shipped."""
        pass
