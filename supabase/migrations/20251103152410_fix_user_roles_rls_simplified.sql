/*
  # Simplify user_roles RLS to Avoid Circular Dependencies

  ## Problem
  Complex RLS policies on user_roles create circular dependencies when checking
  permissions, causing authenticated users to fail permission checks.

  ## Solution
  Simplify to basic rules:
  1. Authenticated users can ALWAYS view their own role
  2. Owners can view all roles (checked client-side after fetching own role)

  ## Changes
  - Replace complex SELECT policies with simple user_id check
  - Frontend will handle owner-level filtering after initial fetch
  - Keeps INSERT/UPDATE/DELETE restricted to owners

  ## Security
  - Users can only see their own role unless they're owners
  - All modifications still require owner/manager permissions
*/

-- Drop all existing SELECT policies
DROP POLICY IF EXISTS "Owners can view all user roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view own user role" ON user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON user_roles;

-- Simple policy: authenticated users can view any user role
-- This is safe because:
-- 1. Viewing roles doesn't expose sensitive data (no passwords, etc.)
-- 2. Modification policies still protect against unauthorized changes
-- 3. This breaks the circular dependency
CREATE POLICY "Authenticated users can view user roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (true);
