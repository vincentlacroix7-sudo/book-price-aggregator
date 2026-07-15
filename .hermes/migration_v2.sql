-- Add rich book metadata columns
ALTER TABLE books ADD COLUMN IF NOT EXISTS format TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS genre TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS goodreads_rating DECIMAL(3,2);
ALTER TABLE books ADD COLUMN IF NOT EXISTS goodreads_url TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS storygraph_url TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS amazon_url TEXT;

-- Add MSRP for discount calculation + format tracking per price
ALTER TABLE prices ADD COLUMN IF NOT EXISTS msrp DECIMAL(10,2);
ALTER TABLE prices ADD COLUMN IF NOT EXISTS format TEXT;