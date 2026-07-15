"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

interface BookData {
  isbn: string;
  title: string;
  author: string;
  cover_url: string;
  description: string;
  publisher: string;
  pages: number;
  published_date: string;
}

interface StorePrice {
  store_name: string;
  price: number;
  currency: string;
  condition: string;
  url: string;
  scraped_at: string;
}

const STORE_LOGOS: Record<string, string> = {
  Amazon: "🅰️",
  Indigo: "🟣",
  "Book Outlet": "🟠",
  AbeBooks: "🔵",
};

const STORE_COLORS: Record<string, string> = {
  Amazon: "border-amber-500/30 hover:border-amber-500",
  Indigo: "border-purple-500/30 hover:border-purple-500",
  "Book Outlet": "border-orange-500/30 hover:border-orange-500",
  AbeBooks: "border-blue-500/30 hover:border-blue-500",
};

export default function BookPage({ params }: { params: Promise<{ isbn: string }> }) {
  const { isbn } = use(params);
  const router = useRouter();
  const [book, setBook] = useState<BookData | null>(null);
  const [prices, setPrices] = useState<StorePrice[]>([]);
  const [historicalLow, setHistoricalLow] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    // Fetch prices from our Supabase API
    fetch(`/api/books/${isbn}/prices`)
      .then((res) => res.json())
      .then((data) => {
        setPrices(data.prices || []);
        setHistoricalLow(data.historicalLow);

        // If we have prices, the book is in our DB — fetch its metadata
        if (data.prices?.length > 0 || data.book) {
          return fetch(`/api/books/${isbn}/info`);
        }
        // Fallback to Google Books
        return fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
      })
      .then((res) => res?.json())
      .then((data) => {
        if (data) {
          // Handle Supabase book info response
          if (data.title) {
            setBook(data);
          }
          // Handle Google Books response
          else if (data.items?.[0]) {
            const info = data.items[0].volumeInfo;
            setBook({
              isbn,
              title: info.title || "Unknown",
              author: info.authors?.join(", ") || "Unknown",
              cover_url: info.imageLinks?.thumbnail?.replace("http:", "https:") || "",
              description: info.description || "",
              publisher: info.publisher || "",
              pages: info.pageCount || 0,
              published_date: info.publishedDate || "",
            });
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isbn]);

  // Fallback: if no book data from APIs, construct minimal from what we know
  if (!loading && !book && prices.length > 0) {
    // We have prices but no metadata — show minimal view
    const displayBook: BookData = { isbn, title: isbn, author: "ISBN lookup", cover_url: "", description: "", publisher: "", pages: 0, published_date: "" };
    return renderBook(displayBook, prices, historicalLow, loading, imgError, setImgError, router);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
        <p className="text-zinc-500 text-lg">Book not found.</p>
        <button onClick={() => router.push("/")} className="text-emerald-400 hover:text-emerald-300 text-sm">← Back to search</button>
      </div>
    );
  }

  return renderBook(book, prices, historicalLow, loading, imgError, setImgError, router);
}

function renderBook(
  book: BookData,
  prices: StorePrice[],
  historicalLow: number | null,
  _loading: boolean,
  imgError: boolean,
  setImgError: (v: boolean) => void,
  router: ReturnType<typeof useRouter>
) {
  const bestPrice = prices.length > 0 ? Math.min(...prices.map((p) => p.price)) : null;

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => router.back()} className="text-zinc-400 hover:text-white text-sm flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back
          </button>
          <button onClick={() => router.push("/")} className="text-lg font-bold text-emerald-400 hover:text-emerald-300">📚 BookDeals</button>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-shrink-0 w-48 mx-auto md:mx-0">
            <div className="relative rounded-xl overflow-hidden bg-zinc-800 shadow-2xl" style={{ paddingBottom: "150%" }}>
              {book.cover_url && !imgError ? (
                <img src={book.cover_url} alt={book.title} className="absolute inset-0 w-full h-full object-cover" onError={() => setImgError(true)} />
              ) : (
                <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-700 p-4">
                  <span className="text-zinc-500 text-sm text-center">{book.title}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold leading-tight">{book.title}</h1>
              <p className="text-lg text-zinc-400 mt-1">{book.author !== "—" ? `by ${book.author}` : ""}</p>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500">
              {book.publisher && <span>📘 {book.publisher}</span>}
              {book.published_date && <span>📅 {book.published_date}</span>}
              {book.pages > 0 && <span>📄 {book.pages} pages</span>}
              {historicalLow && <span className="text-amber-400">📉 Hist. low: ${historicalLow.toFixed(2)}</span>}
            </div>

            {book.description && <p className="text-zinc-400 leading-relaxed text-sm line-clamp-4">{book.description}</p>}

            <div className="pt-4">
              <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                💰 Compare Prices
                {bestPrice && <span className="text-xs font-normal bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">Best: ${bestPrice.toFixed(2)}</span>}
              </h3>

              {prices.length === 0 ? (
                <div className="p-6 bg-zinc-800/30 rounded-xl border border-zinc-700/50 text-center">
                  <p className="text-zinc-500 text-sm">No prices available yet.</p>
                  <p className="text-zinc-600 text-xs mt-1">Our scraper checks prices every hour. Check back soon!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {prices.map((p, i) => {
                    const isBest = p.price === bestPrice;
                    return (
                      <a key={i} href={p.url} target="_blank" rel="noopener noreferrer"
                        className={`flex items-center justify-between p-3.5 bg-zinc-800/50 rounded-xl border transition-all group ${STORE_COLORS[p.store_name] || "border-zinc-700/50 hover:border-zinc-600"} ${isBest ? "ring-1 ring-emerald-500/50" : ""}`}>
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{STORE_LOGOS[p.store_name] || "⬜"}</span>
                          <div>
                            <p className="text-sm font-medium text-white">{p.store_name}</p>
                            <p className="text-xs text-zinc-500 capitalize">{p.condition}</p>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <div>
                            {isBest && <span className="text-[10px] text-emerald-400 font-medium block">BEST</span>}
                            <p className={`text-lg font-bold ${isBest ? "text-emerald-400" : "text-white"}`}>${p.price.toFixed(2)}</p>
                            <p className="text-[10px] text-zinc-600">{p.currency}</p>
                          </div>
                          <svg className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}