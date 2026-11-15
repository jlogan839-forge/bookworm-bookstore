"""Open Library API (no key needed): fetch real books for the catalog.

https://openlibrary.org/developers/api
Covers: https://covers.openlibrary.org/b/id/<cover_id>-M.jpg

This runs once, offline, through backend/scripts/import_books.py, which saves the
results to backend/app/data/books.json. The app itself never calls Open Library:
seed.py loads that JSON file into SQLite the first time the app starts.
"""
import hashlib
import json
import random
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

BASE_URL = "https://openlibrary.org"
COVER_URL = "https://covers.openlibrary.org/b/id/{cover_id}-M.jpg"
USER_AGENT = "bookstore-prototype-importer/1.0"
REQUEST_DELAY = 0.5  # seconds between requests, to stay well inside Open Library's rate limit
MAX_DESCRIPTION = 1500  # characters
MIN_DESCRIPTION = 80

# Nonfiction subjects get mixed up with novels on Open Library, so filter those out
NOT_FICTION = "-subject_key:fiction -subject_key:romance -subject_key:juvenile_fiction"

# Our genre label -> Open Library search query.
# Order matters: a book that matches more than one genre goes in the first one,
# so narrower genres come before broad ones (e.g. Young Adult before Fantasy).
GENRES = {
    "Graphic Novels": "subject_key:comic_books_strips_etc",
    "Children's": "subject_key:picture_books",
    "Poetry": f"subject_key:poetry {NOT_FICTION}",
    "Cooking": f"(subject_key:cooking OR subject_key:cookbooks) {NOT_FICTION}",
    "Horror": "subject_key:horror",
    "Thriller": "(subject_key:thrillers OR subject_key:suspense)",
    "Self-Help": f"(subject_key:self-help OR subject_key:success) {NOT_FICTION}",
    "Literary Fiction": "subject_key:literary_fiction",
    "Historical Fiction": "subject_key:historical_fiction",
    "Young Adult": "subject_key:young_adult_fiction",
    "Romance": "subject_key:romance",
    "Mystery": "subject_key:mystery_and_detective_stories",
    "Science Fiction": "subject_key:science_fiction",
    "Fantasy": "subject_key:fantasy",
    "Business": f"subject_key:business {NOT_FICTION}",
    "Philosophy": f"subject_key:philosophy {NOT_FICTION}",
    "Science": f"subject_key:science {NOT_FICTION}",
    "Biography": f"(subject_key:biography OR subject_key:autobiography) {NOT_FICTION}",
    "Travel": f"subject_key:travel {NOT_FICTION}",
    "History": f"subject_key:history {NOT_FICTION}",
}

SEARCH_FIELDS = ",".join([
    "key", "title", "author_name", "first_publish_year", "isbn", "cover_i",
    "editions", "editions.isbn", "editions.title", "editions.language",
])


class OpenLibraryClient:
    """Small HTTP client with throttling, retries, and an optional on-disk cache.

    The cache lets the import script be re-run (e.g. after tweaking filters)
    without downloading everything again.
    """

    def __init__(self, cache_dir=None, delay=REQUEST_DELAY):
        self.cache_dir = Path(cache_dir) if cache_dir else None
        self.delay = delay
        self._last_request = 0.0
        if self.cache_dir:
            self.cache_dir.mkdir(parents=True, exist_ok=True)

    def get_json(self, path, params=None):
        url = BASE_URL + path
        if params:
            url += "?" + urllib.parse.urlencode(params)

        cache_file = None
        if self.cache_dir:
            safe_name = re.sub(r"[^A-Za-z0-9]+", "_", path + "_" + urllib.parse.urlencode(params or {}))
            if len(safe_name) > 200:
                # Long names are shortened, so add a hash of the full URL to keep them unique
                safe_name = safe_name[:150] + "_" + hashlib.sha1(url.encode()).hexdigest()[:16]
            cache_file = self.cache_dir / (safe_name + ".json")
            if cache_file.exists():
                return json.loads(cache_file.read_text(encoding="utf-8"))

        data = self._fetch(url)
        if cache_file is not None:
            cache_file.write_text(json.dumps(data), encoding="utf-8")
        return data

    def _fetch(self, url, attempts=4):
        for attempt in range(attempts):
            wait = self.delay - (time.monotonic() - self._last_request)
            if wait > 0:
                time.sleep(wait)
            self._last_request = time.monotonic()
            request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            try:
                with urllib.request.urlopen(request, timeout=30) as response:
                    return json.loads(response.read().decode("utf-8"))
            except urllib.error.HTTPError as err:
                if err.code == 404:
                    return {}
                if attempt == attempts - 1 or err.code not in (429, 500, 502, 503, 504):
                    raise
            except (urllib.error.URLError, TimeoutError):
                if attempt == attempts - 1:
                    raise
            time.sleep(2 ** (attempt + 1))  # back off: 2s, 4s, 8s
        return {}


def isbn10_to_isbn13(isbn10):
    core = "978" + isbn10[:9]
    total = sum(int(d) * (1 if i % 2 == 0 else 3) for i, d in enumerate(core))
    return core + str((10 - total % 10) % 10)


def normalize_isbn(raw):
    """Return a valid ISBN-13 string, or None."""
    isbn = re.sub(r"[^0-9Xx]", "", raw or "").upper()
    if len(isbn) == 10 and re.fullmatch(r"\d{9}[\dX]", isbn):
        return isbn10_to_isbn13(isbn)
    if len(isbn) == 13 and isbn.isdigit() and isbn.startswith(("978", "979")):
        return isbn
    return None


def pick_isbn(candidates):
    """Prefer English-language ISBNs (978-0 / 978-1), then any valid ISBN-13."""
    normalized = [i for i in (normalize_isbn(c) for c in candidates or []) if i]
    for isbn in normalized:
        if isbn.startswith(("9780", "9781")):
            return isbn
    return normalized[0] if normalized else None


def clean_description(raw):
    """Turn Open Library's description (str or {"value": str}) into plain text."""
    if isinstance(raw, dict):
        raw = raw.get("value")
    if not isinstance(raw, str):
        return None

    text = raw.replace("\r\n", "\n").replace("\r", "\n")
    # Everything after a divider line is usually "Also contained in:" lists or notes
    text = re.split(r"\n\s*[-*_]{3,}\s*(?:\n|$)", text)[0]
    text = re.split(r"\n\s*(?:Contains|Also contained in)\s*:", text, flags=re.IGNORECASE)[0]
    text = re.sub(r"^\s*\[\d+\]:\s*\S+.*$", "", text, flags=re.MULTILINE)  # [1]: https://...
    text = re.sub(r"\(\s*\[[^\]]*source[^\]]*\]\s*(\[\d+\]|\([^)]*\))?\s*\)", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", text)  # [text](url) -> text
    text = re.sub(r"\[([^\]]+)\]\[\d+\]", r"\1", text)  # [text][1] -> text
    text = re.sub(r"https?://\S+", "", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()

    if len(text) > MAX_DESCRIPTION:
        cut = text[:MAX_DESCRIPTION]
        end = max(cut.rfind(". "), cut.rfind(".\n"), cut.rfind("! "), cut.rfind("? "))
        text = cut[: end + 1] if end > MAX_DESCRIPTION // 2 else cut.rsplit(" ", 1)[0] + "…"

    return text if len(text) >= MIN_DESCRIPTION else None


def make_price_and_stock(isbn):
    """Open Library has no prices, so make them up. Seeded by ISBN so re-runs match."""
    rng = random.Random(isbn)
    price = rng.randint(7, 34) + 0.99
    stock = 0 if rng.random() < 0.05 else rng.randint(1, 25)
    return price, stock


def _book_from_search_doc(doc, genre):
    """Build a book dict from a search result, or None if it's missing key fields."""
    if not doc.get("cover_i") or not doc.get("author_name") or not doc.get("title"):
        return None

    edition = (doc.get("editions") or {}).get("docs") or [{}]
    edition = edition[0]
    isbn = pick_isbn(edition.get("isbn")) or pick_isbn(doc.get("isbn"))
    if not isbn:
        return None

    # The work title is often in the original language; prefer the English edition's
    title = doc["title"]
    if "eng" in (edition.get("language") or []) and edition.get("title"):
        title = edition["title"]

    price, stock = make_price_and_stock(isbn)
    return {
        "isbn": isbn,
        "title": title[:200],
        "author": ", ".join(doc["author_name"][:3])[:200],
        "genre": genre,
        "publication_year": doc.get("first_publish_year"),
        "price": price,
        "stock_qty": stock,
        "description": None,
        "cover_url": COVER_URL.format(cover_id=doc["cover_i"]),
        "_work_key": doc["key"],
    }


def import_books(subject, limit=50, client=None, seen_works=None, seen_isbns=None,
                 max_candidates=300, log=print):
    """Fetch up to `limit` books for one genre label (a key of GENRES).

    Returns a list of dicts whose keys match the Book model's columns.
    Books with a description are preferred; if there aren't enough, books
    without one fill the remaining slots. `seen_works` / `seen_isbns` are
    shared across genres so a book only appears once in the catalog.
    """
    client = client or OpenLibraryClient()
    seen_works = seen_works if seen_works is not None else set()
    seen_isbns = seen_isbns if seen_isbns is not None else set()
    query = GENRES.get(subject, f'subject:"{subject}"') + " language:eng"

    with_description, without_description = [], []
    checked, page, seen_on_pages = 0, 1, set()
    while len(with_description) < limit and checked < max_candidates and page <= 10:
        results = client.get_json("/search.json", {
            "q": query, "fields": SEARCH_FIELDS, "sort": "readinglog",
            "limit": 100, "page": page,
        })
        docs = results.get("docs") or []
        page_keys = {doc.get("key") for doc in docs}
        if not docs or page_keys <= seen_on_pages:
            break  # no more results, or the API returned a page we've already seen
        seen_on_pages |= page_keys

        for doc in docs:
            if len(with_description) >= limit or checked >= max_candidates:
                break
            if doc.get("key") in seen_works:
                continue
            book = _book_from_search_doc(doc, subject)
            if book is None or book["isbn"] in seen_isbns:
                continue

            checked += 1
            work = client.get_json(f"{book['_work_key']}.json")
            book["description"] = clean_description(work.get("description"))
            (with_description if book["description"] else without_description).append(book)
            seen_works.add(book["_work_key"])
            seen_isbns.add(book["isbn"])
        page += 1

    books = with_description + without_description[: max(0, limit - len(with_description))]
    # Release works we picked up but didn't keep, so a later genre can use them
    for book in without_description[max(0, limit - len(with_description)):]:
        seen_works.discard(book["_work_key"])
        seen_isbns.discard(book["isbn"])

    missing = sum(1 for b in books if not b["description"])
    log(f"{subject}: {len(books)} books ({missing} without a description, {checked} checked)")
    if len(books) < limit:
        log(f"  warning: only found {len(books)} of {limit} books for {subject}")

    for book in books:
        del book["_work_key"]
    return books
