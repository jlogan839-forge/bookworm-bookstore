/**
 * A book as returned by GET /api/books (inside BookPage.items) and GET /api/books/{isbn}.
 *
 * This matches Book.get_details() in backend/app/models/book.py (the API response),
 * not the database columns. If get_details() changes, update this in the same PR.
 */
export interface Book {
  isbn: string;
  title: string;
  author: string;
  genre: string;
  publicationYear: number | null;
  price: number;
  stockQty: number;
  /** Computed by the backend (FR-07). Use this rather than checking stockQty yourself. */
  inStock: boolean;
  description: string | null;
  coverUrl: string | null;
}

/** Query parameters accepted by GET /api/books. Search and genre can be combined. */
export interface BookQuery {
  q?: string;
  genre?: string;
  /** 1-based. Defaults to 1. */
  page?: number;
  /** Defaults to 24 on the backend, which caps it at 100. */
  perPage?: number;
}

/** One page of results from GET /api/books. */
export interface BookPage {
  items: Book[];
  /** Matching books across all pages. */
  total: number;
  page: number;
  perPage: number;
  /** 0 when nothing matches. */
  totalPages: number;
}

/** A genre and how many books it has, from GET /api/books/genres. */
export interface Genre {
  genre: string;
  count: number;
}
