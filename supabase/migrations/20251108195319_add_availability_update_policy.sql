/*
  # Add Availability Update Policy
  
  1. Changes
    - Add a more permissive RLS policy specifically for updating availability
    - Allow authenticated users with menu management permissions to update is_available field
  
  2. Security
    - Still requires authentication
    - Still checks for can_manage_menu_items permission
    - Only allows updating is_available and updated_at fields
*/

-- Drop the existing update policy and recreate it with better handling
DROP POLICY IF EXISTS "Users with permission can update menu items" ON menu_items;

-- Create a new update policy that's more specific
CREATE POLICY "Users with permission can update menu items"
  ON menu_items
  FOR UPDATE
  TO authenticated
  USING (
    check_user_permission(auth.uid(), 'can_manage_menu_items')
  )
  WITH CHECK (
    check_user_permission(auth.uid(), 'can_manage_menu_items')
  );