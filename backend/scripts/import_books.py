"""Build backend/app/data/books.json from the Open Library API.

Run from the backend folder, with the virtual environment active:

    python scripts/import_books.py                  # 20 genres x 50 books (~1000)
    python scripts/import_books.py --per-genre 10   # quicker, smaller catalog

This only needs to be run when we want to change the catalog. The app loads the
saved JSON file into SQLite on first start (see app/seed.py), so it never calls
Open Library itself. Takes about 10-15 minutes for the full catalog. API
responses are cached in scripts/.cache/ so re-runs are fast.
"""
import argparse
import json
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.services.open_library_service import GENRES, OpenLibraryClient, import_books  # noqa: E402

DEFAULT_OUT = BACKEND_DIR / "app" / "data" / "books.json"
DEFAULT_CACHE = BACKEND_DIR / "scripts" / ".cache"


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--per-genre", type=int, default=50, help="books per genre (default 50)")
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT, help="where to write the JSON file")
    parser.add_argument("--no-cache", action="store_true", help="don't read or write the response cache")
    args = parser.parse_args()

    client = OpenLibraryClient(cache_dir=None if args.no_cache else DEFAULT_CACHE)
    seen_works, seen_isbns = set(), set()
    books = []
    for genre in GENRES:
        books += import_books(genre, args.per_genre, client=client,
                              seen_works=seen_works, seen_isbns=seen_isbns)

    # Keep the catalog in the same order the genre list is shown in
    books.sort(key=lambda b: (b["genre"], b["title"].lower()))

    snapshot = {
        "source": "Open Library (https://openlibrary.org). Prices and stock are generated.",
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "count": len(books),
        "books": books,
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(snapshot, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")

    counts = Counter(b["genre"] for b in books)
    missing = sum(1 for b in books if not b["description"])
    print(f"\nWrote {len(books)} books to {args.out}")
    print(f"{missing} without a description, {sum(b['stock_qty'] == 0 for b in books)} out of stock")
    for genre, count in sorted(counts.items()):
        print(f"  {genre}: {count}")


if __name__ == "__main__":
    main()
