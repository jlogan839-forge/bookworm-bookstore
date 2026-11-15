"""Checkout business logic (FR-05, FR-06, FR-07, NFR-08).

Based on the CheckoutService design: check the cart, calculate the total,
charge the payment, confirm the order. Also saves the order and lowers stock.
"""
from datetime import date

from app.extensions import db
from app.models import Address, Book, Order, OrderItem, PaymentMethod
from app.services import payment_service


class CheckoutError(Exception):
    """Raised when checkout can't continue. The message is safe to show users."""


def place_order(data, customer_id=None):
    """Turn the cart sent by the checkout page into a saved, paid order.

    data looks like:
    {
      "email": "...",
      "cardholderName": "...", "cardNumber": "...",
      "address": {"street": "...", "city": "...", "state": "...", "zip": "..."},
      "items": [{"isbn": "...", "quantity": 1}, ...]
    }
    """
    items = data.get("items") or []
    email = (data.get("email") or "").strip()
    address_data = data.get("address") or {}

    # 1. Check the cart and customer information
    if not items:
        raise CheckoutError("Your cart is empty.")
    if not email or "@" not in email:
        raise CheckoutError("Enter a valid email address.")

    address = Address(customer_id=customer_id)
    address.update_address(**{k: address_data.get(k) for k in ("street", "city", "state", "zip")})
    ok, message = address.validate_address()
    if not ok:
        raise CheckoutError(message)

    card_number = data.get("cardNumber") or ""
    ok, message = payment_service.validate_card_number(card_number)
    if not ok:
        raise CheckoutError(message)
    payment = PaymentMethod(customer_id=customer_id)
    payment.add_payment_method(data.get("cardholderName") or "", card_number)
    ok, message = payment.validate_card()
    if not ok:
        raise CheckoutError(message)

    # 2. Make sure every book exists and is in stock (FR-07)
    order = Order(customer_id=customer_id, guest_email=email,
                  order_date=date.today(), status="Pending")
    books = []
    for line in items:
        book = db.session.get(Book, line.get("isbn"))
        quantity = int(line.get("quantity") or 0)
        if book is None:
            raise CheckoutError("A book in your cart is no longer available.")
        if quantity < 1:
            raise CheckoutError(f"Choose a quantity for {book.title}.")
        if book.stock_qty < quantity:
            raise CheckoutError(f"Only {book.stock_qty} copies of {book.title} are in stock.")
        order.items.append(OrderItem(isbn=book.isbn, quantity=quantity, unit_price=book.price))
        books.append((book, quantity))

    # 3. Calculate the total (subtotal + 6% tax)
    totals = order.calculate_total()

    # 4. Charge the payment. Stop here if it fails, so nothing is saved (NFR-08).
    result = payment_service.charge(payment.payment_token, totals["total"])
    if not result["success"]:
        raise CheckoutError(result["message"])

    # 5. Save everything in one step and lower stock
    db.session.add(address)
    db.session.add(payment)
    db.session.flush()  # gives address and payment their IDs
    order.address_id = address.address_id
    order.payment_id = payment.payment_id
    order.update_status("Paid")
    db.session.add(order)
    for book, quantity in books:
        book.update_stock(-quantity)
    db.session.commit()

    # 6. The checkout confirmation
    return {
        "success": True,
        "message": "Your order has been placed!",
        "orderId": order.order_id,
        **totals,
        "transaction": result["transaction"],
        "cardLast4": payment.last4,
    }


def get_order(order_id):
    return db.session.get(Order, order_id)


def order_details(order):
    """What the frontend is allowed to see about an order."""
    return {
        "orderId": order.order_id,
        "orderDate": order.order_date.isoformat() if order.order_date else None,
        "status": order.status,
        "total": order.total_amount,
        "items": [
            {"isbn": i.isbn, "quantity": i.quantity, "unitPrice": i.unit_price,
             "subtotal": i.get_subtotal()}
            for i in order.items
        ],
    }
