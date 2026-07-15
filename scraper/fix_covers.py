"""Fix covers using OpenLibrary. For books with wrong covers, the search API
will auto-update them when users search — using Google Books cover from search results."""

from supabase_client import supabase


def main():
    result = supabase.table("books").select("isbn,title,cover_url").execute()
    books = [b for b in result.data if not b.get("cover_url")]

    if not books:
        print("✅ All books have covers!")
        return

    print(f"🖼️  {len(books)} books missing covers\n")

    fixed = 0
    for i, book in enumerate(books):
        isbn = book["isbn"]
        title = book.get("title", "")[:50]
        clean = isbn.replace("-", "")

        if not clean.isdigit() or len(clean) not in (10, 13):
            print(f"[{i+1}/{len(books)}] SKIP: {isbn}")
            continue

        cover_url = f"https://covers.openlibrary.org/b/isbn/{clean}-L.jpg"
        try:
            supabase.table("books").update({"cover_url": cover_url, "updated_at": "now()"}).eq("isbn", isbn).execute()
            print(f"[{i+1}/{len(books)}] ✅ {title}")
            fixed += 1
        except Exception as e:
            print(f"[{i+1}/{len(books)}] ⚠️ {title}: {e}")

    print(f"\n✅ {fixed}/{len(books)} covers fixed!")


if __name__ == "__main__":
    main()