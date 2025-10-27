/*
  # Consolidate Multiple Permissive RLS Policies

  1. Changes
    - Remove duplicate permissive policies for authenticated users
    - Keep single, clear policies per table and action
    - Maintain security while reducing policy overlap
  
  2. Security
    - Eliminates confusion from multiple overlapping policies
    - Maintains proper access control with clearer policy structure
    
  Note: We keep "Anyone can view" policies for anon users and management policies for authenticated users
*/

-- Branch Operating Hours: Remove duplicate SELECT policy for authenticated
DROP POLICY IF EXISTS "Authenticated users can manage operating hours" ON branch_operating_hours;

-- Categories: Remove duplicate SELECT policy for authenticated  
DROP POLICY IF EXISTS "Authenticated users can manage categories" ON categories;

-- Menu Items: Remove duplicate SELECT policy for authenticated
DROP POLICY IF EXISTS "Authenticated users can manage menu" ON menu_items;

-- Operating Hours: Remove duplicate SELECT policy for authenticated
DROP POLICY IF EXISTS "Authenticated users can manage operating hours" ON operating_hours;

-- Restaurant Branches: Remove duplicate SELECT policy for authenticated
DROP POLICY IF EXISTS "Authenticated users can manage branches" ON restaurant_branches;

-- Restaurant Cuisine Types: Remove duplicate SELECT policy for authenticated
DROP POLICY IF EXISTS "Authenticated users can manage cuisine types" ON restaurant_cuisine_types;

-- Restaurants: Remove duplicate SELECT policy for authenticated
DROP POLICY IF EXISTS "Authenticated users can manage restaurants" ON restaurants;

-- Create single comprehensive policies for authenticated users (INSERT, UPDATE, DELETE only)
-- SELECT is already covered by "Anyone can view" policies which apply to both anon and authenticated

-- Branch Operating Hours
CREATE POLICY "Authenticated users can insert operating hours"
  ON branch_operating_hours FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update operating hours"
  ON branch_operating_hours FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete operating hours"
  ON branch_operating_hours FOR DELETE
  TO authenticated
  USING (true);

-- Categories
CREATE POLICY "Authenticated users can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (true);

-- Menu Items  
CREATE POLICY "Authenticated users can insert menu items"
  ON menu_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update menu items"
  ON menu_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete menu items"
  ON menu_items FOR DELETE
  TO authenticated
  USING (true);

-- Operating Hours
CREATE POLICY "Authenticated users can insert global operating hours"
  ON operating_hours FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update global operating hours"
  ON operating_hours FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete global operating hours"
  ON operating_hours FOR DELETE
  TO authenticated
  USING (true);

-- Restaurant Branches
CREATE POLICY "Authenticated users can insert branches"
  ON restaurant_branches FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update branches"
  ON restaurant_branches FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete branches"
  ON restaurant_branches FOR DELETE
  TO authenticated
  USING (true);

-- Restaurant Cuisine Types
CREATE POLICY "Authenticated users can insert cuisine types"
  ON restaurant_cuisine_types FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update cuisine types"
  ON restaurant_cuisine_types FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete cuisine types"
  ON restaurant_cuisine_types FOR DELETE
  TO authenticated
  USING (true);

-- Restaurants
CREATE POLICY "Authenticated users can insert restaurants"
  ON restaurants FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update restaurants"
  ON restaurants FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete restaurants"
  ON restaurants FOR DELETE
  TO authenticated
  USING (true);
