# Database Migration Instructions

## Critical Migrations to Run in Supabase

You need to run these SQL migrations in your Supabase SQL Editor to fix the bugs and enable new features.

### How to Run Migrations

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in the left sidebar
4. Copy and paste each SQL file content below
5. Click "Run" to execute

---

## Migration 1: Product Reservation Function (CRITICAL)

**File**: `supabase/migrations/fix-product-order-update.sql`

**What it does**: Fixes the bug where products weren't being marked as unavailable after orders. Creates a function that buyers can call to reserve products, bypassing RLS policies.

**Run this SQL**:
```sql
-- Function to update product quantity when order is placed
-- This bypasses RLS so buyers can reserve products
CREATE OR REPLACE FUNCTION reserve_product(product_id UUID, quantity_to_reserve INT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS
AS $$
DECLARE
  current_quantity INT;
BEGIN
  -- Get current quantity
  SELECT quantity_available INTO current_quantity
  FROM products
  WHERE id = product_id;

  -- Check if enough quantity available
  IF current_quantity < quantity_to_reserve THEN
    RAISE EXCEPTION 'Not enough quantity available';
  END IF;

  -- Update product
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION reserve_product(UUID, INT) TO authenticated;

-- Comment
COMMENT ON FUNCTION reserve_product IS 'Allows buyers to reserve products when placing orders. Bypasses RLS policies.';
```

---

## Migration 2: Refund Request Fields (CRITICAL)

**File**: `supabase/migrations/add-refund-request.sql`

**What it does**: Adds fields to the orders table to support buyer refund requests.

**Run this SQL**:
```sql
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
```

---

## Verify Migrations

After running both migrations, verify they worked:

1. Check that the function exists:
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'reserve_product';
   ```
   Should return: `reserve_product`

2. Check that the columns were added:
   ```sql
   SELECT column_name
   FROM information_schema.columns
   WHERE table_name = 'orders'
   AND column_name LIKE 'refund%';
   ```
   Should return 7 columns: `refund_requested`, `refund_request_reason`, `refund_request_description`, `refund_requested_at`, `refund_buyer_zelle_name`, `refund_buyer_zelle_email`, `refund_buyer_zelle_phone`

---

## After Running Migrations

1. Test placing an order - the product should now be marked as unavailable
2. Test viewing your orders in the buyer dashboard
3. For delivered orders, test requesting a refund

---

## Troubleshooting

If you get errors:

1. **"function already exists"**: This is okay, it means the function was already created
2. **"column already exists"**: This is okay, the `IF NOT EXISTS` prevents duplicates
3. **Permission errors**: Make sure you're running the SQL as the database owner (usually postgres role)

If products still show as available after ordering:
1. Check browser console for errors
2. Verify the function was created with the query above
3. Clear your browser cache and try again
