import { NextResponse } from "next/server";

// Inline scraping logic (same as Python scrapers but in TypeScript for real-time use)
async function scrapeAmazon(isbn: string): Promise<{ price: number; condition: string; url: string } | null> {
  try {
    const clean = isbn.replace(/-/g, "");
    const url = `https://www.amazon.ca/s?k=${clean}&i=stripbooks`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept-Language": "en-CA,en;q=0.9",
      },
      signal: AbortSignal.timeout(8000),
    });
    const html = await res.text();
    const matches = html.match(/\$(\d+\.?\d*)/g);
    if (!matches) return null;
    const prices = matches
      .map((m) => parseFloat(m.replace("$", "")))
      .filter((p) => p > 5 && p < 200);
    if (prices.length === 0) return null;
    // Find product URL
    const urlMatch = html.match(/href="(\/dp\/\d+[^"]*)"/);
    const productUrl = urlMatch ? `https://www.amazon.ca${urlMatch[1]}` : url;
    return { price: prices[0], condition: "new", url: productUrl };
  } catch {
    return null;
  }
}

async function scrapeIndigo(isbn: string): Promise<{ price: number; condition: string; url: string } | null> {
  try {
    const clean = isbn.replace(/-/g, "");
    const url = `https://www.indigo.ca/en-ca/search/?q=${clean}&searchType=products`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept-Language": "en-CA,en;q=0.9",
      },
      signal: AbortSignal.timeout(8000),
    });
    const html = await res.text();
    const matches = html.match(/\$(\d+\.?\d*)/g);
    if (!matches) return null;
    const prices = matches
      .map((m) => parseFloat(m.replace("$", "")))
      .filter((p) => p > 5 && p < 200);
    if (prices.length === 0) return null;
    return { price: prices[0], condition: "new", url };
  } catch {
    return null;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ isbn: string }> }
) {
  const { isbn } = await params;

  // Scrape all stores in parallel
  const [amazon, indigo] = await Promise.all([
    scrapeAmazon(isbn),
    scrapeIndigo(isbn),
  ]);

  const prices: any[] = [];
  if (amazon) prices.push({ store_name: "Amazon", ...amazon, currency: "CAD" });
  if (indigo) prices.push({ store_name: "Indigo", ...indigo, currency: "CAD" });

  return NextResponse.json({ prices, isbn });
}