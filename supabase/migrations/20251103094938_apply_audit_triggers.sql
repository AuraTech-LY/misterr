/*
  # Apply Audit Triggers to All Critical Tables

  ## Summary
  Applies the audit logging trigger to all tables that require change tracking.
  Every INSERT, UPDATE, and DELETE operation will be automatically logged.

  ## Tables with Audit Triggers
  1. `orders` - Track order creation, status changes, deletions
  2. `order_items` - Track item additions, modifications, deletions
  3. `menu_items` - Track menu changes
  4. `categories` - Track category changes
  5. `restaurants` - Track restaurant modifications
  6. `restaurant_branches` - Track branch modifications
  7. `user_roles` - Track permission changes (critical for security)

  ## Security
  - All changes are logged automatically
  - No user action required
  - Logs capture complete before/after state
  - Triggers run with elevated privileges (SECURITY DEFINER)

  ## Notes
  - Triggers fire AFTER the operation completes
  - Failed operations are not logged (transaction rolled back)
  - System user actions are also logged
*/

-- Apply audit trigger to orders table
DROP TRIGGER IF EXISTS audit_orders_trigger ON orders;
CREATE TRIGGER audit_orders_trigger
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

-- Apply audit trigger to order_items table
DROP TRIGGER IF EXISTS audit_order_items_trigger ON order_items;
CREATE TRIGGER audit_order_items_trigger
  AFTER INSERT OR UPDATE OR DELETE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

-- Apply audit trigger to menu_items table
DROP TRIGGER IF EXISTS audit_menu_items_trigger ON menu_items;
CREATE TRIGGER audit_menu_items_trigger
  AFTER INSERT OR UPDATE OR DELETE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

-- Apply audit trigger to categories table
DROP TRIGGER IF EXISTS audit_categories_trigger ON categories;
CREATE TRIGGER audit_categories_trigger
  AFTER INSERT OR UPDATE OR DELETE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

-- Apply audit trigger to restaurants table
DROP TRIGGER IF EXISTS audit_restaurants_trigger ON restaurants;
CREATE TRIGGER audit_restaurants_trigger
  AFTER INSERT OR UPDATE OR DELETE ON restaurants
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

-- Apply audit trigger to restaurant_branches table
DROP TRIGGER IF EXISTS audit_restaurant_branches_trigger ON restaurant_branches;
CREATE TRIGGER audit_restaurant_branches_trigger
  AFTER INSERT OR UPDATE OR DELETE ON restaurant_branches
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

-- Apply audit trigger to user_roles table (critical for security auditing)
DROP TRIGGER IF EXISTS audit_user_roles_trigger ON user_roles;
CREATE TRIGGER audit_user_roles_trigger
  AFTER INSERT OR UPDATE OR DELETE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

-- Create a view for easy audit log querying
CREATE OR REPLACE VIEW audit_logs_summary AS
SELECT 
  table_name,
  action,
  COUNT(*) as count,
  MIN(changed_at) as first_occurrence,
  MAX(changed_at) as last_occurrence
FROM audit_logs
GROUP BY table_name, action
ORDER BY table_name, action;

-- Grant owners access to the view
GRANT SELECT ON audit_logs_summary TO authenticated;
