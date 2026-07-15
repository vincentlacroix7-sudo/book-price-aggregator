"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

interface BookMeta { title: string; author: string; publisher: string; pages: number; published_date: string; genre: string; goodreads_rating: number; goodreads_url: string; storygraph_url: string; format: string; }
interface StorePrice { store_name: string; price: number; msrp: number | null; currency: string; condition: string; format: string; url: string; discount: number | null; scraped_at?: string; }
interface CommunityPrice { store_name: string; price: number; condition: string; submitted_at: string; }

const STORES: Record<string, { logo: string; buildUrl: (isbn: string) => string }> = {
  Amazon: { logo: "🅰️", buildUrl: (i) => `https://www.amazon.ca/dp/${i.replace(/-/g, "")}?tag=bookpricechec-20` },
  Indigo: { logo: "🟣", buildUrl: (i) => `https://www.indigo.ca/en-ca/search/?q=${i.replace(/-/g, "")}&searchType=products` },
  AbeBooks: { logo: "🔵", buildUrl: (i) => `https://www.abebooks.com/servlet/SearchResults?isbn=${i.replace(/-/g, "")}&sortby=17` },
};

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 172800) return "1 day ago";
  return `${Math.floor(seconds / 86400)}d ago`;
}

function isStale(date: string): boolean {
  return Date.now() - new Date(date).getTime() > 86400000; // > 1 day
}

export default function BookPage({ params }: { params: Promise<{ isbn: string }> }) {
  const { isbn } = use(params);
  const router = useRouter();
  const [meta, setMeta] = useState<BookMeta | null>(null);
  const [scrapedPrices, setScrapedPrices] = useState<StorePrice[]>([]);
  const [community, setCommunity] = useState<CommunityPrice[]>([]);
  const [coverUrl, setCoverUrl] = useState(`https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  // Editing state
  const [editingStore, setEditingStore] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/books/${isbn}/prices`).then((r) => r.json()),
      fetch(`/api/books/${isbn}/community-prices`).then((r) => r.json()),
    ]).then(([priceData, commData]) => {
      setMeta(priceData.book);
      // Flatten all sections into one array, keep only Amazon
      const all = Object.values(priceData.sections || {}).flat() as StorePrice[];
      setScrapedPrices(all.filter((p) => p.store_name === "Amazon"));
      setCommunity(commData.prices || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [isbn]);

  const submitPrice = async () => {
    if (!editingStore || !editPrice) return;
    setSubmitting(true);
    await fetch(`/api/books/${isbn}/community-prices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ store_name: editingStore, price: parseFloat(editPrice), condition: "new" }),
    });
    // Refresh
    const res = await fetch(`/api/books/${isbn}/community-prices`);
    const data = await res.json();
    setCommunity(data.prices || []);
    setEditingStore(null);
    setEditPrice("");
    setSubmitting(false);
  };

  const getCommunityPrice = (store: string) => community.find((c) => c.store_name === store);
  const getScrapedPrice = (store: string) => scrapedPrices.filter((p) => p.store_name === store);

  if (loading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" /></div>;

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
              {!imgError ? <img src={coverUrl} alt={meta?.title || isbn} className="absolute inset-0 w-full h-full object-cover" onError={() => setImgError(true)} />
                : <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-700 p-4"><span className="text-zinc-500 text-xs text-center">{meta?.title || isbn}</span></div>}
            </div>
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
          </div>
        </div>

        {/* Where to Buy */}
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">💰 Where to Buy</h3>
        <div className="space-y-3">
          {Object.entries(STORES).map(([name, store]) => {
            const scraped = getScrapedPrice(name);
            const comm = getCommunityPrice(name);
            const url = store.buildUrl(isbn);

            return (
              <div key={name} className="bg-zinc-800/50 rounded-xl border border-zinc-700/50 overflow-hidden">
                {/* Main row */}
                <div className="flex items-center justify-between p-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl">{store.logo}</span>
                    <div>
                      <p className="text-sm font-medium text-white">{name}</p>
                      {comm && (
                        <p className="text-[10px] text-zinc-500">
                          Community · {timeAgo(comm.submitted_at)}
                          {isStale(comm.submitted_at) && <span className="text-amber-400 ml-1">⚠️ may be outdated</span>}
                        </p>
                      )}
                      {!comm && scraped.length === 0 && (
                        <p className="text-[10px] text-zinc-600">No price data</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Price display */}
                    <div className="text-right">
                      {comm ? (
                        <>
                          <p className={`text-lg font-bold ${isStale(comm.submitted_at) ? "text-amber-400" : "text-emerald-400"}`}>
                            ${comm.price.toFixed(2)}
                          </p>
                          {scraped.length > 0 && scraped[0].msrp && scraped[0].msrp > comm.price && (
                            <p className="text-[10px] text-zinc-600 line-through">${scraped[0].msrp.toFixed(2)}</p>
                          )}
                        </>
                      ) : scraped.length > 0 ? (
                        <>
                          <p className="text-lg font-bold text-emerald-400">${Math.min(...scraped.map((s) => s.price)).toFixed(2)}</p>
                          {scraped[0].scraped_at && <p className="text-[10px] text-zinc-500">Scraped · {timeAgo(scraped[0].scraped_at)}</p>}
                        </>
                      ) : (
                        <span className="text-sm text-zinc-400">—</span>
                      )}
                    </div>

                    {/* Edit button */}
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingStore(editingStore === name ? null : name); setEditPrice(comm ? String(comm.price) : ""); }}
                      className="text-[10px] text-zinc-500 hover:text-white bg-zinc-700 hover:bg-zinc-600 px-2 py-1 rounded transition-colors"
                    >
                      ✏️ Update
                    </button>

                    {/* Visit link */}
                    <a href={url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-white bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 flex-shrink-0">
                      View <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </a>
                  </div>
                </div>

                {/* Edit form */}
                {editingStore === name && (
                  <div className="px-3.5 pb-3.5 pt-0 border-t border-zinc-700/30 mt-0">
                    <div className="flex items-center gap-2 pt-3">
                      <span className="text-sm text-zinc-400">$</span>
                      <input
                        type="number" step="0.01" min="0.01" max="500"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        placeholder="0.00"
                        className="w-24 bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-emerald-500"
                        onKeyDown={(e) => e.key === "Enter" && submitPrice()}
                      />
                      <button onClick={submitPrice} disabled={submitting || !editPrice}
                        className="text-xs bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-3 py-1 rounded transition-colors">
                        {submitting ? "Saving..." : "Save"}
                      </button>
                      <span className="text-[10px] text-zinc-500">Community price — helps everyone!</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}