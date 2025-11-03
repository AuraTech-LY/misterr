/*
  # Update Menu Items Table RLS Policies with Permission Checks

  This migration updates the RLS policies on the menu_items table to check user permissions.

  ## Changes

  1. **Keep public viewing policy**
     - Anyone can view available menu items (for customer-facing menu)

  2. **UPDATE admin policies**
     - INSERT/UPDATE/DELETE: Requires can_manage_menu_items permission

  ## Security Notes

  - Public users can still view available menu items
  - Only authenticated users with can_manage_menu_items can modify items
  - Owners automatically have this permission
*/

-- Drop old admin policies
DROP POLICY IF EXISTS "Authenticated users can insert menu items" ON menu_items;
DROP POLICY IF EXISTS "Authenticated users can update menu items" ON menu_items;
DROP POLICY IF EXISTS "Authenticated users can delete menu items" ON menu_items;

-- Keep public viewing: "Anyone can view menu items" (already exists)

-- INSERT: Users with can_manage_menu_items permission
CREATE POLICY "Users with permission can insert menu items"
  ON menu_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    check_user_permission((auth.jwt()->>'email')::text, 'can_manage_menu_items')
  );

-- UPDATE: Users with can_manage_menu_items permission
CREATE POLICY "Users with permission can update menu items"
  ON menu_items
  FOR UPDATE
  TO authenticated
  USING (
    check_user_permission((auth.jwt()->>'email')::text, 'can_manage_menu_items')
  )
  WITH CHECK (
    check_user_permission((auth.jwt()->>'email')::text, 'can_manage_menu_items')
  );

-- DELETE: Users with can_manage_menu_items permission
CREATE POLICY "Users with permission can delete menu items"
  ON menu_items
  FOR DELETE
  TO authenticated
  USING (
    check_user_permission((auth.jwt()->>'email')::text, 'can_manage_menu_items')
  );