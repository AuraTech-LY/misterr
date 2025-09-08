/*
  # Add Mister Burgerito Airport branch support

  1. New Columns
    - `available_burgerito_airport` (boolean) - Indicates if item is available at Mister Burgerito Airport branch
  
  2. Changes
    - Add column to menu_items table with default value false
    - Add index for performance optimization
  
  3. Security
    - No RLS changes needed as existing policies cover new column
*/

-- Add the available_burgerito_airport column to menu_items table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'available_burgerito_airport'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN available_burgerito_airport BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_menu_items_burgerito_airport 
ON menu_items (available_burgerito_airport);