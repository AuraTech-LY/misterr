/*
  # Fix Menu Items Update Policy
  
  1. Changes
    - Remove WITH CHECK clause that's causing RLS violations
    - Keep USING clause for checking permissions before update
  
  2. Security
    - Still requires authentication
    - Still checks for can_manage_menu_items permission
    - Allows update without restrictive WITH CHECK
*/

-- Drop the existing update policy
DROP POLICY IF EXISTS "Users with permission can update menu items" ON menu_items;

-- Create a new update policy without WITH CHECK
CREATE POLICY "Users with permission can update menu items"
  ON menu_items
  FOR UPDATE
  TO authenticated
  USING (
    check_user_permission(auth.uid(), 'can_manage_menu_items')
  );