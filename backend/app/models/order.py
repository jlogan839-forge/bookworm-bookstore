"""Order model, matching the Order class in the UML diagram.

customer_id and payment_id can be empty so guests can check out (FR-05).
"""
from app.extensions import db

TAX_RATE = 0.06  # 6% sales tax
STATUSES = ["Pending", "Paid", "Shipped", "Delivered", "Cancelled"]


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

    items = db.relationship("OrderItem", backref="order", lazy=True)

    def calculate_total(self):
        """Add up the subtotals of all order items, plus sales tax."""
        subtotal = sum(item.get_subtotal() for item in self.items)
        tax = round(subtotal * TAX_RATE, 2)
        self.total_amount = round(subtotal + tax, 2)
        return {"subtotal": round(subtotal, 2), "tax": tax, "total": self.total_amount}

    def update_status(self, new_status):
        """Change the order's status, such as Pending to Shipped."""
        if new_status not in STATUSES:
            raise ValueError(f"Unknown status: {new_status}")
        self.status = new_status

    def cancel_order(self):
        """Cancel the order if it hasn't shipped. Returns True if cancelled."""
        if self.status in ("Shipped", "Delivered", "Cancelled"):
            return False
        self.status = "Cancelled"
        return True
