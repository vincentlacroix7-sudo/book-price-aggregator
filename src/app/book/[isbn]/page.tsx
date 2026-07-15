"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

interface BookMeta {
  title: string; author: string; publisher: string; pages: number;
  published_date: string; genre: string; goodreads_rating: number;
  goodreads_url: string; storygraph_url: string; amazon_url: string; format: string;
}

interface StorePrice {
  store_name: string; price: number; msrp: number | null; currency: string;
  condition: string; format: string; url: string; discount: number | null;
}

const STORE_CONFIG: Record<string, { logo: string; color: string; baseUrl: string; buildUrl: (isbn: string) => string }> = {
  Amazon: {
    logo: "🅰️", color: "border-amber-500/30 hover:border-amber-500",
    baseUrl: "https://www.amazon.ca",
    buildUrl: (isbn) => `https://www.amazon.ca/dp/${isbn.replace(/-/g, "")}?tag=bookpricechec-20`,
  },
  Indigo: {
    logo: "🟣", color: "border-purple-500/30 hover:border-purple-500",
    baseUrl: "https://www.indigo.ca",
    buildUrl: (isbn) => `https://www.indigo.ca/en-ca/search/?q=${isbn.replace(/-/g, "")}&searchType=products`,
  },
  AbeBooks: {
    logo: "🔵", color: "border-blue-500/30 hover:border-blue-500",
    baseUrl: "https://www.abebooks.com",
    buildUrl: (isbn) => `https://www.abebooks.com/servlet/SearchResults?isbn=${isbn.replace(/-/g, "")}&sortby=17`,
  },
};

export default function BookPage({ params }: { params: Promise<{ isbn: string }> }) {
  const { isbn } = use(params);
  const router = useRouter();
  const [meta, setMeta] = useState<BookMeta | null>(null);
  const [sections, setSections] = useState<Record<string, StorePrice[]>>({});
  const [coverUrl, setCoverUrl] = useState(`https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    fetch(`/api/books/${isbn}/prices`)
      .then((r) => r.json())
      .then((data) => {
        setMeta(data.book);
        setSections(data.sections || {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isbn]);

  useEffect(() => {
    if (imgError) {
      fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`)
        .then((r) => r.json())
        .then((d) => {
          const cover = d.items?.[0]?.volumeInfo?.imageLinks?.thumbnail?.replace("http:", "https:");
          if (cover) setCoverUrl(cover);
        }).catch(() => {});
    }
  }, [imgError, isbn]);

  if (loading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" /></div>;

  // Build store links
  const storeLinks = Object.entries(STORE_CONFIG).map(([name, cfg]) => ({
    name, url: cfg.buildUrl(isbn), logo: cfg.logo, color: cfg.color,
  }));

  // Get scraped prices per store
  const getStorePrices = (store: string) => {
    const all: StorePrice[] = [];
    Object.values(sections).forEach((prices) => {
      prices.filter((p) => p.store_name === store).forEach((p) => all.push(p));
    });
    return all;
  };

  const Stars = ({ rating }: { rating: number }) => (
    <span className="inline-flex items-center gap-0.5 text-amber-400">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className="text-xs">{star <= Math.round(rating) ? "★" : "☆"}</span>
      ))}
      <span className="text-xs text-zinc-500 ml-1">{rating.toFixed(1)}</span>
    </span>
  );

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => router.back()} className="text-zinc-400 hover:text-white text-sm flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg> Back
          </button>
          <button onClick={() => router.push("/")} className="text-lg font-bold text-emerald-400 hover:text-emerald-300">📚 BookDeals</button>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          <div className="flex-shrink-0 w-44 mx-auto md:mx-0">
            <div className="relative rounded-xl overflow-hidden bg-zinc-800 shadow-2xl" style={{ paddingBottom: "150%" }}>
              {!imgError ? (
                <img src={coverUrl} alt={meta?.title || isbn} className="absolute inset-0 w-full h-full object-cover" onError={() => setImgError(true)} />
              ) : (
                <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-700 p-4">
                  <span className="text-zinc-500 text-xs text-center">{meta?.title || isbn}</span>
                </div>
              )}
            </div>
            {meta?.goodreads_rating && (
              <div className="mt-2 text-center"><Stars rating={meta.goodreads_rating} /></div>
            )}
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold leading-tight">{meta?.title || isbn}</h1>
              {meta?.author && meta.author !== "—" && <p className="text-lg text-zinc-400 mt-1">by {meta.author}</p>}
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
              {meta?.published_date && <span>📅 {meta.published_date}</span>}
              {meta?.publisher && <span>📘 {meta.publisher}</span>}
              {(meta?.pages ?? 0) > 0 && <span>📄 {meta?.pages} pages</span>}
              {meta?.genre && <span>🏷️ {meta.genre}</span>}
              <span className="text-zinc-600">ISBN: {isbn}</span>
            </div>

            <div className="flex gap-2 text-xs">
              {meta?.goodreads_url && <a href={meta.goodreads_url} target="_blank" rel="noopener" className="text-amber-400 hover:text-amber-300 bg-amber-400/10 px-2.5 py-1 rounded-full">⭐ Goodreads</a>}
              {meta?.storygraph_url && <a href={meta.storygraph_url} target="_blank" rel="noopener" className="text-purple-400 hover:text-purple-300 bg-purple-400/10 px-2.5 py-1 rounded-full">📊 StoryGraph</a>}
              <a href={`https://openlibrary.org/isbn/${isbn}`} target="_blank" rel="noopener" className="text-zinc-500 hover:text-zinc-400 bg-zinc-800 px-2.5 py-1 rounded-full">📖 OpenLibrary</a>
            </div>
          </div>
        </div>

        {/* Store Links — always visible, scraped prices shown when available */}
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          💰 Where to Buy
        </h3>

        <div className="space-y-2">
          {storeLinks.map((store) => {
            const prices = getStorePrices(store.name);
            const cheapest = prices.length > 0 ? Math.min(...prices.map((p) => p.price)) : null;

            return (
              <a key={store.name} href={store.url} target="_blank" rel="noopener noreferrer"
                className={`flex items-center justify-between p-3.5 bg-zinc-800/50 rounded-xl border transition-all group ${store.color} ${cheapest ? "ring-1 ring-emerald-500/50" : ""}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xl">{store.logo}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">{store.name}</p>
                    {cheapest ? (
                      <p className="text-xs text-emerald-400">Best price scraped</p>
                    ) : (
                      <p className="text-xs text-zinc-500">Click to see current price</p>
                    )}
                  </div>
                </div>
                <div className="text-right flex items-center gap-3 flex-shrink-0">
                  {cheapest ? (
                    <div>
                      <span className="text-[9px] text-emerald-400 font-semibold block">BEST</span>
                      <p className="text-lg font-bold text-emerald-400">${cheapest.toFixed(2)}</p>
                    </div>
                  ) : (
                    <span className="text-sm font-medium text-white bg-zinc-700 px-3 py-1 rounded-lg group-hover:bg-zinc-600 transition-colors">
                      View deal →
                    </span>
                  )}
                  <svg className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </div>
              </a>
            );
          })}
        </div>

        {/* Scraped price details (when available) */}
        {Object.entries(sections).filter(([_, prices]) => prices.length > 0).length > 0 && (
          <div className="mt-8">
            <h3 className="text-base font-semibold mb-3 text-zinc-400">📊 Detailed price history</h3>
            {Object.entries(sections).map(([sectionName, prices]) => {
              if (prices.length === 0) return null;
              const sectionBest = Math.min(...prices.map((p) => p.price));
              return (
                <div key={sectionName} className="mb-4">
                  <p className="text-xs text-zinc-500 mb-2">{sectionName} · best: ${sectionBest.toFixed(2)}</p>
                  <div className="space-y-1">
                    {prices.map((p, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-zinc-800/30 rounded text-xs">
                        <span className="text-zinc-400">{STORE_CONFIG[p.store_name]?.logo} {p.store_name} · {p.condition}</span>
                        <span className="text-white font-medium">${p.price.toFixed(2)} {p.msrp && p.msrp > p.price ? `(was $${p.msrp.toFixed(2)})` : ""}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}