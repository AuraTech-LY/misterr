/*
  # Fix Function Search Path Security

  1. Changes
    - Set immutable search_path for generate_order_number function
    - Set immutable search_path for update_updated_at_column function
  
  2. Security
    - Prevents search_path manipulation attacks
    - Ensures functions always reference the correct schema
*/

-- Fix generate_order_number function (replace without dropping)
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  -- Get current date in YYYYMMDD format
  new_number := TO_CHAR(NOW(), 'YYYYMMDD');
  
  -- Get count of orders today and add 1
  SELECT COUNT(*) + 1 INTO counter
  FROM orders
  WHERE DATE(created_at) = CURRENT_DATE;
  
  -- Append counter with leading zeros (4 digits)
  new_number := new_number || LPAD(counter::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$;

-- Fix update_updated_at_column function (replace without dropping)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
