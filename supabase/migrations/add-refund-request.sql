-- Add refund request fields to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS refund_requested BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS refund_request_reason TEXT,
ADD COLUMN IF NOT EXISTS refund_request_description TEXT,
ADD COLUMN IF NOT EXISTS refund_requested_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS refund_buyer_zelle_name TEXT,
ADD COLUMN IF NOT EXISTS refund_buyer_zelle_email TEXT,
ADD COLUMN IF NOT EXISTS refund_buyer_zelle_phone TEXT;

-- Add comment explaining the refund policy
COMMENT ON COLUMN orders.refund_request_reason IS 'Reason for refund request: item_destroyed or severe_misrepresentation';
COMMENT ON COLUMN orders.refund_request_description IS 'Detailed description of the issue from buyer';
