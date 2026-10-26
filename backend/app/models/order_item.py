"""OrderItem model, matching the OrderItem class in the UML diagram."""
from app.extensions import db


class OrderItem(db.Model):
    __tablename__ = "order_item"

    order_id = db.Column(db.Integer, db.ForeignKey("order.order_id"), primary_key=True)
    isbn = db.Column(db.String(13), db.ForeignKey("book.isbn"), primary_key=True)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Float, nullable=False)

    def get_subtotal(self):
        """Return quantity times unit price."""
        pass
