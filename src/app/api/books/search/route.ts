import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ books: [] });
  }

  const trimmed = query.trim();

  try {
    // 1. Search our own DB first (fast, no rate limit)
    const { data: dbBooks } = await supabase
      .from("books")
      .select("isbn, title, author, cover_url, description, publisher, pages, published_date")
      .or(`title.ilike.%${trimmed}%,author.ilike.%${trimmed}%,isbn.ilike.%${trimmed}%`)
      .limit(20);

    const results = (dbBooks || []).map((b) => ({
      ...b,
      source: "db",
    }));

    // Track search popularity for found books
    for (const book of results) {
      try {
        await supabase.rpc("increment_search", { p_isbn: book.isbn });
      } catch {}
    }

    // 2. If few results, try Google Books as fallback
    if (results.length < 5) {
      try {
        const gbRes = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(trimmed)}&maxResults=10&langRestrict=en&key=${process.env.GOOGLE_BOOKS_API_KEY}`,
          { signal: AbortSignal.timeout(5000) }
        );

        if (gbRes.ok) {
          const gbData = await gbRes.json();
          const seenIsbns = new Set(results.map((b) => b.isbn));

          for (const item of gbData.items || []) {
            const info = item.volumeInfo || {};
            const isbn = info.industryIdentifiers?.[0]?.identifier || `gb_${item.id}`;
            if (seenIsbns.has(isbn)) continue;
            seenIsbns.add(isbn);

            const book = {
              isbn,
              title: info.title || "Unknown",
              author: (info.authors || ["Unknown"]).join(", "),
              cover_url: (info.imageLinks?.thumbnail || "").replace("http:", "https:"),
              description: (info.description || "").slice(0, 500),
              publisher: info.publisher || "",
              pages: info.pageCount || 0,
              published_date: info.publishedDate || "",
              source: "google",
            };

            // Auto-add to DB (and update cover if existing)
            try {
              // Check if book already exists — if so, update cover from Google
              const existing = await supabase.from("books").select("cover_url").eq("isbn", isbn).single();
              if (existing.data?.cover_url?.includes("openlibrary")) {
                // Replace OpenLibrary cover with Google Books cover
                await supabase.from("books").update({ cover_url: book.cover_url }).eq("isbn", isbn);
              }
              await supabase.from("books").upsert({ ...book, updated_at: new Date().toISOString() });
              await supabase.rpc("increment_search", { p_isbn: isbn });
            } catch {}

            results.push(book);
          }
        }
      } catch {
        // Google Books failed — that's OK, we have DB results
      }
    }

    return NextResponse.json({ books: results.slice(0, 20) });
  } catch {
    return NextResponse.json({ books: [], error: "Search unavailable" }, { status: 500 });
  }
}