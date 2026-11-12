/**
 * A book as returned by GET /api/books and GET /api/books/{isbn}.
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

/** Query parameters accepted by GET /api/books. */
export interface BookQuery {
  q?: string;
  genre?: string;
}
