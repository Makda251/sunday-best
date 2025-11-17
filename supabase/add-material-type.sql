-- Add material_type column to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS material_type TEXT NOT NULL DEFAULT 'elastic' CHECK (material_type IN ('elastic', 'zipper'));

COMMENT ON COLUMN products.material_type IS 'Waist material type: elastic band or zipper';
