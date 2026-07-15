"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import type { Book } from "@/lib/types";

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    fetch(`/api/books/search?q=${encodeURIComponent(query)}`)
      .then((res) => res.json())
      .then((data) => setBooks(data.books || []))
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => router.push("/")} className="text-xl font-bold text-emerald-400 hover:text-emerald-300">
            📚 BookDeals
          </button>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const q = (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value;
              if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
            }}
            className="flex-1 max-w-lg mx-8"
          >
            <div className="relative">
              <input
                name="q"
                defaultValue={query}
                placeholder="Search by title, author, or ISBN..."
                className="w-full h-10 pl-4 pr-10 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-all text-sm"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[2/3] bg-zinc-800 rounded-xl" />
                <div className="mt-3 h-4 bg-zinc-800 rounded w-3/4" />
                <div className="mt-2 h-3 bg-zinc-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-zinc-500 text-lg">No books found for &quot;{query}&quot;</p>
            <p className="text-zinc-600 mt-2">Try a different title, author, or ISBN</p>
          </div>
        ) : (
          <>
            <p className="text-zinc-500 mb-6">
              {books.length} results for &quot;<span className="text-white">{query}</span>&quot;
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {books.map((book) => (
                <button
                  key={book.isbn}
                  onClick={() => router.push(`/book/${book.isbn}`)}
                  className="group text-left bg-zinc-800/50 hover:bg-zinc-800 rounded-xl border border-zinc-700/50 hover:border-zinc-600 transition-all overflow-hidden"
                >
                  <div className="aspect-[2/3] relative bg-zinc-900">
                    {book.cover_url ? (
                      <Image src={book.cover_url} alt={book.title} fill className="object-cover group-hover:scale-105 transition-transform" sizes="200px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600 text-4xl">📖</div>
                    )}
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="text-sm font-medium text-white line-clamp-2 group-hover:text-emerald-400 transition-colors">{book.title}</p>
                    <p className="text-xs text-zinc-500">{book.author}</p>
                    {book.published_date && <p className="text-xs text-zinc-600">{book.published_date.substring(0, 4)}</p>}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" /></div>}>
      <SearchResults />
    </Suspense>
  );
}