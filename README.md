# bookworm-bookstore

# Bookworm Bookstore

An online bookstore where users can browse and search books, manage a cart, check out (with or without an account), write reviews, and keep reading lists.

Group 2 project for SWE 6623: Jack Snodgrass, Amara Bush, Sam Corella, Duane Mitchell

## Tech stack

- **Frontend:** Angular (presentation layer) with Tailwind CSS
- **Backend:** Python / Flask (routes, business logic, and data access layers)
- **Database:** SQLite via Flask-SQLAlchemy

## Changes from orginal proposal

- Changed from Google Gemini to Claude API because group already has existing account/access
- Backend port changed from default 5000 to 50001 because macOS uses port 500 for AirPlay.
- Added 6% sales tax to checkout
- 

## Architecture

Client-server with a layered server. The Angular client sends HTTPS/JSON requests to the Flask server, which is split into three layers:

- `backend/app/routes/` – receives requests and returns responses
- `backend/app/services/` – business logic (search, cart, checkout, inventory)
- `backend/app/models/` – data access (Book, Customer, Order, Review, etc.)

Diagrams and requirements are in `docs/`.

## Project structure

```
bookworm-bookstore/
├── backend/        Flask server
├── frontend/       Angular app
├── docs/           Diagrams and requirements
└── README.md
```

## Prerequisites

- Python 3.9 or newer
- Node.js (LTS version)
- Git

## Setup

Clone the repo:

```bash
git clone https://github.com/jlogan839-forge/bookworm-bookstore.git
cd bookworm-bookstore
```

## API endpoints

Base URL: http://localhost:5001

| Method | Endpoint | Description | Status |
|---|---|---|---|
| GET | /api/health | Check that the server is running | Done |
| GET | /api/books | List books, one page at a time. Supports `?q=` (search title, author, ISBN), `?genre=`, `?page=` and `?per_page=` (default 24, max 100), in any combination. Returns `{ items, total, page, perPage, totalPages }` | Done |
| GET | /api/books/genres | List every genre with its book count: `[{ genre, count }]` | Done |
| GET | /api/books/{isbn} | Get one book's details | Done |
| GET | /api/books/{isbn}/trailer | Get the book's YouTube trailer | Planned |
| GET | /api/books/{isbn}/reviews | List reviews for a book | Planned |
| POST | /api/books/{isbn}/reviews | Write a review (logged-in users) | Planned |
| POST | /api/orders | Place an order (guest or logged in) | Done |
| GET | /api/orders | List the logged-in user's orders | Planned |
| GET | /api/orders/{id} | Get one order's details | Done |
| POST | /api/auth/register | Create an account | Done |
| POST | /api/auth/login | Log in | Done |
| GET | /api/auth/me | Get logged in user's profile (needs token) | Done |
| GET | /api/reading-lists | List the user's reading lists | Planned |
| POST | /api/reading-lists | Create a reading list | Planned |
| POST | /api/assistant | Ask the AI reading assistant for recommendations | Done |

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

The API runs at http://localhost:5001.

#### Book catalog

The catalog is about 1000 real books in 20 genres from the [Open Library API](https://openlibrary.org/developers/api). They're saved in `backend/app/data/books.json`, and the app loads them into SQLite the first time it starts, so it never needs to reach Open Library itself. Prices and stock counts are made up, because Open Library doesn't have them. Cover images are loaded from Open Library's cover server.

**To reload the catalog** (for example after pulling a new `books.json`), stop the server, delete `backend/instance/bookworm.db`, and run `python run.py` again. This also deletes accounts and orders in your local database.

**To rebuild `books.json`** from Open Library (only needed to change the genres or book count):

```bash
cd backend
python scripts/import_books.py                  # 20 genres x 50 books, about 10-15 minutes
python scripts/import_books.py --per-genre 10   # smaller catalog, a few minutes
```

The genres and their Open Library search queries are in `GENRES` in `backend/app/services/open_library_service.py`.

### Frontend

In a second terminal:

```bash
cd frontend
npm install
npm start
```

The app runs at http://localhost:4200.

## Team workflow

1. **Start from the latest main.** Before starting new work, switch to `main` and pull: `git checkout main` then `git pull`.
2. **Create a feature branch.** Name it after the feature: `feature/cart`, `feature/checkout`, etc. Don't commit directly to `main`.
3. **Commit often** with short, clear messages that start with a verb: "Add cart page," "Fix total calculation."
4. **Open a pull request** when the feature is ready, and request a review from at least one teammate.
5. **Squash and merge.** After approval, merge with **Squash and merge** so each feature becomes one commit on `main`. Delete the branch afterward.
6. **Pull main again** after any merge, so everyone builds on the latest code.

**Frontend conventions**
- Each backend resource gets one types file in `frontend/src/app/api/` and one service in `frontend/src/app/services/` (e.g. `book.ts` + `BookService`). Pages use services; they never call the API directly.
- Types match the API's JSON, not the database. Change both in the same PR.
- Business rules stay in the backend; frontend services only fetch data.
- Full details: [frontend/AGENTS.md](frontend/AGENTS.md#api-access-bookworm-convention).

**Other rules**
- If you install a new Python package, update requirements: `pip freeze > requirements.txt`. Tell the group in chat.
- If you install a new npm package, `package.json` updates automatically. Tell the group in chat.
- Never commit API keys. Keys go in `backend/.env`, which is ignored by Git.
- Record any AI use in the AI usage section of this README.

## Schedule

| Phase | Due |
|---|---|
| Requirements analysis | Oct 11 |
| Design | Oct 25 |
| Development | Nov 15 |
| Testing | Dec 4 |

## AI Usage

- Claude Code Opus 5.5 used to generate stub pages for project, based on requirements from our previous work and reviewed by Jack Snodgrass.
- Catalog page (`feature/catalog`): Claude Code (Claude Opus 5.5) generated the catalog page, book card component, `BookService`, `Book` API type, their unit tests, and the frontend conventions sections in this README and `frontend/AGENTS.md`, based on a plan reviewed by Sam Corella.
- Claude Code Opus 5.5 to review code and flag gaps for me to review/revise (Jack Snodgrass):
  - frontend/src/layout/header/header.ts
  - front/end/src/pages/account/account.ts
  - front/end/src/pages/account/login.ts
  - front/end/src/pages/account/register.ts
- Payment and checkout design by Amara Bush: 6% sales tax, validation,
  transaction IDs. Adapted into our model/service/route structure with Claude Code, Opus 5.5.
- Chat assistant built, debugged, and tested by Jack Snodgrass, used Claude Code Opus 5.5 to review and flag inconsistencies.
- Book catalog import (`feature/book-import`): Claude Code (Claude Opus 5.5) wrote the Open Library importer, the `import_books.py` script, the JSON-based seeding, the assistant's random catalog sample, and the Book catalog section of this README, based on a plan reviewed by Sam Corella.
- Catalog pagination (`feature/catalog-pagination`): Claude Code (Claude Opus 5.5) wrote the combined search and genre filter, pagination, and genres endpoint in the backend, the matching `BookService`, `Book` API type, and catalog page changes, their unit tests, and the API table updates in this README, based on a plan reviewed by Sam Corella.
- 

  
