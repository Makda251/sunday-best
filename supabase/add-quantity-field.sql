-- Add quantity_available field to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS quantity_available INTEGER NOT NULL DEFAULT 1;

-- Add check constraint to ensure quantity is never negative
ALTER TABLE products
ADD CONSTRAINT quantity_available_positive CHECK (quantity_available >= 0);

-- Update existing products to have quantity_available = 1
UPDATE products
SET quantity_available = 1
WHERE quantity_available IS NULL;

-- Update is_active logic: product is active if quantity > 0
-- Note: We'll handle this in the application logic, but we can add a computed column if needed
-- For now, keep is_active as a manual flag that admins/sellers can toggle

-- Add index for filtering by quantity_available
CREATE INDEX IF NOT EXISTS idx_products_quantity_available ON products(quantity_available);
