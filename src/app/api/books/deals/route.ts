import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // Get books with their prices, ordered by scrape recency
    const { data: prices, error } = await supabase
      .from("prices")
      .select(`
        price,
        currency,
        condition,
        url,
        store_name,
        books!inner(isbn, title, author, cover_url)
      `)
      .order("scraped_at", { ascending: false })
      .limit(30);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group by book and find best deal per book
    const bookMap = new Map<string, any>();

    for (const p of prices) {
      const book = p.books as any;
      const isbn = book.isbn;

      if (!bookMap.has(isbn)) {
        bookMap.set(isbn, {
          isbn,
          title: book.title,
          author: book.author,
          cover_url: book.cover_url,
          prices: [],
          best_price: null,
        });
      }

      const entry = bookMap.get(isbn);
      entry.prices.push({
        store_name: p.store_name,
        price: p.price,
        currency: p.currency,
        condition: p.condition,
        url: p.url,
      });

      if (entry.best_price === null || p.price < entry.best_price) {
        entry.best_price = p.price;
        entry.best_store = p.store_name;
        entry.best_condition = p.condition;
      }
    }

    const books = Array.from(bookMap.values())
      .filter((b) => b.prices.length > 0)
      .sort((a, b) => (a.best_price || 0) - (b.best_price || 0))
      .slice(0, 12);

    return NextResponse.json({ books });
  } catch {
    return NextResponse.json({ error: "Failed to fetch deals" }, { status: 500 });
  }
}