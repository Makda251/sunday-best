-- Add buyer_zelle_name column to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS buyer_zelle_name TEXT;

COMMENT ON COLUMN orders.buyer_zelle_name IS 'Name on the buyer''s Zelle account for payment verification';
