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
- TBD

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

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

The API runs at http://localhost:5001.

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

- Document your AI usage here
- 