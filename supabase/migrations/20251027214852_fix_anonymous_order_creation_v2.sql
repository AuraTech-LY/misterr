/*
  # Fix Anonymous Order Creation - Version 2

  1. Changes
    - Drop existing anonymous policies and recreate them
    - Add explicit policies for both public schema access
    - Ensure anon role can bypass RLS for INSERT operations on orders
  
  2. Security
    - Anonymous users can only INSERT orders and order_items
    - Anonymous users CANNOT read, update, or delete
    - Maintains security for admin operations
*/

-- Drop existing policies for anon role if they exist
DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
DROP POLICY IF EXISTS "Anyone can create order items" ON order_items;

-- Create new policies for anonymous order creation with explicit public schema
CREATE POLICY "Allow anonymous order creation"
  ON public.orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow anonymous order items creation"
  ON public.order_items FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
