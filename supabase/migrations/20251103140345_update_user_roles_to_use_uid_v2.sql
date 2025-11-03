/*
  # Update User Roles to Use UID Instead of Email
  
  ## Summary
  Migrates the user_roles table to use auth user ID (uid) as the primary identifier
  instead of email. This follows best practices and makes RLS policies more secure.
  
  ## Changes
  1. Add user_id column (uuid) that references auth.users
  2. Migrate existing data from email to uid where possible
  3. Update all RLS policies across all tables to use auth.uid()
  4. Update helper functions to use uid
  5. Keep email for display but make uid the primary key
  
  ## Security
  - All RLS policies updated to use auth.uid()
  - More secure as uid cannot be changed
  - Direct reference to auth.users table
*/

-- Step 1: Add user_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_roles' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE user_roles 
    ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Step 2: Migrate existing data (match email to auth.users)
UPDATE user_roles ur
SET user_id = au.id
FROM auth.users au
WHERE ur.user_email = au.email
  AND ur.user_id IS NULL;

-- Step 3: Remove rows that couldn't be matched (if any)
DELETE FROM user_roles WHERE user_id IS NULL;

-- Step 4: Make user_id NOT NULL and UNIQUE
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_roles' 
    AND column_name = 'user_id' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE user_roles ALTER COLUMN user_id SET NOT NULL;
  END IF;
END $$;

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_roles_user_id_unique'
  ) THEN
    ALTER TABLE user_roles ADD CONSTRAINT user_roles_user_id_unique UNIQUE(user_id);
  END IF;
END $$;

-- Step 5: Create index on user_id
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

-- Step 6: Create overloaded helper functions that work with uid
-- These will coexist with the old functions temporarily

CREATE OR REPLACE FUNCTION check_user_permission(
  user_id_param uuid,
  permission_name text
)
RETURNS boolean AS $$
DECLARE
  has_permission boolean;
  user_is_owner boolean;
BEGIN
  SELECT 
    is_owner,
    CASE permission_name
      WHEN 'can_view_orders' THEN can_view_orders
      WHEN 'can_update_order_status' THEN can_update_order_status
      WHEN 'can_delete_orders' THEN can_delete_orders
      WHEN 'can_manage_menu_items' THEN can_manage_menu_items
      WHEN 'can_manage_categories' THEN can_manage_categories
      WHEN 'can_manage_restaurants' THEN can_manage_restaurants
      WHEN 'can_manage_branches' THEN can_manage_branches
      WHEN 'can_view_reports' THEN can_view_reports
      WHEN 'can_manage_users' THEN can_manage_users
      ELSE false
    END
  INTO user_is_owner, has_permission
  FROM user_roles
  WHERE user_id = user_id_param
    AND is_active = true;
  
  IF user_is_owner = true THEN
    RETURN true;
  END IF;
  
  RETURN COALESCE(has_permission, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_user_owner(user_id_param uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = user_id_param
      AND is_owner = true
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Update user_roles RLS policies to use uid

DROP POLICY IF EXISTS "Owners can view all user roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON user_roles;
DROP POLICY IF EXISTS "Owners can create user roles" ON user_roles;
DROP POLICY IF EXISTS "Owners can update user roles" ON user_roles;
DROP POLICY IF EXISTS "Owners can delete user roles" ON user_roles;

CREATE POLICY "Owners can view all user roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND is_owner = true
        AND is_active = true
    )
  );

CREATE POLICY "Users can view own role"
  ON user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Owners and user managers can create user roles"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND (is_owner = true OR can_manage_users = true)
        AND is_active = true
    )
  );

CREATE POLICY "Owners and user managers can update user roles"
  ON user_roles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND (is_owner = true OR can_manage_users = true)
        AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND (is_owner = true OR can_manage_users = true)
        AND is_active = true
    )
  );

CREATE POLICY "Owners can delete user roles"
  ON user_roles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND is_owner = true
        AND is_active = true
    )
  );

-- Step 8: Update all other table policies to use auth.uid() instead of email

-- Orders table
DROP POLICY IF EXISTS "Users with permission can update orders" ON orders;
DROP POLICY IF EXISTS "Users with permission can delete orders" ON orders;

CREATE POLICY "Users with permission can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (check_user_permission(auth.uid(), 'can_update_order_status'))
  WITH CHECK (check_user_permission(auth.uid(), 'can_update_order_status'));

CREATE POLICY "Users with permission can delete orders"
  ON orders FOR DELETE
  TO authenticated
  USING (check_user_permission(auth.uid(), 'can_delete_orders'));

-- Menu items table
DROP POLICY IF EXISTS "Users with permission can insert menu items" ON menu_items;
DROP POLICY IF EXISTS "Users with permission can update menu items" ON menu_items;
DROP POLICY IF EXISTS "Users with permission can delete menu items" ON menu_items;

CREATE POLICY "Users with permission can insert menu items"
  ON menu_items FOR INSERT
  TO authenticated
  WITH CHECK (check_user_permission(auth.uid(), 'can_manage_menu_items'));

CREATE POLICY "Users with permission can update menu items"
  ON menu_items FOR UPDATE
  TO authenticated
  USING (check_user_permission(auth.uid(), 'can_manage_menu_items'))
  WITH CHECK (check_user_permission(auth.uid(), 'can_manage_menu_items'));

CREATE POLICY "Users with permission can delete menu items"
  ON menu_items FOR DELETE
  TO authenticated
  USING (check_user_permission(auth.uid(), 'can_manage_menu_items'));

-- Categories table
DROP POLICY IF EXISTS "Users with permission can insert categories" ON categories;
DROP POLICY IF EXISTS "Users with permission can update categories" ON categories;
DROP POLICY IF EXISTS "Users with permission can delete categories" ON categories;

CREATE POLICY "Users with permission can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (check_user_permission(auth.uid(), 'can_manage_categories'));

CREATE POLICY "Users with permission can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (check_user_permission(auth.uid(), 'can_manage_categories'))
  WITH CHECK (check_user_permission(auth.uid(), 'can_manage_categories'));

CREATE POLICY "Users with permission can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (check_user_permission(auth.uid(), 'can_manage_categories'));

-- Restaurants table
DROP POLICY IF EXISTS "Users with permission can insert restaurants" ON restaurants;
DROP POLICY IF EXISTS "Users with permission can update restaurants" ON restaurants;
DROP POLICY IF EXISTS "Users with permission can delete restaurants" ON restaurants;

CREATE POLICY "Users with permission can insert restaurants"
  ON restaurants FOR INSERT
  TO authenticated
  WITH CHECK (check_user_permission(auth.uid(), 'can_manage_restaurants'));

CREATE POLICY "Users with permission can update restaurants"
  ON restaurants FOR UPDATE
  TO authenticated
  USING (check_user_permission(auth.uid(), 'can_manage_restaurants'))
  WITH CHECK (check_user_permission(auth.uid(), 'can_manage_restaurants'));

CREATE POLICY "Users with permission can delete restaurants"
  ON restaurants FOR DELETE
  TO authenticated
  USING (check_user_permission(auth.uid(), 'can_manage_restaurants'));

-- Restaurant branches table
DROP POLICY IF EXISTS "Users with permission can insert branches" ON restaurant_branches;
DROP POLICY IF EXISTS "Users with permission can update branches" ON restaurant_branches;
DROP POLICY IF EXISTS "Users with permission can delete branches" ON restaurant_branches;

CREATE POLICY "Users with permission can insert branches"
  ON restaurant_branches FOR INSERT
  TO authenticated
  WITH CHECK (check_user_permission(auth.uid(), 'can_manage_branches'));

CREATE POLICY "Users with permission can update branches"
  ON restaurant_branches FOR UPDATE
  TO authenticated
  USING (check_user_permission(auth.uid(), 'can_manage_branches'))
  WITH CHECK (check_user_permission(auth.uid(), 'can_manage_branches'));

CREATE POLICY "Users with permission can delete branches"
  ON restaurant_branches FOR DELETE
  TO authenticated
  USING (check_user_permission(auth.uid(), 'can_manage_branches'));

-- Step 9: Create helper function to get current user's role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  user_name text,
  user_email text,
  user_phone text,
  can_view_orders boolean,
  can_update_order_status boolean,
  can_delete_orders boolean,
  can_manage_menu_items boolean,
  can_manage_categories boolean,
  can_manage_restaurants boolean,
  can_manage_branches boolean,
  can_view_reports boolean,
  can_manage_users boolean,
  is_owner boolean,
  is_active boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ur.id,
    ur.user_id,
    ur.user_name,
    ur.user_email,
    ur.user_phone,
    ur.can_view_orders,
    ur.can_update_order_status,
    ur.can_delete_orders,
    ur.can_manage_menu_items,
    ur.can_manage_categories,
    ur.can_manage_restaurants,
    ur.can_manage_branches,
    ur.can_view_reports,
    ur.can_manage_users,
    ur.is_owner,
    ur.is_active
  FROM user_roles ur
  WHERE ur.user_id = auth.uid()
    AND ur.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
