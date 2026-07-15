import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ isbn: string }> }
) {
  const { isbn } = await params;

  try {
    const { data: allPrices, error } = await supabase
      .from("prices")
      .select("store_name, price, msrp, currency, condition, format, url, scraped_at")
      .eq("book_isbn", isbn)
      .order("price", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Get book metadata for enriched info
    const { data: book } = await supabase
      .from("books")
      .select("title, author, publisher, pages, published_date, genre, goodreads_rating, goodreads_url, storygraph_url, amazon_url, format")
      .eq("isbn", isbn)
      .single();

    // Group prices by condition
    const grouped: Record<string, any[]> = { new: [], used: [], ebook: [], audiobook: [] };
    for (const p of allPrices || []) {
      const cond = (p.condition || "new").toLowerCase();
      if (grouped[cond]) {
        grouped[cond].push({
          ...p,
          discount: p.msrp && p.msrp > p.price ? Math.round((1 - p.price / p.msrp) * 100) : null,
        });
      }
    }

    return NextResponse.json({
      book: book || null,
      sections: {
        "New Books": grouped.new || [],
        "Used Books": grouped.used || [],
        "Ebooks": grouped.ebook || [],
        "Audiobooks": grouped.audiobook || [],
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}