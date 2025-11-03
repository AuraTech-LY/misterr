/*
  # Create Role Helper Functions

  This migration creates utility functions to simplify permission checking in RLS policies.

  ## Functions Created

  1. **check_user_permission(user_email text, permission_name text)**
     - Returns: boolean
     - Checks if a user has a specific permission
     - Returns true for owners (who have all permissions)
     - Returns false for inactive users

  2. **get_user_role(user_email text)**
     - Returns: user_roles record
     - Gets the complete role object for a user
     - Returns NULL if user not found

  3. **is_user_owner(user_email text)**
     - Returns: boolean
     - Quick check if user is an owner
     - Returns false for inactive owners

  ## Usage in RLS Policies

  Example: Only allow users with can_view_orders permission to view orders
  ```sql
  CREATE POLICY "Users can view orders if permitted"
    ON orders FOR SELECT
    TO authenticated
    USING (check_user_permission(auth.jwt()->>'email', 'can_view_orders'));
  ```

  ## Security Notes

  - All functions use SECURITY DEFINER to access user_roles table
  - Functions check is_active status to prevent access by deactivated users
  - Owners (is_owner = true) automatically have all permissions
*/

-- Function to check if a user has a specific permission
CREATE OR REPLACE FUNCTION check_user_permission(user_email text, permission_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role record;
  has_permission boolean;
BEGIN
  -- Get the user's role
  SELECT * INTO user_role
  FROM user_roles
  WHERE user_roles.user_email = check_user_permission.user_email
    AND is_active = true
  LIMIT 1;

  -- If user not found or inactive, return false
  IF user_role IS NULL THEN
    RETURN false;
  END IF;

  -- If user is owner, they have all permissions
  IF user_role.is_owner = true THEN
    RETURN true;
  END IF;

  -- Check the specific permission
  CASE permission_name
    WHEN 'can_view_orders' THEN
      has_permission := user_role.can_view_orders;
    WHEN 'can_update_order_status' THEN
      has_permission := user_role.can_update_order_status;
    WHEN 'can_delete_orders' THEN
      has_permission := user_role.can_delete_orders;
    WHEN 'can_manage_menu_items' THEN
      has_permission := user_role.can_manage_menu_items;
    WHEN 'can_manage_categories' THEN
      has_permission := user_role.can_manage_categories;
    WHEN 'can_manage_restaurants' THEN
      has_permission := user_role.can_manage_restaurants;
    WHEN 'can_manage_branches' THEN
      has_permission := user_role.can_manage_branches;
    WHEN 'can_view_reports' THEN
      has_permission := user_role.can_view_reports;
    WHEN 'can_manage_users' THEN
      has_permission := user_role.can_manage_users;
    ELSE
      has_permission := false;
  END CASE;

  RETURN COALESCE(has_permission, false);
END;
$$;

-- Function to get a user's complete role
CREATE OR REPLACE FUNCTION get_user_role(user_email text)
RETURNS user_roles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role user_roles;
BEGIN
  SELECT * INTO user_role
  FROM user_roles
  WHERE user_roles.user_email = get_user_role.user_email
    AND is_active = true
  LIMIT 1;

  RETURN user_role;
END;
$$;

-- Function to quickly check if user is an owner
CREATE OR REPLACE FUNCTION is_user_owner(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_owner_flag boolean;
BEGIN
  SELECT is_owner INTO is_owner_flag
  FROM user_roles
  WHERE user_roles.user_email = is_user_owner.user_email
    AND is_active = true
  LIMIT 1;

  RETURN COALESCE(is_owner_flag, false);
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION check_user_permission(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role(text) TO authenticated;
GRANT EXECUTE ON FUNCTION is_user_owner(text) TO authenticated;