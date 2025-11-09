/*
  # Allow Public Users to See All Menu Items
  
  1. Changes
    - Drop the restrictive policy that only shows available items to public users
    - Create a new policy that allows public users to see all menu items
    - Keep the authenticated policy unchanged
  
  2. Security
    - Public users can view all menu items (both available and unavailable)
    - The frontend will handle showing items as unavailable with proper UI
    - Users still cannot modify items without proper authentication
*/

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Anyone can view menu items" ON menu_items;

-- Create new policy that allows viewing all items
CREATE POLICY "Public can view all menu items"
  ON menu_items
  FOR SELECT
  TO public
  USING (true);