"""Simulated payment service. No real payments are processed (NFR-01, NFR-08)."""


def get_token(card_number):
    """Exchange a card number for a fake payment token. The card number is never saved."""
    pass


def charge(payment_token, amount):
    """Pretend to charge the card. Return success or failure."""
    pass
