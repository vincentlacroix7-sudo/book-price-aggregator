"""Populate DB with 100 popular books + fetch covers from Google Books API."""
import httpx
import time
from supabase_client import supabase

POPULAR_ISBNS = [
    # Fiction bestsellers
    "9780385545969", "9781250277732", "9781982137274", "9780441013593",
    "9780316017930", "9780143126560", "9781501127625", "9780812981605",
    "9780307277671", "9780553418026", "9780385480017", "9780316033985",
    "9781400032716", "9780061120084", "9780671027360", "9781594206276",
    "9780385348263", "9781250133243", "9780735211292",
    # Classic fiction
    "9780062316097", "9780140280197", "9780141182537", "9780143105985",
    "9780316769488", "9780679723165", "9780143039433", "9780060850524",
    "9780375704024", "9780307387899", "9780385490818", "9780812976717",
    # Fantasy / Sci-Fi
    "9780547928227", "9780544003415", "9780544273443", "9780553103540",
    "9780553573404", "9780553381689", "9780765311788", "9781250301697",
    "9780765397522", "9780765382030",
    # Thriller / Mystery
    "9780307588364", "9780307588371", "9780385547352", "9780593465271",
    "9781984883025", "9780525536283", "9781250843937",
    # Non-fiction bestsellers
    "9781984855510", "9780593137468", "9780593419346", "9781982181284",
    "9780593239735", "9781984801258", "9780399592063",
    # Self-help / Business
    "9780735211308", "9780143129257", "9781591847748", "9780804139298",
    "9780814439391", "9781591847748", "9780525533580", "9780399592526",
    # Romance / Contemporary
    "9781501110368", "9781501161933", "9781501180989", "9781982170714",
    "9781635578003", "9781982158949",
    # Memoir / Biography
    "9780399590504", "9780525562627", "9781984878106", "9780399588198",
    "9780593139134", "9780593230069",
    # YA / Children's
    "9781338635171", "9780316420273", "9781250843937", "9781338299144",
    "9781368057486", "9781368095471",
    # More popular
    "9781101904190", "9781784742324", "9780062955326", "9780593182944",
    "9780399562440", "9781250288714", "9781250857453", "9781982156947",
    "9780063268295",
]


def fetch_book_info(isbn: str) -> dict | None:
    """Fetch book metadata from Google Books API."""
    url = f"https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}"
    try:
        resp = httpx.get(url, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if data.get("items"):
                info = data["items"][0].get("volumeInfo", {})
                return {
                    "isbn": isbn,
                    "title": info.get("title", "Unknown"),
                    "author": ", ".join(info.get("authors", ["Unknown"])),
                    "cover_url": (info.get("imageLinks", {}) or {}).get("thumbnail", "").replace("http:", "https:"),
                    "description": (info.get("description") or "")[:500],
                    "publisher": info.get("publisher", ""),
                    "pages": info.get("pageCount", 0),
                    "published_date": info.get("publishedDate", ""),
                }
        elif resp.status_code == 429:
            print("  ⏳ Rate limited, waiting 5s...")
            time.sleep(5)
            return fetch_book_info(isbn)  # Retry once
    except Exception as e:
        print(f"  ⚠️ Error: {e}")
    return None


def main():
    print(f"📚 Processing {len(POPULAR_ISBNS)} popular books...\n")

    inserted = 0
    for i, isbn in enumerate(POPULAR_ISBNS):
        print(f"[{i+1}/{len(POPULAR_ISBNS)}] {isbn}...", end=" ")
        book = fetch_book_info(isbn)
        if book:
            try:
                supabase.table("books").upsert({
                    **book,
                    "updated_at": "now()",
                }).execute()
                print(f"✅ {book['title'][:50]}")
                inserted += 1
            except Exception as e:
                print(f"⚠️ DB error: {e}")
        else:
            print("❌ not found")
        time.sleep(2.0)  # Rate limit: be gentle with Google Books API

    print(f"\n✅ Done! {inserted}/{len(POPULAR_ISBNS)} books inserted.")


if __name__ == "__main__":
    main()