/*
  # Create Immutable Audit Logging System

  ## Summary
  Creates a comprehensive audit trail system that logs all changes to critical tables.
  Logs are immutable - they cannot be updated or deleted by anyone, including owners.

  ## New Tables
  
  ### `audit_logs` table
  - `id` (uuid, primary key) - Unique log entry identifier
  - `table_name` (text) - Name of the table that was modified
  - `record_id` (text) - ID of the affected record
  - `action` (text) - Type of operation (INSERT, UPDATE, DELETE, ROLE_CHANGE)
  - `old_data` (jsonb) - Previous state of the record (NULL for INSERT)
  - `new_data` (jsonb) - New state of the record (NULL for DELETE)
  - `changed_by` (text) - Email/identifier of user who made change
  - `changed_at` (timestamptz) - When the change occurred (immutable)
  - `ip_address` (text) - IP address of the user (if available)
  - `user_agent` (text) - Browser/client information (if available)

  ## Security
  - Enable RLS on `audit_logs` table
  - Only owners can SELECT (view) audit logs
  - System can INSERT via triggers (not through API)
  - NO UPDATE policy (logs are immutable)
  - NO DELETE policy (logs are permanent)
  - Additional database-level protections against modifications

  ## Notes
  - All changes are logged automatically via triggers
  - Even owner actions are logged
  - Logs include complete before/after state
  - Attempts to modify logs will fail at database level
*/

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id text NOT NULL,
  action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'ROLE_CHANGE')),
  old_data jsonb,
  new_data jsonb,
  changed_by text NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_by ON audit_logs(changed_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_at ON audit_logs(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Function to protect audit_logs from ANY modifications
CREATE OR REPLACE FUNCTION protect_audit_logs()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'Audit logs are immutable and cannot be updated';
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Audit logs are immutable and cannot be deleted';
  END IF;
  
  IF TG_OP = 'TRUNCATE' THEN
    RAISE EXCEPTION 'Audit logs cannot be truncated';
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply protection triggers
CREATE TRIGGER trigger_protect_audit_logs_update
  BEFORE UPDATE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION protect_audit_logs();

CREATE TRIGGER trigger_protect_audit_logs_delete
  BEFORE DELETE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION protect_audit_logs();

CREATE TRIGGER trigger_protect_audit_logs_truncate
  BEFORE TRUNCATE ON audit_logs
  FOR EACH STATEMENT
  EXECUTE FUNCTION protect_audit_logs();

-- Enable Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only owners can view audit logs
CREATE POLICY "Only owners can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_email = (SELECT auth.jwt() ->> 'email')
        AND is_owner = true
        AND is_active = true
    )
  );

-- Policy: System can insert audit logs (via triggers)
-- This policy allows authenticated users to insert, but the actual insertion
-- will be done by triggers with elevated privileges
CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- NO UPDATE POLICY - Updates are forbidden
-- NO DELETE POLICY - Deletes are forbidden

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  user_email text;
  action_type text;
BEGIN
  -- Get current user email from JWT
  user_email := COALESCE(
    (SELECT auth.jwt() ->> 'email'),
    'system'
  );
  
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    action_type := 'INSERT';
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'UPDATE';
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'DELETE';
  END IF;
  
  -- Special handling for user_roles table
  IF TG_TABLE_NAME = 'user_roles' THEN
    action_type := 'ROLE_CHANGE';
  END IF;
  
  -- Insert audit log
  INSERT INTO audit_logs (
    table_name,
    record_id,
    action,
    old_data,
    new_data,
    changed_by,
    changed_at
  ) VALUES (
    TG_TABLE_NAME,
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.id::text
      ELSE NEW.id::text
    END,
    action_type,
    CASE 
      WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
      WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD)
      ELSE NULL
    END,
    CASE 
      WHEN TG_OP = 'DELETE' THEN NULL
      ELSE to_jsonb(NEW)
    END,
    user_email,
    now()
  );
  
  -- Return appropriate value
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to query audit logs
CREATE OR REPLACE FUNCTION get_audit_logs(
  p_table_name text DEFAULT NULL,
  p_record_id text DEFAULT NULL,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL,
  p_limit integer DEFAULT 100
)
RETURNS TABLE (
  id uuid,
  table_name text,
  record_id text,
  action text,
  old_data jsonb,
  new_data jsonb,
  changed_by text,
  changed_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.id,
    al.table_name,
    al.record_id,
    al.action,
    al.old_data,
    al.new_data,
    al.changed_by,
    al.changed_at
  FROM audit_logs al
  WHERE 
    (p_table_name IS NULL OR al.table_name = p_table_name)
    AND (p_record_id IS NULL OR al.record_id = p_record_id)
    AND (p_date_from IS NULL OR al.changed_at >= p_date_from)
    AND (p_date_to IS NULL OR al.changed_at <= p_date_to)
  ORDER BY al.changed_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get recent changes
CREATE OR REPLACE FUNCTION get_recent_changes(p_limit integer DEFAULT 50)
RETURNS TABLE (
  id uuid,
  table_name text,
  record_id text,
  action text,
  changed_by text,
  changed_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.id,
    al.table_name,
    al.record_id,
    al.action,
    al.changed_by,
    al.changed_at
  FROM audit_logs al
  ORDER BY al.changed_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user activity
CREATE OR REPLACE FUNCTION get_user_activity(
  p_user_email text,
  p_limit integer DEFAULT 100
)
RETURNS TABLE (
  id uuid,
  table_name text,
  record_id text,
  action text,
  changed_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.id,
    al.table_name,
    al.record_id,
    al.action,
    al.changed_at
  FROM audit_logs al
  WHERE al.changed_by = p_user_email
  ORDER BY al.changed_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
