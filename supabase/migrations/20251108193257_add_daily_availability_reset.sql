/*
  # Add Daily Availability Reset System
  
  1. New Columns
    - `availability_last_reset_at` (timestamptz) - Tracks when availability was last reset
  
  2. New Functions
    - `reset_daily_availability()` - Function to reset all items to available
    - Scheduled trigger using pg_cron extension
  
  3. Changes
    - Adds column to track reset time
    - Creates function to reset availability daily at midnight
    - Sets up automatic daily reset at 00:00 (midnight)
  
  4. Notes
    - All menu items will be automatically set to available at the start of each day
    - Manual toggles during the day are preserved until next reset
    - Reset happens at midnight local time
*/

-- Add column to track last reset time
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'availability_last_reset_at'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN availability_last_reset_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create function to reset all item availability daily
CREATE OR REPLACE FUNCTION reset_daily_availability()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Reset all menu items to available
  UPDATE menu_items
  SET 
    is_available = true,
    availability_last_reset_at = now(),
    updated_at = now()
  WHERE is_available = false;
  
  RAISE NOTICE 'Daily availability reset completed. % items reset to available.', 
    (SELECT COUNT(*) FROM menu_items WHERE is_available = false);
END;
$$;

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily reset at midnight (00:00)
-- Remove existing schedule if it exists
SELECT cron.unschedule('daily-availability-reset') 
WHERE EXISTS (
  SELECT 1 FROM cron.job 
  WHERE jobname = 'daily-availability-reset'
);

-- Create new schedule
SELECT cron.schedule(
  'daily-availability-reset',
  '0 0 * * *',  -- At 00:00 every day
  'SELECT reset_daily_availability();'
);