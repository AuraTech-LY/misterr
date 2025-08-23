/*
  # Create menu items table

  1. New Tables
    - `menu_items`
      - `id` (uuid, primary key)
      - `name` (text, menu item name in Arabic)
      - `description` (text, item description in Arabic)
      - `price` (decimal, price in Libyan Dinars)
      - `image_url` (text, URL to item image)
      - `category` (text, category like 'برجر', 'دجاج', etc.)
      - `is_popular` (boolean, whether item is marked as popular)
      - `is_available` (boolean, whether item is currently available)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `menu_items` table
    - Add policy for public read access (menu is public)
    - Add policy for authenticated admin users to manage menu items

  3. Indexes
    - Index on category for fast filtering
    - Index on is_available for active items
*/

CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  price decimal(10,2) NOT NULL CHECK (price > 0),
  image_url text NOT NULL,
  category text NOT NULL,
  is_popular boolean DEFAULT false,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Policy for public read access (anyone can view menu)
CREATE POLICY "Anyone can view menu items"
  ON menu_items
  FOR SELECT
  TO public
  USING (is_available = true);

-- Policy for authenticated users to manage menu (admin functionality)
CREATE POLICY "Authenticated users can manage menu"
  ON menu_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(is_available);
CREATE INDEX IF NOT EXISTS idx_menu_items_popular ON menu_items(is_popular);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample menu data
INSERT INTO menu_items (name, description, price, image_url, category, is_popular) VALUES
-- برجر
('برجر المستر الفاخر', 'لحم بقري مشوي، جبن شيدر، خس، طماطم، صوص خاص', 25.50, 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=400', 'برجر', true),
('برجر الدجاج المقرمش', 'قطعة دجاج مقرمشة، مايونيز، خس، مخلل', 22.00, 'https://images.pexels.com/photos/2282532/pexels-photo-2282532.jpeg?auto=compress&cs=tinysrgb&w=400', 'برجر', false),
('برجر اللحم المزدوج', 'قطعتان من اللحم البقري، جبن أمريكي، بصل مكرمل', 32.00, 'https://images.pexels.com/photos/3738730/pexels-photo-3738730.jpeg?auto=compress&cs=tinysrgb&w=400', 'برجر', true),

-- دجاج
('أجنحة الدجاج الحارة', '8 قطع من أجنحة الدجاج بالصوص الحار', 28.00, 'https://images.pexels.com/photos/60616/fried-chicken-chicken-fried-crunchy-60616.jpeg?auto=compress&cs=tinysrgb&w=400', 'دجاج', true),
('قطع الدجاج المقرمشة', '6 قطع دجاج مقرمشة مع صوص الثوم', 24.50, 'https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?auto=compress&cs=tinysrgb&w=400', 'دجاج', false),
('دجاج مشوي بالأعشاب', 'نصف دجاجة مشوية مع البهارات والأعشاب', 35.00, 'https://images.pexels.com/photos/106343/pexels-photo-106343.jpeg?auto=compress&cs=tinysrgb&w=400', 'دجاج', false),

-- مشروبات
('كوكا كولا', 'مشروب غازي منعش - حجم كبير', 4.50, 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg?auto=compress&cs=tinysrgb&w=400', 'مشروبات', false),
('عصير البرتقال الطبيعي', 'عصير برتقال طازج 100%', 8.00, 'https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg?auto=compress&cs=tinysrgb&w=400', 'مشروبات', false),
('مياه معدنية', 'زجاجة مياه معدنية طبيعية', 2.50, 'https://images.pexels.com/photos/327090/pexels-photo-327090.jpeg?auto=compress&cs=tinysrgb&w=400', 'مشروبات', false),

-- حلويات
('آيس كريم الفانيليا', 'كوب آيس كريم فانيليا كريمي', 12.00, 'https://images.pexels.com/photos/1362534/pexels-photo-1362534.jpeg?auto=compress&cs=tinysrgb&w=400', 'حلويات', false),
('كيك الشوكولاتة', 'قطعة كيك شوكولاتة غنية', 15.00, 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=400', 'حلويات', true),
('دونتس مزجج', 'دونتس طازج مع السكر المزجج', 8.50, 'https://images.pexels.com/photos/205961/pexels-photo-205961.jpeg?auto=compress&cs=tinysrgb&w=400', 'حلويات', false);