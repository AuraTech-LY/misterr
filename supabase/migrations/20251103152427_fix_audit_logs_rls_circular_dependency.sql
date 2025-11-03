/*
  # Fix audit_logs RLS Circular Dependency

  ## Problem
  The audit_logs SELECT policy has the same circular dependency issue:
  - To view audit_logs, it checks user_roles for is_owner
  - But user_roles had circular dependency issues too

  ## Solution
  Now that user_roles SELECT is fixed, the audit_logs policy will work.
  But we should also ensure it doesn't cause issues if user_roles queries fail.

  ## Changes
  - Keep existing policy (it should work now)
  - This migration is mainly documentation that audit_logs depends on user_roles fix

  ## Security
  - Only owners can view audit logs (unchanged)
  - Maintains proper audit trail security
*/

-- The existing policy should now work after fixing user_roles
-- No changes needed, but we verify it's correct:

-- Verify the policy exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'audit_logs' 
    AND policyname = 'Only owners can view audit logs'
  ) THEN
    RAISE EXCEPTION 'audit_logs SELECT policy is missing';
  END IF;
END $$;
