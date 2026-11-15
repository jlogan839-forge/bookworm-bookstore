"""FR-12 book reviews: write, edit, and delete, with ownership rules and average ratings."""
import pytest

DUNE = "9780441172719"
HOBBIT = "9780547928227"


def post_review(client, headers, isbn=DUNE, rating=4, text="Great book."):
    return client.post(f"/api/books/{isbn}/reviews", headers=headers,
                       json={"rating": rating, "reviewText": text})


# --- Writing a review ---

def test_logged_in_customer_can_write_a_review(client, register):
    res = post_review(client, register("Ada"), rating=5, text="  Loved it.  ")
    assert res.status_code == 201
    review = res.get_json()
    assert review["rating"] == 5
    assert review["reviewText"] == "Loved it."
    assert review["reviewerName"] == "Ada"
    assert review["reviewDate"]
    assert "email" not in review


def test_writing_a_review_needs_a_login(client):
    assert post_review(client, headers={}).status_code == 401


@pytest.mark.parametrize("rating", [0, 6, 3.5, "4", None, True])
def test_rating_must_be_a_whole_number_from_1_to_5(client, register, rating):
    res = post_review(client, register(), rating=rating)
    assert res.status_code == 400
    assert "1 to 5" in res.get_json()["error"]


@pytest.mark.parametrize("text", ["", "   ", None, "x" * 1001])
def test_review_text_is_required_and_short(client, register, text):
    assert post_review(client, register(), text=text).status_code == 400


def test_one_review_per_customer_per_book(client, register):
    headers = register()
    assert post_review(client, headers).status_code == 201
    res = post_review(client, headers)
    assert res.status_code == 400
    assert "already reviewed" in res.get_json()["error"]
    # A different book is fine
    assert post_review(client, headers, isbn=HOBBIT).status_code == 201


def test_cannot_review_a_book_that_does_not_exist(client, register):
    assert post_review(client, register(), isbn="0000000000").status_code == 404


# --- Listing reviews ---

def test_anyone_can_list_reviews_newest_first(client, register):
    post_review(client, register("Ada"), text="First")
    post_review(client, register("Bob"), text="Second")
    res = client.get(f"/api/books/{DUNE}/reviews")
    assert res.status_code == 200
    assert [r["reviewText"] for r in res.get_json()] == ["Second", "First"]


def test_listing_reviews_for_unknown_book_is_404(client):
    assert client.get("/api/books/0000000000/reviews").status_code == 404


# --- Editing ---

def test_owner_can_edit_their_review(client, register):
    headers = register()
    review_id = post_review(client, headers, rating=2).get_json()["reviewId"]
    res = client.put(f"/api/reviews/{review_id}", headers=headers,
                     json={"rating": 4, "reviewText": "Better on a reread."})
    assert res.status_code == 200
    assert res.get_json()["rating"] == 4
    assert res.get_json()["reviewText"] == "Better on a reread."


def test_editing_only_the_rating_keeps_the_text(client, register):
    headers = register()
    review_id = post_review(client, headers, text="Keep me").get_json()["reviewId"]
    res = client.put(f"/api/reviews/{review_id}", headers=headers, json={"rating": 1})
    assert res.get_json()["reviewText"] == "Keep me"


def test_invalid_edit_changes_nothing(client, register):
    headers = register()
    review_id = post_review(client, headers, rating=3, text="Original").get_json()["reviewId"]
    res = client.put(f"/api/reviews/{review_id}", headers=headers,
                     json={"rating": 9, "reviewText": "New text"})
    assert res.status_code == 400
    review = client.get(f"/api/books/{DUNE}/reviews").get_json()[0]
    assert (review["rating"], review["reviewText"]) == (3, "Original")


def test_cannot_edit_someone_elses_review(client, register):
    review_id = post_review(client, register("Ada")).get_json()["reviewId"]
    res = client.put(f"/api/reviews/{review_id}", headers=register("Bob"), json={"rating": 1})
    assert res.status_code == 403
    assert client.get(f"/api/books/{DUNE}/reviews").get_json()[0]["rating"] == 4


def test_editing_needs_a_login(client, register):
    review_id = post_review(client, register()).get_json()["reviewId"]
    assert client.put(f"/api/reviews/{review_id}", json={"rating": 1}).status_code == 401


def test_editing_a_missing_review_is_404(client, register):
    assert client.put("/api/reviews/999", headers=register(), json={"rating": 1}).status_code == 404


# --- Deleting ---

def test_owner_can_delete_their_review(client, register):
    headers = register()
    review_id = post_review(client, headers).get_json()["reviewId"]
    assert client.delete(f"/api/reviews/{review_id}", headers=headers).status_code == 204
    assert client.get(f"/api/books/{DUNE}/reviews").get_json() == []
    # They can review the book again afterwards
    assert post_review(client, headers).status_code == 201


def test_cannot_delete_someone_elses_review(client, register):
    review_id = post_review(client, register("Ada")).get_json()["reviewId"]
    assert client.delete(f"/api/reviews/{review_id}", headers=register("Bob")).status_code == 403
    assert len(client.get(f"/api/books/{DUNE}/reviews").get_json()) == 1


def test_deleting_needs_a_login(client, register):
    review_id = post_review(client, register()).get_json()["reviewId"]
    assert client.delete(f"/api/reviews/{review_id}").status_code == 401


# --- Average rating on books ---

def test_books_without_reviews_have_no_average(client):
    book = client.get(f"/api/books/{DUNE}").get_json()
    assert book["averageRating"] is None
    assert book["reviewCount"] == 0


def test_average_rating_in_catalog_and_detail(client, register):
    post_review(client, register("Ada"), rating=5)
    post_review(client, register("Bob"), rating=4)
    post_review(client, register("Cy"), rating=4)

    book = client.get(f"/api/books/{DUNE}").get_json()
    assert book["averageRating"] == 4.3  # 13 / 3, rounded to 1 decimal place
    assert book["reviewCount"] == 3

    items = {b["isbn"]: b for b in client.get("/api/books").get_json()["items"]}
    assert items[DUNE]["averageRating"] == 4.3
    assert items[DUNE]["reviewCount"] == 3
    assert items[HOBBIT]["averageRating"] is None
    assert items[HOBBIT]["reviewCount"] == 0


def test_average_updates_after_edit_and_delete(client, register):
    ada = register("Ada")
    review_id = post_review(client, ada, rating=2).get_json()["reviewId"]
    post_review(client, register("Bob"), rating=4)

    client.put(f"/api/reviews/{review_id}", headers=ada, json={"rating": 5})
    assert client.get(f"/api/books/{DUNE}").get_json()["averageRating"] == 4.5

    client.delete(f"/api/reviews/{review_id}", headers=ada)
    book = client.get(f"/api/books/{DUNE}").get_json()
    assert (book["averageRating"], book["reviewCount"]) == (4.0, 1)
