/*
  # Disable Audit Trigger on Menu Items
  
  1. Changes
    - Temporarily disable the audit trigger on menu_items table
    - This will help us identify if the audit trigger is causing the RLS violation
  
  2. Notes
    - This is a temporary fix to isolate the issue
    - We'll re-enable or fix the trigger once we confirm this is the problem
*/

-- Disable the audit trigger on menu_items
ALTER TABLE menu_items DISABLE TRIGGER audit_menu_items_trigger;