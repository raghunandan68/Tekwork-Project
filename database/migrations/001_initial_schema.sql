-- ============================================================================
-- Smart Shelf AI — Initial Schema Migration
-- Run this in Supabase SQL Editor (or via supabase db push)
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. TABLES
-- ============================================================================

-- Categories lookup (shared across all users)
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sold INTEGER NOT NULL DEFAULT 0 CHECK (sold >= 0),
  status VARCHAR(50) NOT NULL DEFAULT 'Active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id VARCHAR(50) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  status VARCHAR(50) NOT NULL DEFAULT 'Completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, transaction_id)
);

-- Transaction Items (join table)
CREATE TABLE IF NOT EXISTS transaction_items (
  id SERIAL PRIMARY KEY,
  transaction_id INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0)
);

-- Association Rules (market basket analysis results)
CREATE TABLE IF NOT EXISTS association_rules (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  antecedent VARCHAR(255) NOT NULL,
  consequent VARCHAR(255) NOT NULL,
  support NUMERIC(5,4) NOT NULL CHECK (support >= 0 AND support <= 1),
  confidence NUMERIC(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  lift NUMERIC(5,2) NOT NULL CHECK (lift >= 0),
  strength VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Shelf Zones
CREATE TABLE IF NOT EXISTS shelf_zones (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  zone_name VARCHAR(255) NOT NULL,
  color VARCHAR(20) NOT NULL,
  bg_color VARCHAR(20) NOT NULL,
  icon VARCHAR(10) NOT NULL,
  description TEXT,
  avg_sales INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Shelf Zone Products (which products are in which zone)
CREATE TABLE IF NOT EXISTS shelf_zone_products (
  id SERIAL PRIMARY KEY,
  zone_id INTEGER NOT NULL REFERENCES shelf_zones(id) ON DELETE CASCADE,
  product_name VARCHAR(255) NOT NULL,
  position INTEGER NOT NULL DEFAULT 0
);

-- Restock Recommendations
CREATE TABLE IF NOT EXISTS restock_recommendations (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name VARCHAR(255) NOT NULL,
  current_stock INTEGER NOT NULL CHECK (current_stock >= 0),
  avg_daily_sales NUMERIC(10,2) NOT NULL CHECK (avg_daily_sales >= 0),
  days_left NUMERIC(10,2) NOT NULL,
  priority VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sales Trends (monthly aggregation)
CREATE TABLE IF NOT EXISTS sales_trends (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month VARCHAR(10) NOT NULL,
  year INTEGER NOT NULL CHECK (year > 2000),
  sales NUMERIC(12,2) NOT NULL CHECK (sales >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, month, year)
);

-- ============================================================================
-- 2. INDEXES
-- ============================================================================

-- user_id indexes for fast tenant-scoped queries
CREATE INDEX IF NOT EXISTS idx_products_user_id         ON products (user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id     ON transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_association_rules_user_id ON association_rules (user_id);
CREATE INDEX IF NOT EXISTS idx_shelf_zones_user_id      ON shelf_zones (user_id);
CREATE INDEX IF NOT EXISTS idx_restock_recommendations_user_id ON restock_recommendations (user_id);
CREATE INDEX IF NOT EXISTS idx_sales_trends_user_id     ON sales_trends (user_id);

-- Additional useful indexes
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_id ON transactions (transaction_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date           ON transactions (date);
CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id ON transaction_items (transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_product_id     ON transaction_items (product_id);
CREATE INDEX IF NOT EXISTS idx_products_category               ON products (category);
CREATE INDEX IF NOT EXISTS idx_products_status                 ON products (status);
CREATE INDEX IF NOT EXISTS idx_shelf_zone_products_zone_id     ON shelf_zone_products (zone_id);

-- ============================================================================
-- 3. TRIGGER: auto-update updated_at on products
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- ---- categories (public read, insert for authenticated) --------------------
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_select_all"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "categories_insert_authenticated"
  ON categories FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ---- products --------------------------------------------------------------
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_select_own"
  ON products FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "products_insert_own"
  ON products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "products_update_own"
  ON products FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "products_delete_own"
  ON products FOR DELETE
  USING (auth.uid() = user_id);

-- ---- transactions ----------------------------------------------------------
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_select_own"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "transactions_insert_own"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transactions_update_own"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transactions_delete_own"
  ON transactions FOR DELETE
  USING (auth.uid() = user_id);

-- ---- transaction_items (secured via parent transaction) --------------------
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transaction_items_select_own"
  ON transaction_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM transactions t
      WHERE t.id = transaction_items.transaction_id
        AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "transaction_items_insert_own"
  ON transaction_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transactions t
      WHERE t.id = transaction_items.transaction_id
        AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "transaction_items_update_own"
  ON transaction_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM transactions t
      WHERE t.id = transaction_items.transaction_id
        AND t.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transactions t
      WHERE t.id = transaction_items.transaction_id
        AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "transaction_items_delete_own"
  ON transaction_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM transactions t
      WHERE t.id = transaction_items.transaction_id
        AND t.user_id = auth.uid()
    )
  );

-- ---- association_rules -----------------------------------------------------
ALTER TABLE association_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "association_rules_select_own"
  ON association_rules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "association_rules_insert_own"
  ON association_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "association_rules_update_own"
  ON association_rules FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "association_rules_delete_own"
  ON association_rules FOR DELETE
  USING (auth.uid() = user_id);

-- ---- shelf_zones -----------------------------------------------------------
ALTER TABLE shelf_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shelf_zones_select_own"
  ON shelf_zones FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "shelf_zones_insert_own"
  ON shelf_zones FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "shelf_zones_update_own"
  ON shelf_zones FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "shelf_zones_delete_own"
  ON shelf_zones FOR DELETE
  USING (auth.uid() = user_id);

-- ---- shelf_zone_products (secured via parent zone) -------------------------
ALTER TABLE shelf_zone_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shelf_zone_products_select_own"
  ON shelf_zone_products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shelf_zones sz
      WHERE sz.id = shelf_zone_products.zone_id
        AND sz.user_id = auth.uid()
    )
  );

CREATE POLICY "shelf_zone_products_insert_own"
  ON shelf_zone_products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shelf_zones sz
      WHERE sz.id = shelf_zone_products.zone_id
        AND sz.user_id = auth.uid()
    )
  );

CREATE POLICY "shelf_zone_products_update_own"
  ON shelf_zone_products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM shelf_zones sz
      WHERE sz.id = shelf_zone_products.zone_id
        AND sz.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shelf_zones sz
      WHERE sz.id = shelf_zone_products.zone_id
        AND sz.user_id = auth.uid()
    )
  );

CREATE POLICY "shelf_zone_products_delete_own"
  ON shelf_zone_products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM shelf_zones sz
      WHERE sz.id = shelf_zone_products.zone_id
        AND sz.user_id = auth.uid()
    )
  );

-- ---- restock_recommendations -----------------------------------------------
ALTER TABLE restock_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "restock_recommendations_select_own"
  ON restock_recommendations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "restock_recommendations_insert_own"
  ON restock_recommendations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "restock_recommendations_update_own"
  ON restock_recommendations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "restock_recommendations_delete_own"
  ON restock_recommendations FOR DELETE
  USING (auth.uid() = user_id);

-- ---- sales_trends ----------------------------------------------------------
ALTER TABLE sales_trends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sales_trends_select_own"
  ON sales_trends FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "sales_trends_insert_own"
  ON sales_trends FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sales_trends_update_own"
  ON sales_trends FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sales_trends_delete_own"
  ON sales_trends FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- Migration complete 🎉
-- ============================================================================
