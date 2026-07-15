"""Fix missing covers using OpenLibrary Covers API — free, no rate limit, no API key.

OpenLibrary cover URL format: https://covers.openlibrary.org/b/isbn/{ISBN}-L.jpg
This works without any API call — just construct the URL from the ISBN.
"""

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
        title = book.get("title", "")[:50]

        # Skip Amazon ASINs (10-char alphanumeric, not real ISBNs)
        # Real ISBNs are 10 or 13 digits
        clean = isbn.replace("-", "")
        if not clean.isdigit() or len(clean) not in (10, 13):
            print(f"[{i+1}/{len(books)}] SKIP (ASIN, not ISBN): {isbn}")
            continue

        # OpenLibrary cover URL (no API call needed!)
        cover_url = f"https://covers.openlibrary.org/b/isbn/{clean}-L.jpg"

        try:
            supabase.table("books").update({
                "cover_url": cover_url,
                "updated_at": "now()",
            }).eq("isbn", isbn).execute()

            print(f"[{i+1}/{len(books)}] ✅ {title}")
            fixed += 1
        except Exception as e:
            print(f"[{i+1}/{len(books)}] ⚠️ {title}: {e}")

    print(f"\n✅ {fixed}/{len(books)} covers fixed (via OpenLibrary)!")


if __name__ == "__main__":
    main()