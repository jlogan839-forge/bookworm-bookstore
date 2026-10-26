"""ReadingListItem model, matching the ReadingListItem class in the UML diagram."""
from app.extensions import db


class ReadingListItem(db.Model):
    __tablename__ = "reading_list_item"

    list_id = db.Column(db.Integer, db.ForeignKey("reading_list.list_id"), primary_key=True)
    isbn = db.Column(db.String(13), db.ForeignKey("book.isbn"), primary_key=True)
    date_added = db.Column(db.Date)

    def remove_item(self):
        """FR-15: remove this book from its reading list."""
        pass
