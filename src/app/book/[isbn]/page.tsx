"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Book } from "@/lib/types";

interface LivePrice {
  store_name: string;
  price: number;
  currency: string;
  condition: string;
  url: string;
}

const STORE_LOGOS: Record<string, string> = {
  Amazon: "🅰️",
  Indigo: "🟣",
  AbeBooks: "🔵",
};

export default function BookPage({ params }: { params: Promise<{ isbn: string }> }) {
  const { isbn } = use(params);
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [prices, setPrices] = useState<LivePrice[]>([]);
  const [scraping, setScraping] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch book metadata
    fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.items?.[0]) {
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
        setLoading(false);
      });

    // Scrape prices in real-time
    fetch(`/api/books/${isbn}/scrape`)
      .then((res) => res.json())
      .then((data) => {
        setPrices(data.prices || []);
        setScraping(false);
      })
      .catch(() => setScraping(false));
  }, [isbn]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-500">Book not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center">
          <button onClick={() => router.back()} className="text-zinc-400 hover:text-white mr-4">← Back</button>
          <button onClick={() => router.push("/")} className="text-xl font-bold text-emerald-400 hover:text-emerald-300">📚 BookDeals</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Cover */}
          <div className="flex-shrink-0 w-48 mx-auto md:mx-0">
            <div className="aspect-[2/3] relative rounded-xl overflow-hidden bg-zinc-800">
              {book.cover_url ? (
                <Image src={book.cover_url} alt={book.title} fill className="object-cover" sizes="200px" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-600 text-4xl">📖</div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 space-y-4">
            <h1 className="text-3xl font-bold">{book.title}</h1>
            <p className="text-lg text-zinc-400">by {book.author}</p>
            <div className="flex flex-wrap gap-3 text-sm text-zinc-500">
              {book.publisher && <span>📘 {book.publisher}</span>}
              {book.published_date && <span>📅 {book.published_date}</span>}
              {book.pages > 0 && <span>📄 {book.pages} pages</span>}
            </div>
            {book.description && (
              <p className="text-zinc-400 leading-relaxed text-sm line-clamp-4">{book.description}</p>
            )}

            {/* Price Comparison — Live Scraping */}
            <div className="mt-6 p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
              <h3 className="text-lg font-semibold mb-3">💰 Price Comparison</h3>

              {scraping && prices.length === 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-zinc-400">
                    <div className="animate-spin w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full" />
                    <span className="text-sm">Fetching live prices from stores...</span>
                  </div>
                  <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full animate-pulse w-2/3" />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {prices.map((p, i) => (
                    <a
                      key={i}
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-zinc-700/50 hover:bg-zinc-700 rounded-lg transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{STORE_LOGOS[p.store_name] || "⬜"}</span>
                        <div>
                          <p className="text-sm font-medium text-white">{p.store_name}</p>
                          <p className="text-xs text-zinc-500 capitalize">{p.condition}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-emerald-400">${p.price.toFixed(2)}</p>
                        <p className="text-xs text-zinc-500">{p.currency}</p>
                      </div>
                    </a>
                  ))}
                  {!scraping && prices.length === 0 && (
                    <p className="text-zinc-500 text-sm">No prices available yet. Our scraper will check this book soon.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}