export interface Book {
  isbn: string;
  title: string;
  author: string;
  cover_url: string;
  description: string;
  publisher: string;
  pages: number;
  published_date: string;
}

export interface Price {
  id?: number;
  book_isbn: string;
  store_name: string;
  price: number;
  currency: string;
  condition: "new" | "used" | "ebook" | "audiobook";
  url: string;
  scraped_at?: string;
}

export interface PriceHistory {
  id?: number;
  book_isbn: string;
  store_name: string;
  price: number;
  currency: string;
  condition: string;
  recorded_at: string;
}

export interface BookWithPrices extends Book {
  prices: Price[];
  lowest_price: number | null;
  historical_low: number | null;
}