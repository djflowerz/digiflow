-- Phase 1-4 Database Schema Updates
-- Run this in Supabase SQL Editor after the main schema

-- ==================== PHASE 1: ESSENTIAL FEATURES ====================

-- Inventory alerts threshold
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 10;

-- Newsletter subscribers
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  active BOOLEAN DEFAULT true
);

-- ==================== PHASE 3: BUSINESS GROWTH ====================

-- Product Reviews & Ratings
CREATE TABLE IF NOT EXISTS reviews (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  approved BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(approved);

-- Enable RLS on reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved reviews"
  ON reviews FOR SELECT
  USING (approved = true);

CREATE POLICY "Anyone can create reviews"
  ON reviews FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can approve reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- Coupon/Discount System
CREATE TABLE IF NOT EXISTS coupons (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_purchase DECIMAL(10,2) DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coupon_usage (
  id BIGSERIAL PRIMARY KEY,
  coupon_id BIGINT REFERENCES coupons(id),
  order_id BIGINT REFERENCES orders(id),
  discount_amount DECIMAL(10,2),
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on coupons
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active coupons"
  ON coupons FOR SELECT
  USING (active = true AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "Admins can manage coupons"
  ON coupons FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- Analytics View
CREATE OR REPLACE VIEW analytics_summary AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as order_count,
  SUM(total) as revenue,
  AVG(total) as avg_order_value
FROM orders
WHERE status = 'completed'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- ==================== PHASE 4: ADVANCED FEATURES ====================

-- Customer Accounts
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_addresses (
  id BIGSERIAL PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  label TEXT,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  postal_code TEXT,
  country TEXT DEFAULT 'Kenya',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link orders to customers
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);

-- Enable RLS on customers
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own data"
  ON customers FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Customers can update own data"
  ON customers FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Customers can view own addresses"
  ON customer_addresses FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Customers can manage own addresses"
  ON customer_addresses FOR ALL
  TO authenticated
  USING (customer_id = auth.uid());

-- Wishlist
CREATE TABLE IF NOT EXISTS wishlists (
  id BIGSERIAL PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, product_id)
);

-- Enable RLS on wishlists
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can manage own wishlist"
  ON wishlists FOR ALL
  TO authenticated
  USING (customer_id = auth.uid());

-- Multi-Currency Support
CREATE TABLE IF NOT EXISTS currencies (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  symbol TEXT NOT NULL,
  exchange_rate DECIMAL(10,4) DEFAULT 1.0,
  is_default BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO currencies (code, symbol, exchange_rate, is_default) VALUES
('KES', 'KES', 1.0, true),
('USD', '$', 0.0077, false),
('EUR', '€', 0.0071, false),
('GBP', '£', 0.0061, false)
ON CONFLICT (code) DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_id ON coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_order_id ON coupon_usage(order_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id ON customer_addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_customer_id ON wishlists(customer_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON wishlists(product_id);

-- ==================== NOTES ====================
-- After running this schema:
-- 1. Create 'products' bucket in Supabase Storage (public access)
-- 2. Update exchange rates periodically via API
-- 3. Configure email service for notifications
