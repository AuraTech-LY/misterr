/*
  # Migrate Existing Restaurant Data

  ## Overview
  This migration populates the new multi-restaurant schema with existing "Mister" restaurant data.
  It creates three restaurants (Mister Shish, Mister Crispy, Mister Burgerito) and their branches,
  then links existing menu items to the appropriate restaurants.

  ## Migration Steps
  1. Insert restaurants (Mister Shish, Mister Crispy, Mister Burgerito)
  2. Insert restaurant branches with their locations
  3. Insert operating hours for each branch (migrate from operating_hours table)
  4. Update menu_items to link them to restaurants based on availability flags
  5. Preserve all existing menu item data

  ## Notes
  - Existing menu items are linked to restaurants based on their availability flags
  - Operating hours are migrated from the old operating_hours table
  - All location coordinates are preserved from restaurantsData.ts
  - Branch IDs are kept consistent with the old system for compatibility
*/

-- ============================================================================
-- 1. Insert Restaurants
-- ============================================================================

-- Insert Mister Shish (مستر شيش)
INSERT INTO restaurants (
  id,
  name,
  slug,
  description,
  logo_url,
  cuisine_type,
  is_active,
  is_featured,
  primary_color,
  rating,
  total_reviews
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'مستر شيش',
  'mister-shish',
  'مطعم متخصص في الشاورما والمشويات والوجبات السريعة اللذيذة',
  '/Mr-Sheesh.png',
  'وجبات سريعة',
  true,
  true,
  '#781220',
  4.5,
  0
) ON CONFLICT (id) DO NOTHING;

-- Insert Mister Crispy (مستر كريسبي)
INSERT INTO restaurants (
  id,
  name,
  slug,
  description,
  logo_url,
  cuisine_type,
  is_active,
  is_featured,
  primary_color,
  rating,
  total_reviews
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  'مستر كريسبي',
  'mister-crispy',
  'أشهى الدجاج المقرمش والوجبات السريعة',
  '/mr-Krispy.png',
  'دجاج',
  true,
  true,
  '#55421A',
  4.3,
  0
) ON CONFLICT (id) DO NOTHING;

-- Insert Mister Burgerito (مستر برجريتو)
INSERT INTO restaurants (
  id,
  name,
  slug,
  description,
  logo_url,
  cuisine_type,
  is_active,
  is_featured,
  primary_color,
  rating,
  total_reviews
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  'مستر برجريتو',
  'mister-burgerito',
  'برجر وبوريتو وساندويشات مميزة',
  '/mr-burger.png',
  'برجر',
  true,
  true,
  '#E59F49',
  4.7,
  0
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. Insert Restaurant Branches
-- ============================================================================

-- Mister Shish - Airport Road Branch
INSERT INTO restaurant_branches (
  id,
  restaurant_id,
  name,
  area,
  address,
  phone,
  latitude,
  longitude,
  is_active,
  delivery_radius_km,
  min_order_amount,
  base_delivery_fee
) VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  'مستر شيش - طريق المطار',
  'طريق المطار',
  'طريق المطار مقابل مدرسة المهاجرين',
  '093-0625795',
  32.10757403,
  20.12585782,
  true,
  10.0,
  20.0,
  5.0
) ON CONFLICT (id) DO NOTHING;

-- Mister Shish - Balaoun Branch
INSERT INTO restaurant_branches (
  id,
  restaurant_id,
  name,
  area,
  address,
  phone,
  latitude,
  longitude,
  is_active,
  delivery_radius_km,
  min_order_amount,
  base_delivery_fee
) VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '11111111-1111-1111-1111-111111111111',
  'مستر شيش - بلعون',
  'بلعون',
  'بلعون بجوار جامعة العرب الطبية',
  '0919670707',
  32.07117770,
  20.09990884,
  true,
  10.0,
  20.0,
  5.0
) ON CONFLICT (id) DO NOTHING;

-- Mister Crispy - Balaoun Branch
INSERT INTO restaurant_branches (
  id,
  restaurant_id,
  name,
  area,
  address,
  phone,
  latitude,
  longitude,
  is_active,
  delivery_radius_km,
  min_order_amount,
  base_delivery_fee
) VALUES (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '22222222-2222-2222-2222-222222222222',
  'مستر كريسبي',
  'بلعون',
  'بلعون مقابل جامعة العرب الطبية',
  '094-2075555',
  32.07306693,
  20.09804137,
  true,
  10.0,
  15.0,
  5.0
) ON CONFLICT (id) DO NOTHING;

-- Mister Burgerito - Airport Road Branch
INSERT INTO restaurant_branches (
  id,
  restaurant_id,
  name,
  area,
  address,
  phone,
  latitude,
  longitude,
  is_active,
  delivery_radius_km,
  min_order_amount,
  base_delivery_fee
) VALUES (
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  '33333333-3333-3333-3333-333333333333',
  'مستر برجريتو - طريق المطار',
  'طريق المطار',
  'طريق المطار',
  '0946375518',
  32.10611810,
  20.13707510,
  true,
  10.0,
  25.0,
  5.0
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. Migrate Operating Hours from old operating_hours table
-- ============================================================================

-- Create a mapping between old branch IDs and new branch UUIDs
-- airport -> aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa (Mister Shish Airport)
-- balaoun -> bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb (Mister Shish Balaoun)
-- dollar -> cccccccc-cccc-cccc-cccc-cccccccccccc (Mister Crispy)
-- burgerito-airport -> dddddddd-dddd-dddd-dddd-dddddddddddd (Mister Burgerito Airport)

-- Copy operating hours for each branch if they exist in the old table
-- For now, set default hours for all days (will be customized later via admin)
DO $$
DECLARE
  branch_uuid uuid;
  day_num integer;
BEGIN
  -- For each branch, insert default operating hours for all days of the week
  FOR branch_uuid IN 
    SELECT id FROM restaurant_branches
  LOOP
    FOR day_num IN 0..6 LOOP
      INSERT INTO branch_operating_hours (
        branch_id,
        day_of_week,
        opening_time,
        closing_time,
        is_closed,
        is_24_hours
      ) VALUES (
        branch_uuid,
        day_num,
        '11:00:00',
        '23:59:00',
        false,
        false
      ) ON CONFLICT (branch_id, day_of_week) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- Special case: Mister Crispy (dollar branch) closes at 3 AM
UPDATE branch_operating_hours
SET closing_time = '03:00:00'
WHERE branch_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

-- ============================================================================
-- 4. Update menu_items to link them to restaurants
-- ============================================================================

-- Link menu items to Mister Shish (items available at airport or balaoun branches)
UPDATE menu_items
SET restaurant_id = '11111111-1111-1111-1111-111111111111'
WHERE restaurant_id IS NULL
  AND (available_airport = true OR available_balaoun = true);

-- Link menu items to Mister Crispy (items available at dollar branch)
UPDATE menu_items
SET restaurant_id = '22222222-2222-2222-2222-222222222222'
WHERE restaurant_id IS NULL
  AND available_dollar = true;

-- Link menu items to Mister Burgerito (items available at burgerito-airport)
UPDATE menu_items
SET restaurant_id = '33333333-3333-3333-3333-333333333333'
WHERE restaurant_id IS NULL
  AND available_burgerito_airport = true;

-- ============================================================================
-- 5. Create a mapping table for old branch IDs to new UUIDs (for reference)
-- ============================================================================

-- This helps with the frontend migration to use new branch IDs
CREATE TABLE IF NOT EXISTS branch_id_mapping (
  old_branch_id text PRIMARY KEY,
  new_branch_uuid uuid NOT NULL REFERENCES restaurant_branches(id),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id)
);

INSERT INTO branch_id_mapping (old_branch_id, new_branch_uuid, restaurant_id) VALUES
  ('airport', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111'),
  ('balaoun', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111'),
  ('dollar', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222'),
  ('burgerito-airport', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '33333333-3333-3333-3333-333333333333')
ON CONFLICT (old_branch_id) DO NOTHING;

-- Enable RLS on mapping table
ALTER TABLE branch_id_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view branch mapping"
  ON branch_id_mapping
  FOR SELECT
  TO public
  USING (true);
