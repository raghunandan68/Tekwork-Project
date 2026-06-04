-- ============================================================================
-- PATCH: Fix the transactions unique constraint to be scoped per user
-- Run this in Supabase SQL Editor BEFORE trying "Load Demo Data" again
-- ============================================================================

-- Step 1: Drop the old global unique constraint on transaction_id
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_transaction_id_key;

-- Step 2: Add a new per-user unique constraint (same transaction ID allowed across different users)
ALTER TABLE transactions ADD CONSTRAINT transactions_user_transaction_unique UNIQUE (user_id, transaction_id);

-- Step 3: Replace the seed function with the fixed version that uses ON CONFLICT DO NOTHING
CREATE OR REPLACE FUNCTION clear_demo_data(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  DELETE FROM restock_recommendations WHERE user_id = p_user_id;
  DELETE FROM association_rules        WHERE user_id = p_user_id;
  DELETE FROM sales_trends             WHERE user_id = p_user_id;
  DELETE FROM shelf_zones              WHERE user_id = p_user_id;
  DELETE FROM transactions             WHERE user_id = p_user_id;
  DELETE FROM products                 WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION seed_demo_data(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_txn_id   INTEGER;
  v_zone_id  INTEGER;
BEGIN
  -- Clear any previous demo data for this user
  PERFORM clear_demo_data(p_user_id);

  INSERT INTO categories (name) VALUES
    ('Bakery'), ('Dairy'), ('Snacks'), ('Beverages'),
    ('Personal Care'), ('Cleaning'), ('Condiments')
  ON CONFLICT (name) DO NOTHING;

  INSERT INTO products (user_id, name, category, price, stock, sold, status) VALUES
    (p_user_id, 'Bread',          'Bakery',        40.00,  97, 500, 'Active'),
    (p_user_id, 'Milk',           'Dairy',         55.00, 142, 480, 'Active'),
    (p_user_id, 'Butter',         'Dairy',         85.00,   5, 320, 'Low Stock'),
    (p_user_id, 'Eggs (6pk)',     'Dairy',         75.00,  88, 410, 'Active'),
    (p_user_id, 'Chips',          'Snacks',        30.00, 210, 280, 'Active'),
    (p_user_id, 'Soft Drink',     'Beverages',     45.00, 175, 300, 'Active'),
    (p_user_id, 'Shampoo',        'Personal Care',150.00,  60, 100, 'Active'),
    (p_user_id, 'Jam',            'Condiments',    95.00,   3, 220, 'Low Stock'),
    (p_user_id, 'Chocolate',      'Snacks',        60.00, 130, 260, 'Active'),
    (p_user_id, 'Conditioner',    'Personal Care',140.00,  48,  98, 'Active'),
    (p_user_id, 'Biscuits',       'Snacks',        25.00, 190, 310, 'Active'),
    (p_user_id, 'Cleaning Spray', 'Cleaning',     120.00,  35,  55, 'Active');

  INSERT INTO transactions (user_id, transaction_id, date, total, status) VALUES
    (p_user_id, 'T1001', '2025-06-01', 180.00, 'Completed'),
    (p_user_id, 'T1002', '2025-06-01', 135.00, 'Completed'),
    (p_user_id, 'T1003', '2025-06-02', 220.00, 'Completed'),
    (p_user_id, 'T1004', '2025-06-02', 195.00, 'Completed'),
    (p_user_id, 'T1005', '2025-06-03', 290.00, 'Completed'),
    (p_user_id, 'T1006', '2025-06-03',  75.00, 'Completed'),
    (p_user_id, 'T1007', '2025-06-04', 275.00, 'Completed'),
    (p_user_id, 'T1008', '2025-06-04', 135.00, 'Completed')
  ON CONFLICT (user_id, transaction_id) DO NOTHING;

  INSERT INTO transaction_items (transaction_id, product_id, product_name, quantity, price)
  SELECT t.id, p.id, p.name, 1, p.price FROM transactions t CROSS JOIN products p
  WHERE t.transaction_id = 'T1001' AND t.user_id = p_user_id AND p.user_id = p_user_id
    AND p.name IN ('Bread', 'Butter', 'Milk');

  INSERT INTO transaction_items (transaction_id, product_id, product_name, quantity, price)
  SELECT t.id, p.id, p.name, 1, p.price FROM transactions t CROSS JOIN products p
  WHERE t.transaction_id = 'T1002' AND t.user_id = p_user_id AND p.user_id = p_user_id
    AND p.name IN ('Chips', 'Soft Drink', 'Chocolate');

  INSERT INTO transaction_items (transaction_id, product_id, product_name, quantity, price)
  SELECT t.id, p.id, p.name, 1, p.price FROM transactions t CROSS JOIN products p
  WHERE t.transaction_id = 'T1003' AND t.user_id = p_user_id AND p.user_id = p_user_id
    AND p.name IN ('Bread', 'Jam', 'Butter');

  INSERT INTO transaction_items (transaction_id, product_id, product_name, quantity, price)
  SELECT t.id, p.id, p.name, 1, p.price FROM transactions t CROSS JOIN products p
  WHERE t.transaction_id = 'T1004' AND t.user_id = p_user_id AND p.user_id = p_user_id
    AND p.name IN ('Eggs (6pk)', 'Milk', 'Bread');

  INSERT INTO transaction_items (transaction_id, product_id, product_name, quantity, price)
  SELECT t.id, p.id, p.name, 1, p.price FROM transactions t CROSS JOIN products p
  WHERE t.transaction_id = 'T1005' AND t.user_id = p_user_id AND p.user_id = p_user_id
    AND p.name IN ('Shampoo', 'Conditioner');

  INSERT INTO transaction_items (transaction_id, product_id, product_name, quantity, price)
  SELECT t.id, p.id, p.name, 1, p.price FROM transactions t CROSS JOIN products p
  WHERE t.transaction_id = 'T1006' AND t.user_id = p_user_id AND p.user_id = p_user_id
    AND p.name IN ('Chips', 'Soft Drink');

  INSERT INTO transaction_items (transaction_id, product_id, product_name, quantity, price)
  SELECT t.id, p.id, p.name, 1, p.price FROM transactions t CROSS JOIN products p
  WHERE t.transaction_id = 'T1007' AND t.user_id = p_user_id AND p.user_id = p_user_id
    AND p.name IN ('Bread', 'Butter', 'Jam', 'Milk');

  INSERT INTO transaction_items (transaction_id, product_id, product_name, quantity, price)
  SELECT t.id, p.id, p.name, 1, p.price FROM transactions t CROSS JOIN products p
  WHERE t.transaction_id = 'T1008' AND t.user_id = p_user_id AND p.user_id = p_user_id
    AND p.name IN ('Chocolate', 'Biscuits', 'Soft Drink');

  INSERT INTO association_rules (user_id, antecedent, consequent, support, confidence, lift, strength) VALUES
    (p_user_id, 'Bread',     'Butter',      0.4500, 0.8200, 1.90, 'High'),
    (p_user_id, 'Bread',     'Jam',         0.3800, 0.7400, 1.70, 'High'),
    (p_user_id, 'Chips',     'Soft Drink',  0.5200, 0.8800, 2.10, 'Very High'),
    (p_user_id, 'Shampoo',   'Conditioner', 0.4100, 0.7900, 1.80, 'High'),
    (p_user_id, 'Milk',      'Eggs (6pk)', 0.3300, 0.6700, 1.40, 'Medium'),
    (p_user_id, 'Chocolate', 'Biscuits',    0.2800, 0.6100, 1.30, 'Medium');

  INSERT INTO shelf_zones (user_id, zone_name, color, bg_color, icon, description, avg_sales)
  VALUES (p_user_id, 'High-Demand Zone', '#1D9E75', '#E1F5EE', '🔥',
          'Fast-moving products — place at eye level near entrance', 478)
  RETURNING id INTO v_zone_id;
  INSERT INTO shelf_zone_products (zone_id, product_name, position) VALUES
    (v_zone_id, 'Bread', 1), (v_zone_id, 'Milk', 2),
    (v_zone_id, 'Eggs (6pk)', 3), (v_zone_id, 'Butter', 4);

  INSERT INTO shelf_zones (user_id, zone_name, color, bg_color, icon, description, avg_sales)
  VALUES (p_user_id, 'Cross-Sell Zone', '#378ADD', '#E6F1FB', '🔗',
          'Frequently bought together — group adjacent on shelves', 287)
  RETURNING id INTO v_zone_id;
  INSERT INTO shelf_zone_products (zone_id, product_name, position) VALUES
    (v_zone_id, 'Chips', 1), (v_zone_id, 'Soft Drink', 2),
    (v_zone_id, 'Chocolate', 3), (v_zone_id, 'Biscuits', 4);

  INSERT INTO shelf_zones (user_id, zone_name, color, bg_color, icon, description, avg_sales)
  VALUES (p_user_id, 'Low-Movement Zone', '#888780', '#F1EFE8', '📦',
          'Slow movers — place in secondary aisles', 77)
  RETURNING id INTO v_zone_id;
  INSERT INTO shelf_zone_products (zone_id, product_name, position) VALUES
    (v_zone_id, 'Cleaning Spray', 1), (v_zone_id, 'Stationery', 2),
    (v_zone_id, 'Conditioner', 3), (v_zone_id, 'Shampoo', 4);

  INSERT INTO restock_recommendations (user_id, product_name, current_stock, avg_daily_sales, days_left, priority) VALUES
    (p_user_id, 'Butter',  5, 10.00, 0.5, 'Critical'),
    (p_user_id, 'Jam',     3,  7.00, 0.4, 'Critical'),
    (p_user_id, 'Bread',  97, 20.00, 4.9, 'Watch'),
    (p_user_id, 'Milk',  142, 18.00, 7.9, 'Good');

  INSERT INTO sales_trends (user_id, month, year, sales) VALUES
    (p_user_id, 'Jan', 2025, 38400.00),
    (p_user_id, 'Feb', 2025, 42100.00),
    (p_user_id, 'Mar', 2025, 39800.00),
    (p_user_id, 'Apr', 2025, 47200.00),
    (p_user_id, 'May', 2025, 51600.00),
    (p_user_id, 'Jun', 2025, 54300.00)
  ON CONFLICT (user_id, month, year) DO UPDATE SET sales = EXCLUDED.sales;

  RAISE NOTICE 'Demo data seeded for user %', p_user_id;
END;
$$ LANGUAGE plpgsql;
