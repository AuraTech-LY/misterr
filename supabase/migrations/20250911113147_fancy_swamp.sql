/*
  # Add image filter columns to menu_items table

  1. New Columns
    - `image_brightness` (real, default 1.2) - Controls image brightness filter
    - `image_contrast` (real, default 1.1) - Controls image contrast filter

  2. Changes
    - Add brightness and contrast columns to existing menu_items table
    - Set default values to match application defaults
    - Make columns nullable to avoid issues with existing data

  3. Notes
    - These columns will store CSS filter values for individual menu item images
    - Default values match the application's current filter settings
*/

-- Add image brightness column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'image_brightness'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN image_brightness real DEFAULT 1.2;
  END IF;
END $$;

-- Add image contrast column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'image_contrast'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN image_contrast real DEFAULT 1.1;
  END IF;
END $$;