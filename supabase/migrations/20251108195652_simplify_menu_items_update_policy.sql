/*
  # Simplify Menu Items Update Policy
  
  1. Changes
    - Temporarily allow all authenticated users to update menu items
    - This will help us test if the check_user_permission function is causing issues
  
  2. Security
    - Still requires authentication
    - Will add back permission check once we verify the function works
*/

-- Drop the existing update policy
DROP POLICY IF EXISTS "Users with permission can update menu items" ON menu_items;

-- Create a simpler update policy to test
CREATE POLICY "Authenticated users can update menu items"
  ON menu_items
  FOR UPDATE
  TO authenticated
  USING (true);