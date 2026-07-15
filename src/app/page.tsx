"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

// Mock data — will be replaced by Supabase queries once scraper is live
const BEST_DEALS = [
  { isbn: "9780735211292", title: "Atomic Habits", author: "James Clear", cover: "http://books.google.com/books/content?id=XfFvDwAAQBAJ&printsec=frontcover&img=1&zoom=5", store: "Amazon", price: 12.99, oldPrice: 24.00, condition: "new" },
  { isbn: "9781982137274", title: "The 48 Laws of Power", author: "Robert Greene", cover: "http://books.google.com/books/content?id=LlHeEAAAQBAJ&printsec=frontcover&img=1&zoom=5", store: "Indigo", price: 18.50, oldPrice: 35.00, condition: "new" },
  { isbn: "9780062316097", title: "Sapiens", author: "Yuval Noah Harari", cover: "http://books.google.com/books/content?id=1EiSDQAAQBAJ&printsec=frontcover&img=1&zoom=5", store: "Book Outlet", price: 9.99, oldPrice: 27.99, condition: "new" },
  { isbn: "9780385545969", title: "The Midnight Library", author: "Matt Haig", cover: "http://books.google.com/books/content?id=7m0MEAAAQBAJ&printsec=frontcover&img=1&zoom=5", store: "Amazon", price: 14.99, oldPrice: 26.00, condition: "used" },
  { isbn: "9781250277732", title: "Project Hail Mary", author: "Andy Weir", cover: "http://books.google.com/books/content?id=3zUAEAAAQBAJ&printsec=frontcover&img=1&zoom=5", store: "AbeBooks", price: 11.25, oldPrice: 22.99, condition: "new" },
  { isbn: "9780441013593", title: "Dune", author: "Frank Herbert", cover: "http://books.google.com/books/content?id=B1hZAAAAYAAJ&printsec=frontcover&img=1&zoom=5", store: "Amazon", price: 8.99, oldPrice: 19.99, condition: "new" },
];

const HISTORICAL_LOWS = [
  { isbn: "9780316017930", title: "The Tipping Point", author: "Malcolm Gladwell", cover: "http://books.google.com/books/content?id=9bcdAAAAMBAJ&printsec=frontcover&img=1&zoom=5", store: "Book Outlet", price: 6.99, lowest: 6.99 },
  { isbn: "9780385480017", title: "Into the Wild", author: "Jon Krakauer", cover: "http://books.google.com/books/content?id=Qd0_AAAAQBAJ&printsec=frontcover&img=1&zoom=5", store: "Amazon", price: 7.50, lowest: 7.50 },
  { isbn: "9780143126560", title: "Thinking, Fast and Slow", author: "Daniel Kahneman", cover: "http://books.google.com/books/content?id=ZuKTvERuPG8C&printsec=frontcover&img=1&zoom=5", store: "Better World Books", price: 9.25, lowest: 9.25 },
  { isbn: "9781501127625", title: "Shoe Dog", author: "Phil Knight", cover: "http://books.google.com/books/content?id=ZtUeCgAAQBAJ&printsec=frontcover&img=1&zoom=5", store: "AbeBooks", price: 5.99, lowest: 5.99 },
  { isbn: "9780812981605", title: "Educated", author: "Tara Westover", cover: "http://books.google.com/books/content?id=2ObVDgAAQBAJ&printsec=frontcover&img=1&zoom=5", store: "Indigo", price: 10.99, lowest: 10.99 },
  { isbn: "9780307277671", title: "The Road", author: "Cormac McCarthy", cover: "http://books.google.com/books/content?id=PFIb0z3CqF4C&printsec=frontcover&img=1&zoom=5", store: "Amazon", price: 8.49, lowest: 8.49 },
];

const STORE_LOGOS: Record<string, string> = {
  Amazon: "🅰️",
  Indigo: "🟣",
  "Book Outlet": "🟠",
  AbeBooks: "🔵",
  "Better World Books": "🟢",
};

function BookCard({ book, badge, badgeColor }: { book: any; badge?: string; badgeColor?: string }) {
  const savings = book.oldPrice ? Math.round((1 - book.price / book.oldPrice) * 100) : null;

  return (
    <div className="group relative bg-zinc-800/50 hover:bg-zinc-800 rounded-xl border border-zinc-700/50 hover:border-zinc-600 transition-all overflow-hidden cursor-pointer">
      {badge && (
        <div className={`absolute top-2 left-2 z-10 px-2 py-0.5 rounded text-xs font-bold ${badgeColor}`}>
          {badge}
        </div>
      )}
      <div className="aspect-[2/3] relative bg-zinc-900">
        <Image
          src={book.cover}
          alt={book.title}
          fill
          className="object-cover"
          sizes="200px"
        />
      </div>
      <div className="p-3 space-y-1.5">
        <p className="text-sm font-medium text-white line-clamp-1">{book.title}</p>
        <p className="text-xs text-zinc-400 line-clamp-1">{book.author}</p>
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">{STORE_LOGOS[book.store] || "⬜"}</span>
            <span className="text-xs text-zinc-500">{book.store}</span>
          </div>
          <div className="text-right">
            {savings && (
              <span className="text-xs text-emerald-400 font-medium block">-{savings}%</span>
            )}
            <span className="text-lg font-bold text-white">${book.price.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState("");

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
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-colors"
            >
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {BEST_DEALS.map((book) => (
            <BookCard key={book.isbn} book={book} badge={`-${Math.round((1 - book.price / book.oldPrice) * 100)}%`} badgeColor="bg-emerald-500 text-white" />
          ))}
        </div>
      </section>

      {/* Historical Lows */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">📉</span>
          <h2 className="text-2xl font-bold">Historical Lows</h2>
          <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-medium">Lowest Ever</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {HISTORICAL_LOWS.map((book) => (
            <BookCard key={book.isbn} book={book} badge="LOWEST" badgeColor="bg-amber-500 text-white" />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 text-center text-sm text-zinc-600">
        <p>Prices updated daily. We may earn a commission on purchases made through our links.</p>
      </footer>
    </div>
  );
}