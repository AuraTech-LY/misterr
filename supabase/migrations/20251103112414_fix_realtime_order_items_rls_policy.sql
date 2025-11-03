/*
  # Fix Realtime Order Items RLS Policy

  ## Problem
  - Order items might also be blocked by RLS policies
  - Need to ensure realtime subscriptions work for order_items table too

  ## Solution
  - Add permissive SELECT policy for authenticated users
  - Align with orders table policy for consistency

  ## Changes
  1. Add RLS policy for order_items SELECT access
     - Allows all authenticated users to view order items
     - Enables realtime updates for order items
*/

-- Check if there are existing restrictive policies and drop them
DROP POLICY IF EXISTS "Users with permission can view order items" ON order_items;

-- Create a new policy that allows all authenticated users to view order items
CREATE POLICY "Authenticated users can view all order items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow anonymous users to view order items too (for public order tracking)
CREATE POLICY "Anonymous users can view order items"
  ON order_items
  FOR SELECT
  TO anon
  USING (true);
