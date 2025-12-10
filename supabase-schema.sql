-- Supabase Database Schema
-- Run these SQL commands in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== PRODUCTS TABLE ====================
CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  old_price DECIMAL(10,2),
  category TEXT,
  subcategory TEXT,
  description TEXT,
  image TEXT,
  gallery JSONB DEFAULT '[]'::jsonb,
  stock INTEGER DEFAULT 0,
  sold INTEGER DEFAULT 0,
  visibility BOOLEAN DEFAULT true,
  variants JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== ORDERS TABLE ====================
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  total DECIMAL(10,2) NOT NULL,
  items JSONB NOT NULL,
  shipping_address JSONB DEFAULT '{}'::jsonb,
  payment_method TEXT DEFAULT 'Cash on Delivery',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== HOME SETTINGS TABLE ====================
CREATE TABLE IF NOT EXISTS home_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  hot_week INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  new_arrivals INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  most_sold INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  explore_products INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  dont_miss JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insert default home settings
INSERT INTO home_settings (id, hot_week, new_arrivals, most_sold, explore_products, dont_miss)
VALUES (
  1,
  ARRAY[]::INTEGER[],
  ARRAY[]::INTEGER[],
  ARRAY[]::INTEGER[],
  ARRAY[]::INTEGER[],
  '{"title": "Enhance Your Music Experience", "subtitle": "Don''t Miss!!", "bgImage": "assets/images/product/poster/poster-03.png", "link": "shop.html"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- ==================== ADMINS TABLE (Single Admin Mode) ====================
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  CONSTRAINT single_admin CHECK (id IS NOT NULL)
);

-- Ensure only one admin can exist
CREATE UNIQUE INDEX IF NOT EXISTS single_admin_idx ON admins ((1));

-- ==================== PAYMENTS TABLE ====================
CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
  transaction_id TEXT UNIQUE NOT NULL,
  phone_number TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'initiated',
  payment_method TEXT DEFAULT 'M-Pesa',
  initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  CONSTRAINT valid_amount CHECK (amount > 0),
  CONSTRAINT valid_phone CHECK (phone_number ~ '^254[0-9]{9}$'),
  CONSTRAINT valid_status CHECK (status IN ('initiated', 'completed', 'failed', 'cancelled'))
);

-- ==================== ROW LEVEL SECURITY (RLS) ====================

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Products: Public can read, only authenticated admins can write
CREATE POLICY "Public can view visible products"
  ON products FOR SELECT
  USING (visibility = true OR auth.role() = 'authenticated');

CREATE POLICY "Admins can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

CREATE POLICY "Admins can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

CREATE POLICY "Admins can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

-- Orders: Only authenticated admins can access
CREATE POLICY "Admins can view orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

CREATE POLICY "Anyone can create orders"
  ON orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

-- Home Settings: Public can read, only admins can write
CREATE POLICY "Public can view home settings"
  ON home_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can update home settings"
  ON home_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

-- Admins: Single admin can only view and update their own data
CREATE POLICY "Admin can view own data"
  ON admins FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admin can update own data"
  ON admins FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Payments: Only admins can view, anyone can create
CREATE POLICY "Anyone can create payments"
  ON payments FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

CREATE POLICY "Admins can update payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

-- ==================== INDEXES ====================

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_visibility ON products(visibility);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- ==================== FUNCTIONS ====================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for products table
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for home_settings table
CREATE TRIGGER update_home_settings_updated_at BEFORE UPDATE ON home_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== NOTES ====================
-- After running this schema:
-- 1. Create your first admin user via Supabase Auth UI
-- 2. Manually insert their UUID into the admins table
-- 3. They can then add other admins via the admin panel
