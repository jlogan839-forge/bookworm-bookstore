"""Account business logic: sign up and log in (FR-09, NFR-04)."""
from app.extensions import db
from app.models import Customer


class AuthError(Exception):
    """Raised when sign-up or login fails. The message is for users."""
def register_customer(name, email, password, phone=None):
    if not name or not email or not password:
        raise AuthError("Name, email, and password are required.")
    if "@" not in email:
        raise AuthError("Enter a valid email address.")
    if len(password) < 8:
        raise AuthError("Password must be at least 8 characters.")
    if Customer.query.filter_by(email=email.strip().lower()).first():
        raise AuthError("Enter a different email. An account with this email already exists.")

    customer = Customer()
    customer.register(name, email, password, phone)
    db.session.add(customer)
    db.session.commit()
    return customer

def authenticate(email, password):
    customer = Customer.query.filter_by(email=(email or "").strip().lower()).first()
    if customer is None or not customer.login(email, password or ""):
        raise AuthError("Email or password is incorrect.")
    return customer
def get_customer(customer_id):
    return db.session.get(Customer, customer_id)


def profile(customer):
    """What the frontend is allowed to see. Never includes the password hash."""
    return {
        "customerId": customer.customer_id,
        "name": customer.name,
        "email": customer.email,
        "phone": customer.phone,
    }

