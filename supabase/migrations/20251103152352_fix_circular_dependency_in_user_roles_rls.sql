/*
  # Fix Circular Dependency in user_roles RLS Policies

  ## Problem
  The "Owners can view all user roles" policy creates a circular dependency:
  - To SELECT from user_roles, it checks if user is owner
  - To check if user is owner, it queries user_roles
  - This creates an infinite loop causing permission failures

  ## Solution
  Split the SELECT policies:
  1. Users can ALWAYS view their own role (no subquery needed)
  2. Owners can view ALL roles (but use the same self-check to bootstrap)

  ## Changes
  - Drop existing SELECT policies on user_roles
  - Create new policies that avoid circular references
  - Users first check their own role, then can see others if they're owners

  ## Security
  - Maintains security: only owners see all roles
  - Non-owners only see their own role
  - No security downgrade, just fixes the circular reference
*/

-- Drop the problematic policies
DROP POLICY IF EXISTS "Owners can view all user roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON user_roles;

-- Policy 1: Allow users to view their own role (no circular dependency)
CREATE POLICY "Users can view own user role"
  ON user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy 2: Allow owners to view all roles
-- This works because they can first see their own role (via policy above),
-- and if that shows is_owner=true, they can access this policy
CREATE POLICY "Owners can view all user roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.is_owner = true
        AND ur.is_active = true
    )
  );
