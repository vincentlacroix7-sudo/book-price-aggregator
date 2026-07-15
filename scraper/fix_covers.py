"""Fetch missing covers for all books in DB via Google Books API."""
import httpx
import time
from supabase_client import supabase

def main():
    result = supabase.table("books").select("isbn,title,cover_url").execute()
    books = [b for b in result.data if not b.get("cover_url")]  # NULL or empty

    if not books:
        print("✅ All books have covers!")
        return

    print(f"🖼️  {len(books)} books missing covers\n")

    fixed = 0
    for i, book in enumerate(books):
        isbn = book["isbn"]
        print(f"[{i+1}/{len(books)}] {book['title'][:50]}...", end=" ")

        try:
            url = f"https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}"
            resp = httpx.get(url, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                items = data.get("items", [])
                if items:
                    info = items[0].get("volumeInfo", {})
                    cover = (info.get("imageLinks", {}) or {}).get("thumbnail", "")
                    desc = (info.get("description") or "")[:500]
                    author = ", ".join(info.get("authors", ["Unknown"]))
                    publisher = info.get("publisher", "")
                    pages = info.get("pageCount", 0)
                    published = info.get("publishedDate", "")

                    supabase.table("books").update({
                        "cover_url": cover.replace("http:", "https:") if cover else "",
                        "author": author if author != "—" else book.get("author", author),
                        "description": desc,
                        "publisher": publisher,
                        "pages": pages,
                        "published_date": published,
                        "updated_at": "now()",
                    }).eq("isbn", isbn).execute()

                    print(f"✅ cover{' + author' if author else ''}")
                    fixed += 1
                else:
                    print("❌ not found")
            elif resp.status_code == 429:
                print("⏳ rate limited, waiting...")
                time.sleep(5)
            else:
                print(f"⚠️ HTTP {resp.status_code}")
        except Exception as e:
            print(f"⚠️ {e}")

        time.sleep(1.5)  # Rate limit

    print(f"\n✅ {fixed}/{len(books)} covers fixed!")

if __name__ == "__main__":
    main()