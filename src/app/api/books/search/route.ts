import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ books: [] });
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20&langRestrict=en`
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch books" }, { status: 500 });
    }

    const data = await res.json();
    const books = (data.items || []).map((item: any) => {
      const info = item.volumeInfo;
      const isbn = info.industryIdentifiers?.[0]?.identifier || `google_${item.id}`;
      return {
        isbn,
        title: info.title || "Unknown Title",
        author: info.authors?.join(", ") || "Unknown Author",
        cover_url: info.imageLinks?.thumbnail?.replace("http:", "https:") || "",
        description: info.description || "",
        publisher: info.publisher || "",
        pages: info.pageCount || 0,
        published_date: info.publishedDate || "",
      };
    });

    // Auto-add books to DB + track popularity
    for (const book of books) {
      try {
        // Upsert book metadata
        await supabase.from("books").upsert({
          isbn: book.isbn,
          title: book.title,
          author: book.author,
          cover_url: book.cover_url,
          description: book.description,
          publisher: book.publisher,
          pages: book.pages,
          published_date: book.published_date,
          updated_at: new Date().toISOString(),
        });

        // Track search popularity
        await supabase.from("book_popularity").upsert({
          isbn: book.isbn,
          search_count: 1,
          last_searched_at: new Date().toISOString(),
        }, {
          onConflict: "isbn",
          // Increment search_count if already exists
        });

        // Increment with raw SQL since upsert can't increment
        await supabase.rpc("increment_search", { p_isbn: book.isbn }).maybeSingle();
      } catch {
        // Silent fail — search still works even if DB insert fails
      }
    }

    return NextResponse.json({ books });
  } catch {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}