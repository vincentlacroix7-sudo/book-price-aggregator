"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Deal {
  isbn: string; title: string; author: string; cover_url: string;
  best_price: number; best_store: string; best_condition: string; best_format: string;
  store_count: number;
}

const STORE_LOGOS: Record<string, string> = { Amazon: "🅰️", Indigo: "🟣", "Book Outlet": "🟠", AbeBooks: "🔵" };

export default function BrowsePage() {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"price" | "title">("price");

  useEffect(() => {
    fetch("/api/books/deals?limit=50")
      .then((r) => r.json())
      .then((data) => setDeals(data.books || []))
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...deals].sort((a, b) =>
    sort === "price" ? (a.best_price || 999) - (b.best_price || 999) : a.title.localeCompare(b.title)
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => router.push("/")} className="text-zinc-400 hover:text-white text-sm flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg> Home
          </button>
          <h1 className="text-lg font-bold text-emerald-400">📚 Browse All Deals</h1>
          <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="bg-zinc-800 border border-zinc-700 rounded-lg text-xs px-2.5 py-1.5 text-zinc-300 focus:outline-none">
            <option value="price">Sort by Price ↑</option>
            <option value="title">Sort by Title</option>
          </select>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <p className="text-sm text-zinc-500 mb-4">{deals.length} deals · updated hourly</p>

        {loading ? (
          <div className="space-y-2">{[...Array(10)].map((_, i) => <div key={i} className="h-16 bg-zinc-800/50 rounded-lg animate-pulse" />)}</div>
        ) : (
          <div className="space-y-1">
            {sorted.map((deal) => (
              <button
                key={deal.isbn}
                onClick={() => router.push(`/book/${deal.isbn}`)}
                className="w-full flex items-center gap-4 p-3 bg-zinc-800/30 hover:bg-zinc-800 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-all text-left group"
              >
                {/* Mini cover */}
                <div className="w-8 h-12 flex-shrink-0 rounded overflow-hidden bg-zinc-700">
                  {deal.cover_url ? (
                    <img src={deal.cover_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-zinc-700" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate group-hover:text-emerald-400 transition-colors">{deal.title}</p>
                  <p className="text-xs text-zinc-500 truncate">{deal.author}</p>
                </div>

                {/* Store + Price */}
                <div className="text-right flex-shrink-0">
                  <p className="text-sm text-zinc-400">
                    <span className="text-xs">{STORE_LOGOS[deal.best_store] || "⬜"}</span> {deal.best_store}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {deal.store_count || 1} store{(deal.store_count || 1) > 1 ? "s" : ""} · {deal.best_condition}
                  </p>
                </div>

                {/* Price */}
                <div className="text-right flex-shrink-0 w-20">
                  <p className="text-lg font-bold text-emerald-400">${deal.best_price?.toFixed(2)}</p>
                </div>

                <svg className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}