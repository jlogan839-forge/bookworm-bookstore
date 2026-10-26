"""Sample books so the catalog isn't empty during development."""
from app.extensions import db
from app.models import Book

SAMPLE_BOOKS = [
    Book(isbn="9780547928227", title="The Hobbit", author="J.R.R. Tolkien",
         genre="Fantasy", publication_year=1937, price=14.99, stock_qty=12,
         description="Bilbo Baggins is swept into a quest to reclaim a dwarf kingdom."),
    Book(isbn="9780441172719", title="Dune", author="Frank Herbert",
         genre="Science Fiction", publication_year=1965, price=18.99, stock_qty=8,
         description="A noble family fights for control of a desert planet."),
    Book(isbn="9780062316097", title="Sapiens", author="Yuval Noah Harari",
         genre="History", publication_year=2011, price=24.99, stock_qty=5,
         description="A brief history of humankind."),
    Book(isbn="9780307588371", title="Gone Girl", author="Gillian Flynn",
         genre="Mystery", publication_year=2012, price=16.99, stock_qty=0,
         description="A wife disappears on her fifth anniversary."),
    Book(isbn="9780593135204", title="Project Hail Mary", author="Andy Weir",
         genre="Science Fiction", publication_year=2021, price=19.99, stock_qty=10,
         description="A lone astronaut must save Earth from disaster."),
]


def seed_books():
    """Add sample books only if the table is empty."""
    if Book.query.first() is None:
        db.session.add_all(SAMPLE_BOOKS)
        db.session.commit()
