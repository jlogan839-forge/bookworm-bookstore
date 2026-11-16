"""AI reading assistant, using the Claude API.

Key stored in backend/.env as ANTHROPIC_API_KEY and never sent to the frontend.
"""
import json
import os

from sqlalchemy import func

from app.models import Book

MODEL = "claude-haiku-5-5"
MAX_BOOKS = 100  # how many catalog books to show Claude at once

SYSTEM_PROMPT = """You are the reading assistant for Bookworm, an online bookstore.
Recommend books ONLY from the catalog list you are given. Never mention a book
that is not on the list. If nothing fits, say so kindly and suggest a genre to browse.

Reply with JSON only, in exactly this shape:
{"reply": "a short friendly answer, 1-3 sentences",
 "recommendations": [{"isbn": "isbn from the list", "reason": "one sentence"}]}
Recommend at most 3 books."""


class AssistantError(Exception):
    """Raised when the assistant can't answer. The message is safe to show users."""
    
def recommend_books(user_message):
    """Send the message plus a short list of catalog books to Claude.

    Claude recommends only from that list.
    """
    user_message = (user_message or "").strip()
    if not user_message:
        raise AssistantError("Type a question first.")
    if len(user_message) > 500:
        raise AssistantError("Keep your question under 500 characters.")
    if not os.environ.get("ANTHROPIC_API_KEY"):
        raise AssistantError("The reading assistant isn't set up on this computer.")

    # Builds the list of books for Claude to choose from (in-stock books only).
    # A random sample, so every genre has a chance to appear, not just the first rows.
    books = (
        Book.query.filter(Book.stock_qty > 0)
        .order_by(func.random())
        .limit(MAX_BOOKS)
        .all()
    )
    catalog = {b.isbn: b for b in books}
    catalog_text = "\n".join(
        f"- ISBN {b.isbn}: {b.title} by {b.author} ({b.genre})" for b in books
    )

    # Asks Claude
    import anthropic  # imported here so the app still starts if the package is missing

    try:
        response = anthropic.Anthropic().messages.create(
            model=MODEL,
            max_tokens=600,
            system=SYSTEM_PROMPT,
            messages=[{
                "role": "user",
                "content": f"Catalog:\n{catalog_text}\n\nCustomer: {user_message}",
            }],
        )
    except anthropic.APIError:
        raise AssistantError("The reading assistant is unavailable right now. Try again later.")

    text = "".join(block.text for block in response.content if block.type == "text").strip()

    # Reads Claude's JSON answer, keeps only books that are really in the catalog.
    try:
        start, end = text.index("{"), text.rindex("}") + 1
        data = json.loads(text[start:end])
    except ValueError:
        return {"reply": text or "Sorry, I couldn't come up with an answer.", "recommendations": []}

    recommendations = []
    for rec in data.get("recommendations", [])[:3]:
        book = catalog.get(str(rec.get("isbn", "")))
        if book:
            recommendations.append({
                "isbn": book.isbn,
                "title": book.title,
                "author": book.author,
                "reason": rec.get("reason", ""),
            })

    return {"reply": data.get("reply", ""), "recommendations": recommendations}