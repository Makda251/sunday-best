-- Add order_number as a generated column
-- Formats the first 8 characters of the UUID in uppercase
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS order_number TEXT GENERATED ALWAYS AS (
  UPPER(SUBSTRING(id::text, 1, 8))
) STORED;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- Comment
COMMENT ON COLUMN orders.order_number IS 'Human-readable order number, generated from first 8 chars of UUID';
