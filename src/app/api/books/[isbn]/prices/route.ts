import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ isbn: string }> }
) {
  const { isbn } = await params;

  try {
    const { data: prices, error } = await supabase
      .from("prices")
      .select("store_name, price, currency, condition, url, scraped_at")
      .eq("book_isbn", isbn)
      .order("price", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get historical low from price_history
    const { data: history } = await supabase
      .from("price_history")
      .select("price")
      .eq("book_isbn", isbn)
      .order("price", { ascending: true })
      .limit(1);

    const historicalLow = history?.[0]?.price ?? null;

    return NextResponse.json({ prices, historicalLow });
  } catch {
    return NextResponse.json({ error: "Failed to fetch prices" }, { status: 500 });
  }
}