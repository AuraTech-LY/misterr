/*
  # Fix RLS Policies for User Roles and Audit Logs

  ## Summary
  Fixes the RLS policies for `user_roles` and `audit_logs` tables to properly check
  authentication using `auth.uid()` instead of JWT email checks.

  ## Changes
  1. Drop and recreate the "Only owners can view audit logs" policy
  2. Drop and recreate the "Owners can view all user roles" policy
  3. Both policies now use `auth.uid()` for more reliable authentication checks

  ## Security
  - Owners can view all user roles
  - Owners can view all audit logs
  - Uses proper `auth.uid()` function for authentication
*/

-- Fix audit_logs SELECT policy
DROP POLICY IF EXISTS "Only owners can view audit logs" ON audit_logs;

CREATE POLICY "Only owners can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.is_owner = true
        AND user_roles.is_active = true
    )
  );

-- Fix user_roles SELECT policy for owners
DROP POLICY IF EXISTS "Owners can view all user roles" ON user_roles;

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
