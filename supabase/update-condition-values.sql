-- Update product condition enum to include more granular options

-- First, add new values to the enum
ALTER TYPE product_condition ADD VALUE IF NOT EXISTS 'like_new';
ALTER TYPE product_condition ADD VALUE IF NOT EXISTS 'excellent';
ALTER TYPE product_condition ADD VALUE IF NOT EXISTS 'good';
ALTER TYPE product_condition ADD VALUE IF NOT EXISTS 'fair';

COMMENT ON COLUMN products.condition IS 'Product condition: new, like_new, excellent, good, or fair';
