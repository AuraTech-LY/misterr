/*
  # Create User Roles and Permissions System

  ## Summary
  Creates a comprehensive role-based access control (RBAC) system with granular permissions.

  ## New Tables
  
  ### `user_roles` table
  - `id` (uuid, primary key) - Unique identifier
  - `user_email` (text, unique) - User's email (unique identifier)
  - `user_name` (text) - Display name
  - `user_phone` (text) - Contact phone number
  
  #### Permissions (boolean flags)
  - `can_view_orders` - View order list
  - `can_update_order_status` - Change order status
  - `can_delete_orders` - Delete orders
  - `can_manage_menu_items` - Create/update/delete menu items
  - `can_manage_categories` - Create/update/delete categories
  - `can_manage_restaurants` - Create/update/delete restaurants
  - `can_manage_branches` - Create/update/delete branches
  - `can_view_reports` - Access analytics and reports
  - `can_manage_users` - Assign and modify user roles
  - `is_owner` - Super admin with all permissions
  
  #### Metadata
  - `created_at` (timestamptz) - When role was created
  - `updated_at` (timestamptz) - Last role modification
  - `created_by` (text) - Who created this role
  - `is_active` (boolean) - Whether user is active

  ## Security
  - Enable RLS on `user_roles` table
  - Owners can view and manage all roles
  - Users can view their own role only
  - Only owners can create, update, or delete roles
  - At least one owner must always exist in the system

  ## Notes
  - Permissions default to false for security
  - Owner flag grants all permissions automatically
  - Email is used as unique identifier for users
*/

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text UNIQUE NOT NULL,
  user_name text NOT NULL,
  user_phone text,
  
  -- Permission flags (default to false for security)
  can_view_orders boolean DEFAULT false,
  can_update_order_status boolean DEFAULT false,
  can_delete_orders boolean DEFAULT false,
  can_manage_menu_items boolean DEFAULT false,
  can_manage_categories boolean DEFAULT false,
  can_manage_restaurants boolean DEFAULT false,
  can_manage_branches boolean DEFAULT false,
  can_view_reports boolean DEFAULT false,
  can_manage_users boolean DEFAULT false,
  is_owner boolean DEFAULT false,
  
  -- Metadata
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by text,
  
  -- Constraints
  CONSTRAINT user_email_format CHECK (user_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create index on user_email for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_email ON user_roles(user_email);
CREATE INDEX IF NOT EXISTS idx_user_roles_is_owner ON user_roles(is_owner) WHERE is_owner = true;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_user_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_roles_updated_at();

-- Function to prevent removing the last owner
CREATE OR REPLACE FUNCTION prevent_last_owner_removal()
RETURNS TRIGGER AS $$
DECLARE
  owner_count integer;
BEGIN
  -- If trying to remove owner status or deactivate an owner
  IF (TG_OP = 'UPDATE' AND OLD.is_owner = true AND (NEW.is_owner = false OR NEW.is_active = false)) OR
     (TG_OP = 'DELETE' AND OLD.is_owner = true) THEN
    
    -- Count remaining active owners
    SELECT COUNT(*) INTO owner_count
    FROM user_roles
    WHERE is_owner = true 
      AND is_active = true 
      AND id != OLD.id;
    
    -- Prevent if this is the last owner
    IF owner_count = 0 THEN
      RAISE EXCEPTION 'Cannot remove the last owner from the system. At least one owner must exist.';
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_last_owner_removal
  BEFORE UPDATE OR DELETE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_last_owner_removal();

-- Enable Row Level Security
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Owners can view all roles
CREATE POLICY "Owners can view all user roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_email = (SELECT auth.jwt() ->> 'email')
        AND is_owner = true
        AND is_active = true
    )
  );

-- Policy: Users can view their own role
CREATE POLICY "Users can view own role"
  ON user_roles FOR SELECT
  TO authenticated
  USING (user_email = (SELECT auth.jwt() ->> 'email'));

-- Policy: Only owners can insert roles
CREATE POLICY "Owners can create user roles"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_email = (SELECT auth.jwt() ->> 'email')
        AND is_owner = true
        AND is_active = true
    )
  );

-- Policy: Only owners can update roles
CREATE POLICY "Owners can update user roles"
  ON user_roles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_email = (SELECT auth.jwt() ->> 'email')
        AND is_owner = true
        AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_email = (SELECT auth.jwt() ->> 'email')
        AND is_owner = true
        AND is_active = true
    )
  );

-- Policy: Only owners can delete roles
CREATE POLICY "Owners can delete user roles"
  ON user_roles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_email = (SELECT auth.jwt() ->> 'email')
        AND is_owner = true
        AND is_active = true
    )
  );

-- Helper function: Check if user has specific permission
CREATE OR REPLACE FUNCTION check_user_permission(
  user_email_param text,
  permission_name text
)
RETURNS boolean AS $$
DECLARE
  has_permission boolean;
  user_is_owner boolean;
BEGIN
  -- Get owner status and specific permission
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
  WHERE user_email = user_email_param
    AND is_active = true;
  
  -- Owners have all permissions
  IF user_is_owner = true THEN
    RETURN true;
  END IF;
  
  -- Return specific permission
  RETURN COALESCE(has_permission, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Check if user is owner
CREATE OR REPLACE FUNCTION is_user_owner(user_email_param text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_email = user_email_param
      AND is_owner = true
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default owner (for initial setup)
-- NOTE: Update this email to match your actual owner email
INSERT INTO user_roles (
  user_email,
  user_name,
  is_owner,
  can_view_orders,
  can_update_order_status,
  can_delete_orders,
  can_manage_menu_items,
  can_manage_categories,
  can_manage_restaurants,
  can_manage_branches,
  can_view_reports,
  can_manage_users,
  created_by
) VALUES (
  'owner@example.com',
  'System Owner',
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  'system'
) ON CONFLICT (user_email) DO NOTHING;
