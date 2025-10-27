/*
  # Allow Anonymous Users to Create Orders

  1. Changes
    - Add RLS policies to allow anonymous (non-authenticated) users to create orders
    - Allow anonymous users to insert into orders table
    - Allow anonymous users to insert into order_items table
    - Maintain read restrictions (only authenticated users can read orders)
  
  2. Security
    - Anonymous users can only INSERT orders (place orders)
    - Anonymous users CANNOT read, update, or delete orders
    - Only authenticated admin users can view and manage orders
    - This allows customers to place orders without requiring authentication
*/

-- Allow anonymous users to insert orders
CREATE POLICY "Anyone can create orders"
  ON orders FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous users to insert order items
CREATE POLICY "Anyone can create order items"
  ON order_items FOR INSERT
  TO anon
  WITH CHECK (true);
