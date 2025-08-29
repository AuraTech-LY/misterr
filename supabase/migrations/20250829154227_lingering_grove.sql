/*
  # Add display_order column to categories table

  1. Schema Changes
    - Add `display_order` column to `categories` table
    - Set default value to allow existing categories to work
    - Update existing categories with sequential order values

  2. Data Migration
    - Assign sequential display_order values to existing categories
    - Order by name alphabetically for initial ordering
*/

-- Add display_order column to categories table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE categories ADD COLUMN display_order integer;
  END IF;
END $$;

-- Update existing categories with sequential order values
-- Order them alphabetically by name for initial ordering
WITH ordered_categories AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY name) as new_order
  FROM categories
  WHERE display_order IS NULL
)
UPDATE categories 
SET display_order = ordered_categories.new_order
FROM ordered_categories
WHERE categories.id = ordered_categories.id;

-- Create index for better performance on ordering queries
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories (display_order);