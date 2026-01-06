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
