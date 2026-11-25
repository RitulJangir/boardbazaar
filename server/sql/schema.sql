CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  company TEXT DEFAULT '',
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS billboards (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  city TEXT NOT NULL,
  locality TEXT NOT NULL,
  landmark TEXT DEFAULT '',
  width_ft NUMERIC NOT NULL,
  height_ft NUMERIC NOT NULL,
  monthly_price INTEGER NOT NULL,
  lighting TEXT NOT NULL,
  traffic TEXT NOT NULL,
  daily_impressions INTEGER DEFAULT 50000,
  min_months INTEGER DEFAULT 1,
  printing_cost INTEGER DEFAULT 12000,
  available BOOLEAN DEFAULT TRUE,
  featured BOOLEAN DEFAULT FALSE,
  verified BOOLEAN DEFAULT TRUE,
  description TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  seller_name TEXT NOT NULL,
  seller_phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  billboard_id TEXT NOT NULL REFERENCES billboards(id) ON DELETE CASCADE,
  buyer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  buyer_name TEXT NOT NULL,
  buyer_phone TEXT NOT NULL,
  company_name TEXT DEFAULT '',
  campaign_name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  months INTEGER NOT NULL,
  include_printing BOOLEAN DEFAULT FALSE,
  rent_subtotal INTEGER NOT NULL,
  printing_total INTEGER NOT NULL,
  gst_amount INTEGER NOT NULL,
  grand_total INTEGER NOT NULL,
  status TEXT DEFAULT 'Pending',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS favorites (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  billboard_id TEXT NOT NULL REFERENCES billboards(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, billboard_id)
);

CREATE INDEX IF NOT EXISTS idx_billboards_city ON billboards(city);
CREATE INDEX IF NOT EXISTS idx_billboards_category ON billboards(category);
CREATE INDEX IF NOT EXISTS idx_billboards_price ON billboards(monthly_price);
CREATE INDEX IF NOT EXISTS idx_bookings_buyer ON bookings(buyer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_seller ON bookings(seller_id);
