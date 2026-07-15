import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
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

    const books = (data.items || [])
      .map((item: any) => {
        const info = item.volumeInfo;
        const isbn = info.industryIdentifiers?.[0]?.identifier || item.id;
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
      })
      .filter((b: any) => b.cover_url);

    return NextResponse.json({ books });
  } catch {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}