/*
  # Allow Authenticated Users to See All Menu Items
  
  1. Changes
    - Add a policy for authenticated users to view all menu items (including unavailable ones)
    - Keep the existing policy for public users (only see available items)
  
  2. Security
    - Public users can only see available items
    - Authenticated users (staff/admin) can see all items to manage availability
*/

-- Add policy for authenticated users to see all items
CREATE POLICY "Authenticated users can view all menu items"
  ON menu_items
  FOR SELECT
  TO authenticated
  USING (true);