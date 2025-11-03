/*
  # Update Orders Table RLS Policies with Permission Checks

  This migration updates the RLS policies on the orders table to check user permissions
  from the user_roles table using the new helper functions.

  ## Changes

  1. **DROP old permissive policies**
     - Remove outdated policies that allow all authenticated users

  2. **CREATE new permission-based policies**
     - SELECT: Requires can_view_orders permission
     - UPDATE: Requires can_update_order_status permission
     - DELETE: Requires can_delete_orders permission
     - INSERT: Keep anonymous order creation for public orders

  ## Security Notes

  - Anonymous users can still create orders (for customer-facing checkout)
  - Authenticated admin users need specific permissions to view/update/delete orders
  - Owners automatically have all permissions (via check_user_permission function)
*/

-- Drop old policies
DROP POLICY IF EXISTS "Authenticated users can read orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can update orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can delete orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can insert orders" ON orders;

-- Keep anonymous order creation for customer checkout
-- (This policy already exists, no need to recreate)

-- SELECT: Users with can_view_orders permission
CREATE POLICY "Users with permission can view orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    check_user_permission((auth.jwt()->>'email')::text, 'can_view_orders')
  );

-- UPDATE: Users with can_update_order_status permission
CREATE POLICY "Users with permission can update orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (
    check_user_permission((auth.jwt()->>'email')::text, 'can_update_order_status')
  )
  WITH CHECK (
    check_user_permission((auth.jwt()->>'email')::text, 'can_update_order_status')
  );

-- DELETE: Users with can_delete_orders permission
CREATE POLICY "Users with permission can delete orders"
  ON orders
  FOR DELETE
  TO authenticated
  USING (
    check_user_permission((auth.jwt()->>'email')::text, 'can_delete_orders')
  );