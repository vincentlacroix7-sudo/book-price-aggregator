"""Master orchestrator: runs all scrapers and saves results to Supabase.

Usage: python orchestrator.py
  --seed        First run: scrape seed books and populate DB
  --update      Update prices for books already in DB
  --limit N     Limit to N books (default: 50)
"""
import sys
import time
import json
from datetime import datetime, timezone
import httpx

from supabase_client import supabase
from base import rate_limit

# Import all scrapers
import amazon
import indigo
import bookoutlet
import abebooks

SCRAPERS = [
    ("Amazon", amazon.scrape),
    ("Indigo", indigo.scrape),
    ("Book Outlet", bookoutlet.scrape),
    ("AbeBooks", abebooks.scrape),
]

# Seed books: popular books with known ISBNs to bootstrap the database
SEED_BOOKS = [
    {"isbn": "9780735211292", "title": "Atomic Habits", "author": "James Clear"},
    {"isbn": "9781982137274", "title": "The 48 Laws of Power", "author": "Robert Greene"},
    {"isbn": "9780062316097", "title": "Sapiens", "author": "Yuval Noah Harari"},
    {"isbn": "9780385545969", "title": "The Midnight Library", "author": "Matt Haig"},
    {"isbn": "9781250277732", "title": "Project Hail Mary", "author": "Andy Weir"},
    {"isbn": "9780441013593", "title": "Dune", "author": "Frank Herbert"},
    {"isbn": "9780316017930", "title": "The Tipping Point", "author": "Malcolm Gladwell"},
    {"isbn": "9780143126560", "title": "Thinking, Fast and Slow", "author": "Daniel Kahneman"},
    {"isbn": "9781501127625", "title": "Shoe Dog", "author": "Phil Knight"},
    {"isbn": "9780812981605", "title": "Educated", "author": "Tara Westover"},
    {"isbn": "9780307277671", "title": "The Road", "author": "Cormac McCarthy"},
    {"isbn": "9780553418026", "title": "The Martian", "author": "Andy Weir"},
    {"isbn": "9780385480017", "title": "Into the Wild", "author": "Jon Krakauer"},
    {"isbn": "9780316033985", "title": "Outliers", "author": "Malcolm Gladwell"},
    {"isbn": "9781400032716", "title": "The Secret History", "author": "Donna Tartt"},
    {"isbn": "9780061120084", "title": "The Alchemist", "author": "Paulo Coelho"},
    {"isbn": "9780671027360", "title": "The 7 Habits of Highly Effective People", "author": "Stephen Covey"},
    {"isbn": "9781594206276", "title": "The Lean Startup", "author": "Eric Ries"},
    {"isbn": "9780385348263", "title": "The Power of Habit", "author": "Charles Duhigg"},
    {"isbn": "9781250133243", "title": "Can't Hurt Me", "author": "David Goggins"},
]


def seed_database():
    """Insert seed books into Supabase (first run only)."""
    print("🌱 Seeding database with popular books...")
    for book in SEED_BOOKS:
        try:
            supabase.table("books").upsert({
                "isbn": book["isbn"],
                "title": book["title"],
                "author": book["author"],
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }).execute()
        except Exception as e:
            print(f"  ⚠️ Failed to insert {book['title']}: {e}")
    print(f"  ✅ {len(SEED_BOOKS)} books seeded")


def get_books_to_scrape(limit: int, update_mode: bool) -> list[dict]:
    """Get books to scrape: either from seed or from DB (oldest updated first)."""
    if not update_mode:
        return SEED_BOOKS[:limit]

    try:
        result = supabase.table("books").select("isbn,title,author").order("updated_at").limit(limit).execute()
        return result.data or []
    except Exception as e:
        print(f"⚠️ Failed to fetch books from DB: {e}")
        return SEED_BOOKS[:limit]


def save_prices(book_isbn: str, store_prices: list[dict]):
    """Save prices to Supabase and record history."""
    for price_data in store_prices:
        try:
            # Get previous price for history tracking
            prev = supabase.table("prices").select("price").eq(
                "book_isbn", book_isbn
            ).eq("store_name", price_data["store_name"]).eq(
                "condition", price_data["condition"]
            ).execute()

            # Upsert current price
            supabase.table("prices").upsert({
                "book_isbn": book_isbn,
                "store_name": price_data["store_name"],
                "price": price_data["price"],
                "currency": price_data.get("currency", "CAD"),
                "condition": price_data.get("condition", "new"),
                "url": price_data["url"],
                "scraped_at": datetime.now(timezone.utc).isoformat(),
            }).execute()

            # Record history if price changed
            old_price = prev.data[0]["price"] if prev.data else None
            if old_price is None or abs(old_price - price_data["price"]) > 0.01:
                supabase.table("price_history").insert({
                    "book_isbn": book_isbn,
                    "store_name": price_data["store_name"],
                    "price": price_data["price"],
                    "currency": price_data.get("currency", "CAD"),
                    "condition": price_data.get("condition", "new"),
                    "recorded_at": datetime.now(timezone.utc).isoformat(),
                }).execute()

        except Exception as e:
            print(f"    ⚠️ DB error for {price_data['store_name']}: {e}")


def run(limit: int = 50, update_mode: bool = False):
    """Main orchestrator: scrape all stores for all books."""
    print(f"\n{'='*60}")
    print(f"📚 Book Price Scraper — {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print(f"   Mode: {'UPDATE' if update_mode else 'SEED'}")
    print(f"   Limit: {limit} books")
    print(f"   Stores: {', '.join(s[0] for s in SCRAPERS)}")
    print(f"{'='*60}\n")

    if not update_mode:
        seed_database()

    books = get_books_to_scrape(limit, update_mode)

    total_prices = 0
    for i, book in enumerate(books):
        isbn = book["isbn"]
        title = book.get("title", isbn)[:60]
        print(f"[{i+1}/{len(books)}] {title}")

        with httpx.Client(follow_redirects=True, timeout=20) as client:
            for store_name, scraper_fn in SCRAPERS:
                try:
                    prices = scraper_fn(isbn, client)
                    if prices:
                        save_prices(isbn, prices)
                        for p in prices:
                            print(f"  ✅ {store_name}: ${p['price']:.2f} ({p.get('condition', 'new')})")
                            total_prices += 1
                    else:
                        print(f"  ❌ {store_name}: no price found")
                except Exception as e:
                    print(f"  ❌ {store_name}: error — {e}")

                rate_limit(1.5)  # Be nice to servers

        rate_limit(1)  # Between books

    print(f"\n{'='*60}")
    print(f"✅ Done! {total_prices} prices saved for {len(books)} books.")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    mode = "--update" if "--update" in sys.argv else "--seed"
    limit = 50
    for i, arg in enumerate(sys.argv):
        if arg == "--limit" and i + 1 < len(sys.argv):
            limit = int(sys.argv[i + 1])

    update_mode = "--update" in sys.argv
    run(limit=limit, update_mode=update_mode)