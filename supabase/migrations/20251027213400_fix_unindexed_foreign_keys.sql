/*
  # Fix Unindexed Foreign Keys

  1. Changes
    - Add index on branch_id_mapping.new_branch_uuid (foreign key to restaurant_branches)
    - Add index on branch_id_mapping.restaurant_id (foreign key to restaurants)
  
  2. Security
    - Improves query performance
    - Prevents slow joins on foreign key relationships
*/

-- Add index for foreign key to restaurant_branches
CREATE INDEX IF NOT EXISTS idx_branch_id_mapping_new_branch_uuid 
ON branch_id_mapping(new_branch_uuid);

-- Add index for foreign key to restaurants
CREATE INDEX IF NOT EXISTS idx_branch_id_mapping_restaurant_id 
ON branch_id_mapping(restaurant_id);
