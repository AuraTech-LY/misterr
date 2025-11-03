/*
  # Update RLS Policies for Categories, Restaurants, and Branches

  This migration updates RLS policies on categories, restaurants, and restaurant_branches
  tables to check user permissions from the user_roles table.

  ## Changes

  ### Categories Table
  - Keep public viewing policy
  - INSERT/UPDATE/DELETE: Requires can_manage_categories permission

  ### Restaurants Table
  - Keep public viewing policy
  - INSERT/UPDATE/DELETE: Requires can_manage_restaurants permission

  ### Restaurant Branches Table
  - Keep public viewing policy
  - INSERT/UPDATE/DELETE: Requires can_manage_branches permission

  ## Security Notes

  - Public users can still view categories, restaurants, and branches (for customer-facing site)
  - Only authenticated users with appropriate permissions can modify data
  - Owners automatically have all permissions
*/

-- ============================================================================
-- CATEGORIES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can insert categories" ON categories;
DROP POLICY IF EXISTS "Authenticated users can update categories" ON categories;
DROP POLICY IF EXISTS "Authenticated users can delete categories" ON categories;

CREATE POLICY "Users with permission can insert categories"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    check_user_permission((auth.jwt()->>'email')::text, 'can_manage_categories')
  );

CREATE POLICY "Users with permission can update categories"
  ON categories
  FOR UPDATE
  TO authenticated
  USING (
    check_user_permission((auth.jwt()->>'email')::text, 'can_manage_categories')
  )
  WITH CHECK (
    check_user_permission((auth.jwt()->>'email')::text, 'can_manage_categories')
  );

CREATE POLICY "Users with permission can delete categories"
  ON categories
  FOR DELETE
  TO authenticated
  USING (
    check_user_permission((auth.jwt()->>'email')::text, 'can_manage_categories')
  );

-- ============================================================================
-- RESTAURANTS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can insert restaurants" ON restaurants;
DROP POLICY IF EXISTS "Authenticated users can update restaurants" ON restaurants;
DROP POLICY IF EXISTS "Authenticated users can delete restaurants" ON restaurants;

CREATE POLICY "Users with permission can insert restaurants"
  ON restaurants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    check_user_permission((auth.jwt()->>'email')::text, 'can_manage_restaurants')
  );

CREATE POLICY "Users with permission can update restaurants"
  ON restaurants
  FOR UPDATE
  TO authenticated
  USING (
    check_user_permission((auth.jwt()->>'email')::text, 'can_manage_restaurants')
  )
  WITH CHECK (
    check_user_permission((auth.jwt()->>'email')::text, 'can_manage_restaurants')
  );

CREATE POLICY "Users with permission can delete restaurants"
  ON restaurants
  FOR DELETE
  TO authenticated
  USING (
    check_user_permission((auth.jwt()->>'email')::text, 'can_manage_restaurants')
  );

-- ============================================================================
-- RESTAURANT BRANCHES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can insert branches" ON restaurant_branches;
DROP POLICY IF EXISTS "Authenticated users can update branches" ON restaurant_branches;
DROP POLICY IF EXISTS "Authenticated users can delete branches" ON restaurant_branches;

CREATE POLICY "Users with permission can insert branches"
  ON restaurant_branches
  FOR INSERT
  TO authenticated
  WITH CHECK (
    check_user_permission((auth.jwt()->>'email')::text, 'can_manage_branches')
  );

CREATE POLICY "Users with permission can update branches"
  ON restaurant_branches
  FOR UPDATE
  TO authenticated
  USING (
    check_user_permission((auth.jwt()->>'email')::text, 'can_manage_branches')
  )
  WITH CHECK (
    check_user_permission((auth.jwt()->>'email')::text, 'can_manage_branches')
  );

CREATE POLICY "Users with permission can delete branches"
  ON restaurant_branches
  FOR DELETE
  TO authenticated
  USING (
    check_user_permission((auth.jwt()->>'email')::text, 'can_manage_branches')
  );