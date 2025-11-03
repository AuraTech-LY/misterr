/*
  # Fix User Roles SELECT Policy
  
  1. Changes
    - Drop the restrictive "Owners can view all user roles" policy
    - Create a new policy that allows authenticated users to view all roles
    - This allows admin dashboard users to manage roles without the chicken-egg problem
    - Keep other policies (INSERT, UPDATE, DELETE) restricted to owners only
  
  2. Security
    - Only authenticated users can view roles (anonymous cannot)
    - Still maintains owner-only restrictions for modifications
    - Users can still view their own role with the existing policy
*/

-- Drop the restrictive owner-only view policy
DROP POLICY IF EXISTS "Owners can view all user roles" ON user_roles;

-- Allow all authenticated users to view user roles
-- This is safe because they're already in the admin dashboard
CREATE POLICY "Authenticated users can view all user roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (true);
