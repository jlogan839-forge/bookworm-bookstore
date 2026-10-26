"""Data access layer: one file per class from the UML diagram.

Every model must be imported here so Flask creates its table.
"""
from app.models.book import Book  # noqa: F401
from app.models.customer import Customer  # noqa: F401
from app.models.address import Address  # noqa: F401
from app.models.payment_method import PaymentMethod  # noqa: F401
from app.models.cart_item import CartItem  # noqa: F401
from app.models.order import Order  # noqa: F401
from app.models.order_item import OrderItem  # noqa: F401
from app.models.review import Review  # noqa: F401
from app.models.reading_list import ReadingList  # noqa: F401
from app.models.reading_list_item import ReadingListItem  # noqa: F401
