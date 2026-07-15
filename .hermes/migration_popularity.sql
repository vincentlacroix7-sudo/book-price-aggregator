-- Migration: add popularity tracking
CREATE TABLE IF NOT EXISTS book_popularity (
  isbn TEXT PRIMARY KEY REFERENCES books(isbn) ON DELETE CASCADE,
  search_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  last_searched_at TIMESTAMPTZ,
  score INTEGER GENERATED ALWAYS AS (search_count * 2 + click_count * 5) STORED
);

CREATE INDEX IF NOT EXISTS idx_popularity_score ON book_popularity(score DESC);

-- RPC function to increment search count
CREATE OR REPLACE FUNCTION increment_search(p_isbn TEXT)
RETURNS void AS $$
BEGIN
  INSERT INTO book_popularity (isbn, search_count, last_searched_at)
  VALUES (p_isbn, 1, NOW())
  ON CONFLICT (isbn)
  DO UPDATE SET
    search_count = book_popularity.search_count + 1,
    last_searched_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- RPC function to increment click count
CREATE OR REPLACE FUNCTION increment_click(p_isbn TEXT)
RETURNS void AS $$
BEGIN
  INSERT INTO book_popularity (isbn, click_count, last_searched_at)
  VALUES (p_isbn, 1, NOW())
  ON CONFLICT (isbn)
  DO UPDATE SET
    click_count = book_popularity.click_count + 1,
    last_searched_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Everyone can read popularity data
ALTER TABLE book_popularity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read popularity" ON book_popularity FOR SELECT USING (true);