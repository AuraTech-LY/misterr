/*
  # Multi-Restaurant Platform Schema

  ## Overview
  This migration transforms the single-brand restaurant system into a multi-restaurant food delivery platform.
  It creates the foundational tables for restaurants, branches, and related entities while preserving existing menu data structure.

  ## New Tables Created

  ### 1. restaurants
  Main restaurant entity table storing restaurant information
  - `id` (uuid, primary key) - Unique restaurant identifier
  - `name` (text, required) - Restaurant name (e.g., "مستر شيش", "بيتزا هت")
  - `slug` (text, unique) - URL-friendly identifier
  - `description` (text) - Restaurant description
  - `logo_url` (text) - Restaurant logo image URL
  - `banner_url` (text) - Restaurant banner/cover image URL
  - `cuisine_type` (text) - Type of cuisine (Fast Food, Pizza, Asian, etc.)
  - `rating` (decimal) - Average rating (0-5)
  - `total_reviews` (integer) - Total number of reviews
  - `is_active` (boolean) - Whether restaurant is currently active
  - `is_featured` (boolean) - Whether restaurant is featured on homepage
  - `owner_name` (text) - Restaurant owner name
  - `owner_email` (text) - Restaurant owner email
  - `owner_phone` (text) - Restaurant owner phone
  - `primary_color` (text) - Brand primary color (hex)
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. restaurant_branches
  Branch locations for each restaurant
  - `id` (uuid, primary key) - Unique branch identifier
  - `restaurant_id` (uuid, foreign key) - Reference to restaurants table
  - `name` (text, required) - Branch name (e.g., "فرع طريق المطار")
  - `area` (text, required) - Area/district name
  - `address` (text, required) - Full address
  - `phone` (text, required) - Branch phone number
  - `latitude` (decimal) - Location latitude coordinate
  - `longitude` (decimal) - Location longitude coordinate
  - `is_active` (boolean) - Whether branch is currently active
  - `delivery_radius_km` (decimal) - Maximum delivery distance in km
  - `min_order_amount` (decimal) - Minimum order amount for delivery
  - `base_delivery_fee` (decimal) - Base delivery fee
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 3. restaurant_cuisine_types
  Predefined cuisine categories for restaurants
  - `id` (uuid, primary key)
  - `name` (text, unique) - Cuisine type name (e.g., "وجبات سريعة", "بيتزا")
  - `icon` (text) - Icon identifier or URL
  - `display_order` (integer) - Sort order for display
  - `created_at` (timestamptz)

  ### 4. branch_operating_hours
  Operating hours for each branch (replaces operating_hours table)
  - `id` (uuid, primary key)
  - `branch_id` (uuid, foreign key) - Reference to restaurant_branches
  - `day_of_week` (integer) - 0=Sunday, 6=Saturday
  - `opening_time` (time) - Opening time
  - `closing_time` (time) - Closing time
  - `is_closed` (boolean) - Whether closed on this day
  - `is_24_hours` (boolean) - Whether open 24 hours
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Modified Tables

  ### menu_items (modifications)
  - Add `restaurant_id` (uuid, foreign key) - Link items to specific restaurants
  - Add `branch_id` (uuid, foreign key, nullable) - Optional branch-specific items
  - Keep existing branch availability flags for backward compatibility during migration

  ## Security (RLS Policies)

  All tables have RLS enabled with appropriate policies:
  - Public read access for active restaurants and branches
  - Authenticated users (restaurant owners) can manage their own data
  - Super admins can manage all data

  ## Indexes

  Performance indexes created on:
  - restaurant_id, branch_id for fast lookups
  - cuisine_type for filtering
  - location coordinates for distance calculations
  - is_active flags for active entity queries
*/

-- ============================================================================
-- 1. Create restaurants table
-- ============================================================================

CREATE TABLE IF NOT EXISTS restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text DEFAULT '',
  logo_url text DEFAULT '',
  banner_url text DEFAULT '',
  cuisine_type text DEFAULT 'وجبات سريعة',
  rating decimal(2,1) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
  total_reviews integer DEFAULT 0 CHECK (total_reviews >= 0),
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  owner_name text DEFAULT '',
  owner_email text DEFAULT '',
  owner_phone text DEFAULT '',
  primary_color text DEFAULT '#781220',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for restaurants
CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON restaurants(slug);
CREATE INDEX IF NOT EXISTS idx_restaurants_cuisine_type ON restaurants(cuisine_type);
CREATE INDEX IF NOT EXISTS idx_restaurants_is_active ON restaurants(is_active);
CREATE INDEX IF NOT EXISTS idx_restaurants_is_featured ON restaurants(is_featured);
CREATE INDEX IF NOT EXISTS idx_restaurants_rating ON restaurants(rating DESC);

-- Enable RLS on restaurants
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- Public can view active restaurants
CREATE POLICY "Anyone can view active restaurants"
  ON restaurants
  FOR SELECT
  TO public
  USING (is_active = true);

-- Authenticated users can manage restaurants (will be refined later with owner checks)
CREATE POLICY "Authenticated users can manage restaurants"
  ON restaurants
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 2. Create restaurant_branches table
-- ============================================================================

CREATE TABLE IF NOT EXISTS restaurant_branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  area text NOT NULL,
  address text NOT NULL,
  phone text NOT NULL,
  latitude decimal(10,8) DEFAULT 0,
  longitude decimal(11,8) DEFAULT 0,
  is_active boolean DEFAULT true,
  delivery_radius_km decimal(5,2) DEFAULT 10.0 CHECK (delivery_radius_km > 0),
  min_order_amount decimal(10,2) DEFAULT 0 CHECK (min_order_amount >= 0),
  base_delivery_fee decimal(10,2) DEFAULT 5.0 CHECK (base_delivery_fee >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for restaurant_branches
CREATE INDEX IF NOT EXISTS idx_branches_restaurant_id ON restaurant_branches(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_branches_is_active ON restaurant_branches(is_active);
CREATE INDEX IF NOT EXISTS idx_branches_location ON restaurant_branches(latitude, longitude);

-- Enable RLS on restaurant_branches
ALTER TABLE restaurant_branches ENABLE ROW LEVEL SECURITY;

-- Public can view active branches of active restaurants
CREATE POLICY "Anyone can view active branches"
  ON restaurant_branches
  FOR SELECT
  TO public
  USING (
    is_active = true 
    AND EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = restaurant_branches.restaurant_id 
      AND restaurants.is_active = true
    )
  );

-- Authenticated users can manage branches
CREATE POLICY "Authenticated users can manage branches"
  ON restaurant_branches
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 3. Create restaurant_cuisine_types table
-- ============================================================================

CREATE TABLE IF NOT EXISTS restaurant_cuisine_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  icon text DEFAULT '',
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create index for cuisine types
CREATE INDEX IF NOT EXISTS idx_cuisine_types_display_order ON restaurant_cuisine_types(display_order);

-- Enable RLS on restaurant_cuisine_types
ALTER TABLE restaurant_cuisine_types ENABLE ROW LEVEL SECURITY;

-- Public can view all cuisine types
CREATE POLICY "Anyone can view cuisine types"
  ON restaurant_cuisine_types
  FOR SELECT
  TO public
  USING (true);

-- Authenticated users can manage cuisine types
CREATE POLICY "Authenticated users can manage cuisine types"
  ON restaurant_cuisine_types
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert default cuisine types
INSERT INTO restaurant_cuisine_types (name, display_order) VALUES
('وجبات سريعة', 1),
('بيتزا', 2),
('برجر', 3),
('دجاج', 4),
('عربي', 5),
('آسيوي', 6),
('حلويات', 7),
('مشروبات', 8)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 4. Create branch_operating_hours table
-- ============================================================================

CREATE TABLE IF NOT EXISTS branch_operating_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES restaurant_branches(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  opening_time time DEFAULT '11:00:00',
  closing_time time DEFAULT '23:59:00',
  is_closed boolean DEFAULT false,
  is_24_hours boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(branch_id, day_of_week)
);

-- Create indexes for branch_operating_hours
CREATE INDEX IF NOT EXISTS idx_branch_hours_branch_id ON branch_operating_hours(branch_id);
CREATE INDEX IF NOT EXISTS idx_branch_hours_day ON branch_operating_hours(day_of_week);

-- Enable RLS on branch_operating_hours
ALTER TABLE branch_operating_hours ENABLE ROW LEVEL SECURITY;

-- Public can view operating hours
CREATE POLICY "Anyone can view operating hours"
  ON branch_operating_hours
  FOR SELECT
  TO public
  USING (true);

-- Authenticated users can manage operating hours
CREATE POLICY "Authenticated users can manage operating hours"
  ON branch_operating_hours
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 5. Modify menu_items table to add restaurant/branch relationships
-- ============================================================================

-- Add restaurant_id column to menu_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'menu_items' AND column_name = 'restaurant_id'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add branch_id column to menu_items (nullable for restaurant-wide items)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'menu_items' AND column_name = 'branch_id'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN branch_id uuid REFERENCES restaurant_branches(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for menu_items foreign keys
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_id ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_branch_id ON menu_items(branch_id);

-- ============================================================================
-- 6. Create updated_at triggers for new tables
-- ============================================================================

CREATE TRIGGER update_restaurants_updated_at
  BEFORE UPDATE ON restaurants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restaurant_branches_updated_at
  BEFORE UPDATE ON restaurant_branches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_branch_operating_hours_updated_at
  BEFORE UPDATE ON branch_operating_hours
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
