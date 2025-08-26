/*
  # Create categories table

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text, unique, not null)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `categories` table
    - Add policy for public to read categories
    - Add policy for authenticated users to manage categories

  3. Initial Data
    - Insert default categories (برجر, دجاج, مشروبات, حلويات)
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view categories"
  ON categories
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO categories (name) VALUES
  ('برجر'),
  ('دجاج'),
  ('مشروبات'),
  ('حلويات')
ON CONFLICT (name) DO NOTHING;