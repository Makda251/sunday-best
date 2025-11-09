-- Add buyer Zelle info and refund tracking to orders table

ALTER TABLE orders
ADD COLUMN buyer_zelle_email TEXT,
ADD COLUMN buyer_zelle_phone TEXT,
ADD COLUMN refunded_at TIMESTAMPTZ,
ADD COLUMN refund_notes TEXT;

COMMENT ON COLUMN orders.buyer_zelle_email IS 'Buyer Zelle email for refunds';
COMMENT ON COLUMN orders.buyer_zelle_phone IS 'Buyer Zelle phone for refunds';
COMMENT ON COLUMN orders.refunded_at IS 'Timestamp when refund was issued';
COMMENT ON COLUMN orders.refund_notes IS 'Admin notes about the refund process';
