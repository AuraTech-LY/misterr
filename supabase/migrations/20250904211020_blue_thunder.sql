/*
  # Add delivery restriction times to operating hours

  1. Schema Changes
    - Add `delivery_start_time` column to operating_hours table
    - Add `delivery_end_time` column to operating_hours table
    - Add `delivery_available` boolean column to operating_hours table

  2. Description
    - `delivery_start_time`: Time when delivery service starts (NULL means delivery available from opening)
    - `delivery_end_time`: Time when delivery service ends (NULL means delivery available until closing)
    - `delivery_available`: Whether delivery is available at all for this branch (default true)

  3. Logic
    - If delivery_available is false, only pickup is available
    - If delivery times are set, delivery is only available during those hours
    - Outside delivery hours, only pickup is available
*/

-- Add delivery restriction columns to operating_hours table
DO $$
BEGIN
  -- Add delivery_start_time column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'operating_hours' AND column_name = 'delivery_start_time'
  ) THEN
    ALTER TABLE operating_hours ADD COLUMN delivery_start_time time without time zone;
  END IF;

  -- Add delivery_end_time column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'operating_hours' AND column_name = 'delivery_end_time'
  ) THEN
    ALTER TABLE operating_hours ADD COLUMN delivery_end_time time without time zone;
  END IF;

  -- Add delivery_available column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'operating_hours' AND column_name = 'delivery_available'
  ) THEN
    ALTER TABLE operating_hours ADD COLUMN delivery_available boolean DEFAULT true;
  END IF;
END $$;