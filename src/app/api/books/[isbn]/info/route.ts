import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ isbn: string }> }
) {
  const { isbn } = await params;

  try {
    const { data: book, error } = await supabase
      .from("books")
      .select("isbn, title, author, cover_url, description, publisher, pages, published_date")
      .eq("isbn", isbn)
      .single();

    if (error || !book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    return NextResponse.json(book);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}