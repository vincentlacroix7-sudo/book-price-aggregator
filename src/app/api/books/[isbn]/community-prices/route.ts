import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET: fetch community prices for a book
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ isbn: string }> }
) {
  const { isbn } = await params;
  try {
    const { data, error } = await supabase
      .from("community_prices")
      .select("store_name, price, condition, submitted_at")
      .eq("book_isbn", isbn);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ prices: data || [] });
  } catch {
    return NextResponse.json({ prices: [] });
  }
}

// POST: submit a community price
export async function POST(
  request: Request,
  { params }: { params: Promise<{ isbn: string }> }
) {
  const { isbn } = await params;
  try {
    const body = await request.json();
    const { store_name, price, condition } = body;

    if (!store_name || !price || price <= 0 || price > 500) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }

    const { error } = await supabase.from("community_prices").upsert({
      book_isbn: isbn,
      store_name,
      price: Math.round(price * 100) / 100,
      condition: condition || "new",
      submitted_at: new Date().toISOString(),
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}