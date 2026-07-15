"""Fix missing/wrong covers using Google Books API (more accurate than OpenLibrary)."""
import httpx
import time
from supabase_client import supabase

def main():
    result = supabase.table("books").select("isbn,title,cover_url").execute()
    books = [b for b in result.data if not b.get("cover_url") or "openlibrary" in (b.get("cover_url") or "")]

    if not books:
        print("✅ All books have Google Books covers!")
        return

    print(f"🖼️  {len(books)} books to fix\n")

    fixed = 0
    for i, book in enumerate(books):
        isbn = book["isbn"]
        title = book.get("title", "")[:50]

        # Skip non-ISBN entries (ASINs, etc.)
        clean = isbn.replace("-", "")
        if not clean.isdigit() or len(clean) not in (10, 13):
            print(f"[{i+1}/{len(books)}] SKIP (not ISBN): {isbn}")
            continue

        try:
            url = f"https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}"
            resp = httpx.get(url, timeout=8)
            if resp.status_code == 200:
                data = resp.json()
                items = data.get("items", [])
                if items:
                    info = items[0].get("volumeInfo", {})
                    cover = (info.get("imageLinks", {}) or {}).get("thumbnail", "")
                    if cover:
                        cover = cover.replace("http:", "https:")
                        supabase.table("books").update({
                            "cover_url": cover,
                            "updated_at": "now()",
                        }).eq("isbn", isbn).execute()
                        print(f"[{i+1}/{len(books)}] ✅ {title}")
                        fixed += 1
                        time.sleep(1.2)  # Rate limit
                        continue
            elif resp.status_code == 429:
                print(f"[{i+1}/{len(books)}] ⏳ rate limited, waiting...")
                time.sleep(3)
            else:
                print(f"[{i+1}/{len(books)}] ⚠️ HTTP {resp.status_code}")
        except Exception as e:
            print(f"[{i+1}/{len(books)}] ⚠️ {e}")

        time.sleep(1)

    print(f"\n✅ {fixed}/{len(books)} covers fixed via Google Books!")

if __name__ == "__main__":
    main()