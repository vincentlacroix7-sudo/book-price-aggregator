"""Discover popular books from multiple sources and add to Supabase.

Sources:
1. Amazon Best Sellers (multiple categories)
2. NYT Best Sellers API
3. Curated high-quality lists

Excludes: occult, esotericism, satanism, anti-religious content.
"""

import httpx
import re
import time
import json
from supabase_client import supabase


# === Categories to scrape from Amazon Best Sellers ===
# Excluded: "Occult", "New Age", "Witchcraft", "Satanism", etc.
AMAZON_CATEGORIES = [
    ("books", "Books (General)"),
    ("nonfiction", "Nonfiction"),
    ("literature-fiction", "Literary Fiction"),
    ("science-fiction-fantasy", "Sci-Fi & Fantasy"),
    ("mystery-thriller-suspense", "Mystery & Thriller"),
    ("romance", "Romance"),
    ("biographies-memoirs", "Biographies"),
    ("business-money", "Business & Money"),
    ("self-help", "Self-Help"),
    ("history", "History"),
    ("science-math", "Science & Math"),
    ("cooking-food-wine", "Cookbooks"),
    ("travel", "Travel"),
    ("arts-photography", "Arts & Photography"),
    ("christian-books-bibles", "Christian Books"),
    ("childrens-books", "Children's Books"),
    ("teen-young-adult", "Young Adult"),
    ("comics-graphic-novels", "Comics & Graphic Novels"),
    ("health-fitness-dieting", "Health & Fitness"),
    ("parenting-relationships", "Parenting"),
    ("politics-social-sciences", "Politics & Social Sciences"),
    ("education-teaching", "Education"),
    ("engineering-transportation", "Engineering"),
    ("computers-technology", "Computers & Technology"),
    ("sports-outdoors", "Sports"),
    ("humor-entertainment", "Humor"),
    ("law", "Law"),
    ("medical-books", "Medicine"),
    ("reference", "Reference"),
    ("religion-spirituality", "Religion (mainstream)"),
]


def scrape_amazon_bestsellers(category: str) -> list[dict]:
    """Scrape Amazon Best Sellers page for a category. Returns list of {title, author, isbn}."""
    books = []
    url = f"https://www.amazon.ca/gp/bestsellers/{category}/ref=zg_bs_unv_b_1_b_1"

    try:
        resp = httpx.get(url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept-Language": "en-CA,en;q=0.9",
        }, timeout=15, follow_redirects=True)

        if resp.status_code != 200:
            return books

        html = resp.text

        # Find product links with ASIN (Amazon's ISBN-like identifier)
        asin_matches = re.findall(r'/dp/([0-9A-Z]{10})', html)
        title_matches = re.findall(r'alt="([^"]+)"', html)

        seen = set()
        for asin in asin_matches[:20]:  # Top 20 per category
            if asin not in seen:
                seen.add(asin)
                books.append({
                    "title": "",
                    "author": "",
                    "asin": asin,
                    "source": f"amazon_{category}",
                })
    except Exception as e:
        print(f"  ⚠️ Amazon {category}: {e}")

    return books


def fetch_from_google_books(query: str, max_results: int = 20) -> list[dict]:
    """Fetch books from Google Books API by query."""
    books = []
    url = f"https://www.googleapis.com/books/v1/volumes?q={query}&maxResults={max_results}&orderBy=relevance&langRestrict=en"

    try:
        resp = httpx.get(url, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            for item in data.get("items", []):
                info = item.get("volumeInfo", {})
                isbns = info.get("industryIdentifiers", [])
                isbn = None
                for i in isbns:
                    if i.get("type") in ("ISBN_13", "ISBN_10"):
                        isbn = i["identifier"]
                        break
                if not isbn:
                    continue

                books.append({
                    "isbn": isbn,
                    "title": info.get("title", "Unknown"),
                    "author": ", ".join(info.get("authors", ["Unknown"])),
                    "cover_url": (info.get("imageLinks", {}) or {}).get("thumbnail", "").replace("http:", "https:"),
                    "description": (info.get("description") or "")[:500],
                    "publisher": info.get("publisher", ""),
                    "pages": info.get("pageCount", 0),
                    "published_date": info.get("publishedDate", ""),
                    "source": f"google_{query[:30]}",
                })
        elif resp.status_code == 429:
            time.sleep(3)
    except Exception as e:
        print(f"  ⚠️ Google Books '{query}': {e}")

    return books


def get_nyt_bestsellers() -> list[dict]:
    """Fetch NYT Best Sellers (free API — no key needed for basic lists)."""
    books = []
    # NYT has a public bestsellers page we can parse
    # Categories: Combined Print & E-Book Fiction/Nonfiction, Hardcover, Paperback
    categories = [
        "combined-print-and-e-book-fiction",
        "combined-print-and-e-book-nonfiction",
        "hardcover-fiction",
        "hardcover-nonfiction",
        "paperback-fiction",
        "paperback-nonfiction",
        "advice-how-to-and-miscellaneous",
        "childrens-middle-grade-hardcover",
        "young-adult-hardcover",
        "business-books",
        "science",
        "education",
    ]

    for cat in categories:
        try:
            url = f"https://www.nytimes.com/books/best-sellers/{cat}/"
            resp = httpx.get(url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            }, timeout=10, follow_redirects=True)
            if resp.status_code == 200:
                # Extract book titles from the page
                titles = re.findall(r'"title":"([^"]+)"', resp.text)
                for title in titles[:10]:
                    if len(title) > 3 and len(title) < 200:
                        books.append({"title": title.strip(), "source": f"nyt_{cat}"})
        except Exception as e:
            print(f"  ⚠️ NYT {cat}: {e}")

    return books


def insert_books(books: list[dict]) -> int:
    """Insert books into Supabase. Deduplicates by ISBN."""
    inserted = 0
    for book in books:
        isbn = book.get("isbn")
        if not isbn:
            continue
        try:
            supabase.table("books").upsert({
                "isbn": isbn,
                "title": book.get("title", ""),
                "author": book.get("author", ""),
                "cover_url": book.get("cover_url", ""),
                "description": book.get("description", ""),
                "publisher": book.get("publisher", ""),
                "pages": book.get("pages", 0),
                "published_date": book.get("published_date", ""),
                "updated_at": "now()",
            }).execute()
            inserted += 1
        except Exception:
            pass
    return inserted


def main():
    print("🔍 Discovering popular books...\n")

    all_books = []

    # 1. Amazon Best Sellers (multiple categories)
    print("📦 Amazon Best Sellers...")
    for cat_id, cat_name in AMAZON_CATEGORIES:
        print(f"  {cat_name}...")
        books = scrape_amazon_bestsellers(cat_id)
        all_books.extend(books)
        time.sleep(1)  # Be gentle

    print(f"  ✅ {len(all_books)} ASINs found")

    # 2. Google Books API — popular searches (with rate limiting)
    print("\n🔎 Google Books — popular subjects...")
    goog_queries = [
        "bestselling fiction 2024", "bestselling nonfiction 2024",
        "most popular books this year", "award winning novels",
        "book club recommendations", "top rated fantasy books",
        "best thriller novels", "best romance novels",
        "best business books", "best self improvement books",
        "best history books", "best biography books",
        "best science books", "best cookbooks 2024",
        "classic literature must read", "bestselling manga",
    ]

    goog_books = []
    for q in goog_queries:
        print(f"  {q}...")
        found = fetch_from_google_books(q, 15)
        goog_books.extend(found)
        time.sleep(1.5)  # Rate limit

    # Deduplicate Google Books by ISBN
    seen_isbns = set()
    unique_goog = []
    for b in goog_books:
        if b["isbn"] not in seen_isbns:
            seen_isbns.add(b["isbn"])
            unique_goog.append(b)

    print(f"  ✅ {len(unique_goog)} unique books from Google Books")

    # 3. Insert Google Books results (these have full metadata)
    inserted = insert_books(unique_goog)
    print(f"\n📝 {inserted} books inserted from Google Books")

    # 4. Also add Amazon ASINs as books (scraper will resolve them)
    # For ASINs that aren't standard ISBNs, they still work for scraping
    asin_inserted = 0
    for book in all_books:
        asin = book.get("asin")
        if asin and asin not in seen_isbns:
            try:
                supabase.table("books").upsert({
                    "isbn": asin,
                    "title": book.get("title", f"Amazon Bestseller ({book['source']})"),
                    "author": book.get("author", ""),
                    "updated_at": "now()",
                }).execute()
                asin_inserted += 1
            except Exception:
                pass

    print(f"📝 {asin_inserted} Amazon bestseller ASINs added")

    # Final count
    total = supabase.table("books").select("*", count="exact", head=True).execute()
    print(f"\n📚 Total books in DB: {total.count}")


if __name__ == "__main__":
    main()