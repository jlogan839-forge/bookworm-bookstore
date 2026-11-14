"""Simulated payment service. No real payments are processed (NFR-01, NFR-08).

Based on the PaymentProcessor class from the original checkout design:
same validation rules, transaction IDs, and transaction record.
"""
import uuid
from datetime import datetime

SUPPORTED_METHODS = ["card"]

# Any card works except this test number, which is always declined,
# so the team can test the "payment failed" path.
DECLINED_TEST_CARD = "4000000000000002"


def validate_card_number(card_number):
    """Return (True, "") if the card number looks valid, otherwise (False, reason)."""
    digits = (card_number or "").replace(" ", "").replace("-", "")
    if not digits.isdigit() or not 13 <= len(digits) <= 19:
        return False, "Enter a valid card number."
    return True, ""


def get_token(card_number):
    """Exchange a card number for a fake payment token. The card number is never saved."""
    digits = card_number.replace(" ", "").replace("-", "")
    prefix = "tok_declined_" if digits == DECLINED_TEST_CARD else "tok_"
    return prefix + uuid.uuid4().hex[:12]


def validate_payment(amount, payment_method="card"):
    """Check the amount and payment method before charging."""
    if amount <= 0:
        return False, "Invalid payment amount."
    if payment_method.lower() not in SUPPORTED_METHODS:
        return False, "Unsupported payment method."
    return True, "Payment information validated."


def charge(payment_token, amount, payment_method="card"):
    """Pretend to charge the card. Return success or failure."""
    valid, message = validate_payment(amount, payment_method)
    if not valid:
        return {"success": False, "message": message}

    if payment_token.startswith("tok_declined_"):
        return {"success": False, "message": "Your card was declined."}

    transaction = {
        "transactionId": uuid.uuid4().hex[:8].upper(),
        "amount": round(amount, 2),
        "paymentMethod": payment_method.lower(),
        "status": "Successful",
        "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }
    return {"success": True, "message": "Payment successful!", "transaction": transaction}
