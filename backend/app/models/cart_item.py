"""CartItem model, matching the CartItem class in the UML diagram."""
from app.extensions import db


class CartItem(db.Model):
    __tablename__ = "cart_item"

    customer_id = db.Column(db.Integer, db.ForeignKey("customer.customer_id"), primary_key=True)
    isbn = db.Column(db.String(13), db.ForeignKey("book.isbn"), primary_key=True)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    date_added = db.Column(db.Date)

    def update_quantity(self, new_quantity):
        """FR-08: change how many copies are in the cart."""
        pass

    def remove_item(self):
        """FR-08: remove this book from the cart."""
        pass
