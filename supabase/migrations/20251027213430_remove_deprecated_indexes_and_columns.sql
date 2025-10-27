/*
  # Remove Deprecated Indexes and Columns

  1. Changes
    - Drop indexes on old branch availability columns (no longer used)
    - Drop old branch availability columns from menu_items
    - These columns were replaced by branch_id foreign key relationship
  
  2. Security
    - Reduces database overhead from unused indexes
    - Cleans up deprecated schema
*/

-- Drop unused indexes on deprecated columns
DROP INDEX IF EXISTS idx_menu_items_airport;
DROP INDEX IF EXISTS idx_menu_items_balaoun;
DROP INDEX IF EXISTS idx_menu_items_burgerito_airport;

-- Drop deprecated columns (replaced by branch_id relationship)
ALTER TABLE menu_items DROP COLUMN IF EXISTS available_airport;
ALTER TABLE menu_items DROP COLUMN IF EXISTS available_balaoun;
ALTER TABLE menu_items DROP COLUMN IF EXISTS available_burgerito_airport;
ALTER TABLE menu_items DROP COLUMN IF EXISTS available_dollar;
