-- ============================================================
-- KemisHouse Habesha Marketplace — Full Schema
-- Run this on a fresh Supabase project to set up prod (or dev).
--
-- ORDER OF EXECUTION:
--   1. Extensions
--   2. Types / Enums
--   3. Tables (in dependency order)
--   4. Indexes
--   5. Functions
--   6. Triggers
--   7. RLS Policies
--   8. Storage Buckets
--   9. Seed data (admin_settings only)
-- ============================================================


-- ============================================================
-- 1. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- 2. ENUMS
-- ============================================================
DO $$ BEGIN
  CREATE TYPE product_condition AS ENUM (
    'new',
    'like_new',
    'excellent',
    'good',
    'fair'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================
-- 3. TABLES
-- ============================================================

-- profiles (linked 1:1 to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT,
  full_name     TEXT,
  role          TEXT NOT NULL DEFAULT 'buyer' CHECK (role IN ('buyer', 'seller', 'admin')),
  phone         TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city          TEXT,
  state         TEXT,
  zip_code      TEXT,
  country       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

COMMENT ON TABLE  profiles IS 'User profiles for buyers, sellers, and admins.';
COMMENT ON COLUMN profiles.role IS 'User role: buyer, seller, or admin.';


-- products
CREATE TABLE IF NOT EXISTS products (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  description         TEXT,
  price               NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  quantity_available  INTEGER NOT NULL DEFAULT 1 CHECK (quantity_available >= 0),
  condition           product_condition NOT NULL DEFAULT 'new',
  size                TEXT,
  material_type       TEXT NOT NULL DEFAULT 'elastic' CHECK (material_type IN ('elastic', 'zipper')),
  designer            TEXT,
  images              JSONB NOT NULL DEFAULT '[]',
  tags                JSONB NOT NULL DEFAULT '[]',
  is_active           BOOLEAN NOT NULL DEFAULT true,
  review_status       TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected')),
  rejection_reason    TEXT,
  reviewed_at         TIMESTAMPTZ,
  reviewed_by         UUID REFERENCES profiles(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

COMMENT ON TABLE  products IS 'Habesha dress listings by sellers.';
COMMENT ON COLUMN products.material_type IS 'Waist closure type: elastic or zipper.';
COMMENT ON COLUMN products.review_status IS 'Admin review state: pending, approved, or rejected.';


-- orders
CREATE TABLE IF NOT EXISTS orders (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number                TEXT GENERATED ALWAYS AS (UPPER(SUBSTRING(id::text, 1, 8))) STORED,
  buyer_id                    UUID NOT NULL REFERENCES profiles(id),
  seller_id                   UUID NOT NULL REFERENCES profiles(id),
  subtotal                    NUMERIC(10, 2) NOT NULL,
  shipping_cost               NUMERIC(10, 2) NOT NULL DEFAULT 0,
  platform_fee                NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total                       NUMERIC(10, 2) NOT NULL,
  payment_method              TEXT NOT NULL DEFAULT 'zelle',
  payment_status              TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'verified', 'rejected')),
  payment_screenshot_url      TEXT,
  payment_verified_at         TIMESTAMPTZ,
  -- Shipping address snapshot
  shipping_address_line1      TEXT NOT NULL,
  shipping_address_line2      TEXT,
  shipping_city               TEXT NOT NULL,
  shipping_state              TEXT NOT NULL,
  shipping_zip                TEXT NOT NULL,
  shipping_country            TEXT NOT NULL DEFAULT 'US',
  -- Order status
  status                      TEXT NOT NULL DEFAULT 'pending_payment' CHECK (
                                status IN ('pending_payment', 'payment_verified', 'processing',
                                           'shipped', 'delivered', 'cancelled', 'refunded')
                              ),
  tracking_number             TEXT,
  shipped_at                  TIMESTAMPTZ,
  delivered_at                TIMESTAMPTZ,
  cancellation_reason         TEXT,
  -- Buyer Zelle info (for payment)
  buyer_zelle_name            TEXT,
  buyer_zelle_email           TEXT,
  buyer_zelle_phone           TEXT,
  -- Refund request
  refund_requested            BOOLEAN NOT NULL DEFAULT false,
  refund_request_reason       TEXT CHECK (refund_request_reason IN ('item_destroyed', 'severe_misrepresentation')),
  refund_request_description  TEXT,
  refund_requested_at         TIMESTAMPTZ,
  refund_buyer_zelle_name     TEXT,
  refund_buyer_zelle_email    TEXT,
  refund_buyer_zelle_phone    TEXT,
  refunded_at                 TIMESTAMPTZ,
  refund_notes                TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

COMMENT ON TABLE  orders IS 'Purchase orders between buyers and sellers.';
COMMENT ON COLUMN orders.order_number IS 'Human-readable ID: first 8 chars of UUID in uppercase.';
COMMENT ON COLUMN orders.platform_fee IS 'KemisHouse platform commission on this order.';
COMMENT ON COLUMN orders.refund_request_reason IS 'item_destroyed or severe_misrepresentation.';


-- order_items
CREATE TABLE IF NOT EXISTS order_items (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id       UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id     UUID REFERENCES products(id),
  product_title  TEXT NOT NULL,
  product_price  NUMERIC(10, 2) NOT NULL,
  product_image  TEXT,
  quantity       INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

COMMENT ON TABLE  order_items IS 'Snapshot of products at time of purchase.';
COMMENT ON COLUMN order_items.product_title IS 'Snapshot of title at order time (product may change later).';


-- favorites
CREATE TABLE IF NOT EXISTS favorites (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (user_id, product_id)
);

COMMENT ON TABLE favorites IS 'User wishlist / saved products.';


-- admin_settings (single-row config table)
CREATE TABLE IF NOT EXISTS admin_settings (
  id                          INTEGER PRIMARY KEY DEFAULT 1,
  email_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT single_settings_row CHECK (id = 1)
);

COMMENT ON TABLE admin_settings IS 'Global admin configuration. Always exactly one row (id=1).';


-- ============================================================
-- 4. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_seller_id          ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_review_status      ON products(review_status);
CREATE INDEX IF NOT EXISTS idx_products_is_active          ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_quantity_available ON products(quantity_available);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id             ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id            ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status               ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status       ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number         ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id        ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id           ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product_id        ON favorites(product_id);


-- ============================================================
-- 5. FUNCTIONS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

-- Reserve product quantity when order is placed (bypasses RLS)
CREATE OR REPLACE FUNCTION reserve_product(product_id UUID, quantity_to_reserve INT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  current_quantity INT;
BEGIN
  SELECT quantity_available INTO current_quantity
  FROM products WHERE id = product_id;

  IF current_quantity < quantity_to_reserve THEN
    RAISE EXCEPTION 'Not enough quantity available';
  END IF;

  UPDATE products
  SET
    quantity_available = GREATEST(0, quantity_available - quantity_to_reserve),
    is_active = CASE
      WHEN quantity_available - quantity_to_reserve <= 0 THEN FALSE
      ELSE is_active
    END,
    updated_at = NOW()
  WHERE id = product_id;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION reserve_product(UUID, INT) TO authenticated;
COMMENT ON FUNCTION reserve_product IS 'Reserves product stock when an order is placed. SECURITY DEFINER to bypass RLS.';

-- Create profile automatically after signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'buyer')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;


-- ============================================================
-- 6. TRIGGERS
-- ============================================================

-- updated_at triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at     ON profiles;
DROP TRIGGER IF EXISTS update_products_updated_at     ON products;
DROP TRIGGER IF EXISTS update_orders_updated_at       ON orders;
DROP TRIGGER IF EXISTS update_admin_settings_updated_at ON admin_settings;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON admin_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on auth signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ============================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE products      ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites     ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Helper: is the current user an admin?
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ---- profiles ----
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT USING (is_admin());

-- ---- products ----
CREATE POLICY "Public can view approved active products"
  ON products FOR SELECT
  USING (review_status = 'approved' AND is_active = true);

CREATE POLICY "Sellers can view own products"
  ON products FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can insert own products"
  ON products FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update own products"
  ON products FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete own products"
  ON products FOR DELETE USING (auth.uid() = seller_id);

CREATE POLICY "Admins can view all products"
  ON products FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update any product"
  ON products FOR UPDATE USING (is_admin());

-- ---- orders ----
CREATE POLICY "Buyers can view own orders"
  ON orders FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Buyers can insert orders"
  ON orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Sellers can view own orders"
  ON orders FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can update own orders"
  ON orders FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update any order"
  ON orders FOR UPDATE USING (is_admin());

-- ---- order_items ----
CREATE POLICY "Buyers can view own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.buyer_id = auth.uid())
  );

CREATE POLICY "Sellers can view own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.seller_id = auth.uid())
  );

CREATE POLICY "Buyers can insert order items"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.buyer_id = auth.uid())
  );

CREATE POLICY "Admins can view all order items"
  ON order_items FOR SELECT USING (is_admin());

-- ---- favorites ----
CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON favorites FOR DELETE USING (auth.uid() = user_id);

-- ---- admin_settings ----
CREATE POLICY "Admins can view settings"
  ON admin_settings FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update settings"
  ON admin_settings FOR UPDATE USING (is_admin());


-- ============================================================
-- 8. STORAGE BUCKETS
-- Run these in the Supabase dashboard → Storage, or via SQL:
-- ============================================================

-- NOTE: Storage bucket creation via SQL requires the storage extension.
-- If the below throws an error, create buckets manually in the dashboard:
--   - "product-images"   (public)
--   - "payment-screenshots" (private — authenticated upload, admin read)

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-screenshots', 'payment-screenshots', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: product-images (public read, authenticated upload)
CREATE POLICY "Public can view product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Sellers can delete own product images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies: payment-screenshots (authenticated upload, admin read)
CREATE POLICY "Authenticated users can upload payment screenshots"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'payment-screenshots' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view own payment screenshots"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'payment-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all payment screenshots"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'payment-screenshots' AND is_admin());


-- ============================================================
-- 9. SEED DATA
-- ============================================================

-- Single admin_settings row (required for the app to function)
INSERT INTO admin_settings (id, email_notifications_enabled)
VALUES (1, true)
ON CONFLICT (id) DO NOTHING;
