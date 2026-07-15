-- Books table: stores book metadata from Google Books API
CREATE TABLE books (
  isbn TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT,
  cover_url TEXT,
  description TEXT,
  publisher TEXT,
  pages INTEGER,
  published_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prices table: current prices from each store
CREATE TABLE prices (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  book_isbn TEXT REFERENCES books(isbn) ON DELETE CASCADE,
  store_name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'CAD',
  condition TEXT CHECK (condition IN ('new', 'used', 'ebook', 'audiobook')),
  url TEXT NOT NULL,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(book_isbn, store_name, condition)
);

-- Price history: track price changes over time
CREATE TABLE price_history (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  book_isbn TEXT REFERENCES books(isbn) ON DELETE CASCADE,
  store_name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'CAD',
  condition TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_prices_book ON prices(book_isbn);
CREATE INDEX idx_prices_store ON prices(store_name);
CREATE INDEX idx_price_history_book ON price_history(book_isbn);
CREATE INDEX idx_price_history_date ON price_history(recorded_at);
CREATE INDEX idx_books_title ON books(title);

-- Enable RLS but allow public read (prices and books are public data)
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Everyone can read books, prices, and history
CREATE POLICY "Public read books" ON books FOR SELECT USING (true);
CREATE POLICY "Public read prices" ON prices FOR SELECT USING (true);
CREATE POLICY "Public read price_history" ON price_history FOR SELECT USING (true);