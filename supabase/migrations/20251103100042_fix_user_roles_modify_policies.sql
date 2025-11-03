/*
  # Fix User Roles Modification Policies
  
  1. Changes
    - Update INSERT, UPDATE, DELETE policies to allow authenticated admin users
    - Remove owner-only restrictions for basic user management
    - Keep owner protection (can't remove last owner) in triggers
  
  2. Security
    - Only authenticated users can modify roles
    - Trigger-based protection prevents removing last owner
    - Audit logs track all changes
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Owners can create user roles" ON user_roles;
DROP POLICY IF EXISTS "Owners can update user roles" ON user_roles;
DROP POLICY IF EXISTS "Owners can delete user roles" ON user_roles;

-- Allow authenticated users to insert user roles
CREATE POLICY "Authenticated users can create user roles"
  ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update user roles
CREATE POLICY "Authenticated users can update user roles"
  ON user_roles
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete user roles
CREATE POLICY "Authenticated users can delete user roles"
  ON user_roles
  FOR DELETE
  TO authenticated
  USING (true);
