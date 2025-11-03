/*
  # Add SELECT Policy for Order Items

  ## Summary
  This migration adds a SELECT policy for order_items table to allow authenticated
  users with can_view_orders permission to view order items and receive real-time updates.

  ## Changes
  
  1. **Add SELECT policy for order_items**
     - Users with can_view_orders permission can SELECT order items
     - Required for real-time subscriptions to work properly
  
  ## Security Notes
  
  - Only authenticated users with can_view_orders permission can view order items
  - Realtime subscriptions respect RLS policies
*/

-- Drop any old policies
DROP POLICY IF EXISTS "Authenticated users can read order items" ON order_items;
DROP POLICY IF EXISTS "Users with permission can view order items" ON order_items;

-- Create SELECT policy for order_items
CREATE POLICY "Users with permission can view order items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    check_user_permission((auth.jwt()->>'email')::text, 'can_view_orders')
  );