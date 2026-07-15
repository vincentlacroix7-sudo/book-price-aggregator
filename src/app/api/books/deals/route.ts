import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "12");

  try {
    const { data: prices, error } = await supabase
      .from("prices")
      .select(`price, currency, condition, format, url, store_name, books!inner(isbn, title, author, cover_url)`)
      .order("scraped_at", { ascending: false })
      .limit(200);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const bookMap = new Map<string, any>();

    for (const p of prices) {
      const book = p.books as any;
      if (!book) continue;
      const isbn = book.isbn;

      if (!bookMap.has(isbn)) {
        bookMap.set(isbn, {
          isbn, title: book.title, author: book.author, cover_url: book.cover_url,
          prices: [], best_price: null, store_count: 0,
        });
      }

      const entry = bookMap.get(isbn);
      entry.prices.push({ store_name: p.store_name, price: p.price, currency: p.currency, condition: p.condition, format: p.format, url: p.url });

      if (entry.best_price === null || p.price < entry.best_price) {
        entry.best_price = p.price;
        entry.best_store = p.store_name;
        entry.best_condition = p.condition;
        entry.best_format = p.format;
      }
      entry.store_count = new Set(entry.prices.map((pr: any) => pr.store_name)).size;
    }

    const books = Array.from(bookMap.values())
      .filter((b) => b.prices.length > 0)
      .sort((a, b) => (a.best_price || 0) - (b.best_price || 0))
      .slice(0, limit);

    return NextResponse.json({ books });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}