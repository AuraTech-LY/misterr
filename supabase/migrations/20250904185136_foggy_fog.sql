/*
  # Create operating hours table

  1. New Tables
    - `operating_hours`
      - `id` (uuid, primary key)
      - `branch_id` (text, unique) - References branch ID from application
      - `opening_time` (time) - Opening time in HH:MM format
      - `closing_time` (time) - Closing time in HH:MM format
      - `is_24_hours` (boolean) - Whether the branch operates 24 hours
      - `is_closed` (boolean) - Whether the branch is temporarily closed
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `operating_hours` table
    - Add policy for public to read operating hours
    - Add policy for authenticated users to manage operating hours

  3. Indexes
    - Add index on branch_id for fast lookups
    - Add unique constraint on branch_id
*/

CREATE TABLE IF NOT EXISTS operating_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id text UNIQUE NOT NULL,
  opening_time time NOT NULL DEFAULT '11:00:00',
  closing_time time NOT NULL DEFAULT '23:59:00',
  is_24_hours boolean DEFAULT false,
  is_closed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE operating_hours ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view operating hours"
  ON operating_hours
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage operating hours"
  ON operating_hours
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_operating_hours_branch_id 
  ON operating_hours (branch_id);

-- Create trigger for updated_at
CREATE TRIGGER update_operating_hours_updated_at
  BEFORE UPDATE ON operating_hours
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default operating hours for existing branches
INSERT INTO operating_hours (branch_id, opening_time, closing_time, is_24_hours, is_closed) VALUES
  ('airport', '11:00:00', '23:59:00', false, false),
  ('balaoun', '11:00:00', '23:59:00', false, false),
  ('dollar', '11:00:00', '03:00:00', false, false)
ON CONFLICT (branch_id) DO NOTHING;