"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Book } from "@/lib/types";

export default function BookPage({ params }: { params: Promise<{ isbn: string }> }) {
  const { isbn } = use(params);
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      })
      .finally(() => setLoading(false));
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
          <button onClick={() => router.back()} className="text-zinc-400 hover:text-white transition-colors mr-4">
            ← Back
          </button>
          <button onClick={() => router.push("/")} className="text-xl font-bold text-emerald-400 hover:text-emerald-300 transition-colors">
            📚 BookDeals
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Cover */}
          <div className="flex-shrink-0 w-48 mx-auto md:mx-0">
            <div className="aspect-[2/3] relative rounded-xl overflow-hidden bg-zinc-800 shadow-2xl">
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
              <p className="text-zinc-400 leading-relaxed text-sm line-clamp-6">{book.description}</p>
            )}

            {/* Price comparison placeholder */}
            <div className="mt-8 p-6 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
              <h3 className="text-lg font-semibold mb-4">💰 Price Comparison</h3>
              <p className="text-zinc-500 text-sm">
                Price data coming soon — our scraper will pull live prices from Amazon, Indigo, Book Outlet, and more.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}