CREATE TABLE IF NOT EXISTS community_prices (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  book_isbn TEXT REFERENCES books(isbn) ON DELETE CASCADE,
  store_name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  condition TEXT DEFAULT 'new',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(book_isbn, store_name, condition)
);

ALTER TABLE community_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read community prices" ON community_prices FOR SELECT USING (true);
CREATE POLICY "Public insert community prices" ON community_prices FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update community prices" ON community_prices FOR UPDATE USING (true);