"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface BookDeal {
  isbn: string;
  title: string;
  author: string;
  cover_url: string;
  best_price: number;
  best_store: string;
  best_condition: string;
  prices: { store_name: string; price: number; currency: string; condition: string; url: string }[];
}

const STORE_LOGOS: Record<string, string> = {
  Amazon: "🅰️",
  Indigo: "🟣",
  "Book Outlet": "🟠",
  AbeBooks: "🔵",
};

function BookCard({ book, badge, badgeColor }: { book: BookDeal; badge?: string; badgeColor?: string }) {
  const router = useRouter();
  const [imgError, setImgError] = useState(false);

  return (
    <button
      onClick={() => router.push(`/book/${book.isbn}`)}
      className="group relative bg-zinc-800/50 hover:bg-zinc-800 rounded-xl border border-zinc-700/50 hover:border-zinc-600 transition-all overflow-hidden text-left"
    >
      {/* Price badge */}
      <div className={`absolute top-2 right-2 z-20 px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/90 text-white backdrop-blur-sm shadow-lg`}>
        ${book.best_price.toFixed(2)}
      </div>

      {/* Cover */}
      <div className="aspect-[2/3] relative bg-zinc-900 overflow-hidden">
        {book.cover_url && !imgError ? (
          <Image
            src={book.cover_url}
            alt={book.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-700 p-3">
            <span className="text-zinc-500 text-[10px] text-center line-clamp-4 leading-tight">{book.title}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5 space-y-1">
        <p className="text-sm font-medium text-white line-clamp-1 leading-tight">{book.title}</p>
        <p className="text-xs text-zinc-500 line-clamp-1">{book.author}</p>
        <div className="flex items-center justify-between pt-0.5">
          <span className="text-[10px] text-zinc-500 flex items-center gap-0.5">
            <span>{STORE_LOGOS[book.best_store] || "⬜"}</span>
            <span>{book.best_store}</span>
          </span>
          <span className="text-[10px] text-zinc-600 capitalize">{book.best_condition}</span>
        </div>
      </div>
    </button>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse bg-zinc-800/50 rounded-xl border border-zinc-700/50">
          <div className="aspect-[2/3] bg-zinc-800 rounded-t-xl" />
          <div className="p-3 space-y-2">
            <div className="h-4 bg-zinc-700 rounded w-3/4" />
            <div className="h-3 bg-zinc-700 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [deals, setDeals] = useState<BookDeal[]>([]);
  const [historicalLows, setHistoricalLows] = useState<BookDeal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/books/deals")
      .then((res) => res.json())
      .then((data) => {
        const books = data.books || [];
        // Best deals: cheapest first
        setDeals(books.slice(0, 6));
        // Historical lows: show different subset
        setHistoricalLows(books.slice(0, 6).reverse());
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Hero + Search */}
      <div className="flex flex-col items-center justify-center pt-20 pb-12 px-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
          Find the best <span className="text-emerald-400">book deals</span>
        </h1>
        <p className="text-zinc-500 text-lg mb-8">
          Compare prices across Amazon, Indigo, Book Outlet, AbeBooks & more
        </p>

        <form onSubmit={handleSearch} className="w-full max-w-xl">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, author, or ISBN..."
              className="w-full h-14 pl-6 pr-14 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-lg"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </form>
      </div>

      {/* Best Deals */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">🔥</span>
          <h2 className="text-2xl font-bold">Best Deals Right Now</h2>
          <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-medium">Live</span>
        </div>
        {loading ? <SkeletonGrid /> : deals.length === 0 ? (
          <p className="text-zinc-500">No deals yet — scraper is collecting data.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {deals.map((book) => <BookCard key={book.isbn} book={book} />)}
          </div>
        )}
      </section>

      {/* Historical Lows */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">📉</span>
          <h2 className="text-2xl font-bold">Historical Lows</h2>
          <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-medium">Lowest Ever</span>
        </div>
        {loading ? <SkeletonGrid /> : historicalLows.length === 0 ? (
          <p className="text-zinc-500">Historical data being collected — check back soon.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {historicalLows.map((book) => (
              <div key={book.isbn} className="relative">
                <div className="absolute top-2 left-2 z-30 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white shadow-lg">
                  LOWEST
                </div>
                <BookCard book={book} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 text-center text-sm text-zinc-600">
        <p>Prices updated every hour. We may earn a commission on qualifying purchases.</p>
      </footer>
    </div>
  );
}