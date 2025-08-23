/*
  # Add Branch Availability Columns to Menu Items

  1. New Columns
    - `available_airport` (boolean) - Item available in Airport branch
    - `available_dollar` (boolean) - Item available in Dollar district branch  
    - `available_balaoun` (boolean) - Item available in Balaoun branch

  2. Changes
    - Add three boolean columns with default true values
    - Update existing menu items with realistic branch availability
    - Add indexes for better query performance

  3. Sample Data Updates
    - Set realistic availability patterns for each branch
    - Some items exclusive to certain branches
    - Most popular items available everywhere
*/

-- Add branch availability columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'available_airport'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN available_airport boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'available_dollar'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN available_dollar boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'available_balaoun'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN available_balaoun boolean DEFAULT true;
  END IF;
END $$;

-- Add indexes for branch availability queries
CREATE INDEX IF NOT EXISTS idx_menu_items_airport ON menu_items (available_airport);
CREATE INDEX IF NOT EXISTS idx_menu_items_dollar ON menu_items (available_dollar);
CREATE INDEX IF NOT EXISTS idx_menu_items_balaoun ON menu_items (available_balaoun);

-- Update existing items with realistic branch availability patterns
UPDATE menu_items SET 
  available_airport = true,
  available_dollar = true,
  available_balaoun = true
WHERE id IN (
  SELECT id FROM menu_items 
  WHERE name IN ('برجر المستر الفاخر', 'كوكا كولا', 'مياه معدنية')
);

-- Airport branch - focus on quick travel-friendly items
UPDATE menu_items SET 
  available_airport = true,
  available_dollar = false,
  available_balaoun = false
WHERE name LIKE '%سريع%' OR name LIKE '%مسافر%';

-- Dollar district - premium items and discounts
UPDATE menu_items SET 
  available_airport = false,
  available_dollar = true,
  available_balaoun = false
WHERE name LIKE '%ذهبي%' OR name LIKE '%فاخر%';

-- Balaoun - traditional and local items
UPDATE menu_items SET 
  available_airport = false,
  available_dollar = false,
  available_balaoun = true
WHERE name LIKE '%تقليدي%' OR name LIKE '%بلعون%';

-- Some items only in specific branches for variety
UPDATE menu_items SET 
  available_airport = true,
  available_dollar = false,
  available_balaoun = false
WHERE category = 'مشروبات' AND name = 'عصير البرتقال الطبيعي';

UPDATE menu_items SET 
  available_airport = false,
  available_dollar = true,
  available_balaoun = false
WHERE category = 'حلويات' AND name = 'كيك الشوكولاتة';

UPDATE menu_items SET 
  available_airport = false,
  available_dollar = false,
  available_balaoun = true
WHERE category = 'دجاج' AND name = 'دجاج مشوي بالأعشاب';