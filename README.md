# bookworm-bookstore

# Bookworm Bookstore

An online bookstore where users can browse and search books, manage a cart, check out (with or without an account), write reviews, and keep reading lists.

Group 2 project for SWE 6623: Jack Snodgrass, Amara Bush, Sam Corella, Duane Mitchell

## Tech stack

- **Frontend:** Angular (presentation layer)
- **Backend:** Python / Flask (routes, business logic, and data access layers)
- **Database:** SQLite via Flask-SQLAlchemy

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

- Don't commit directly to `main`.
- Create a branch for each feature: `feature/cart`, `feature/search`, etc.
- Open a pull request when done, and have one teammate review before merging.
- Pull from `main` often to stay up to date: `git pull origin main`
- If you install a new Python package, update requirements: `pip freeze > requirements.txt`

## Schedule

| Phase | Due |
|---|---|
| Requirements analysis | Oct 11 |
| Design | Oct 25 |
| Development | Nov 15 |
| Testing | Dec 4 |