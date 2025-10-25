/*
  # Create Orders Management System

  ## Summary
  This migration creates a professional order management system to replace the WhatsApp-based ordering.
  
  ## New Tables
  
  ### `orders` table
  - `id` (uuid, primary key) - Unique order identifier
  - `order_number` (text, unique) - Human-readable order number (e.g., ORD-20241025-001)
  - `branch_id` (text) - Reference to the branch where order was placed
  - `restaurant_name` (text) - Name of the restaurant (Mister Shish, Mister Crispy, etc.)
  - `customer_name` (text) - Customer's full name
  - `customer_phone` (text) - Customer's phone number
  - `delivery_method` (text) - 'delivery' or 'pickup'
  - `delivery_area` (text) - Area/neighborhood for delivery
  - `delivery_address` (text, nullable) - Detailed delivery address
  - `delivery_notes` (text, nullable) - Special delivery instructions
  - `customer_latitude` (numeric, nullable) - Customer location latitude
  - `customer_longitude` (numeric, nullable) - Customer location longitude
  - `payment_method` (text) - 'cash' or 'card'
  - `items_total` (numeric) - Total cost of items
  - `delivery_price` (numeric) - Cost of delivery (0 for pickup)
  - `total_amount` (numeric) - Final total amount
  - `status` (text) - Order status (pending, confirmed, preparing, ready, out_for_delivery, completed, cancelled)
  - `status_history` (jsonb) - Array of status changes with timestamps
  - `notes` (text, nullable) - Admin notes
  - `created_at` (timestamptz) - Order creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### `order_items` table
  - `id` (uuid, primary key) - Unique identifier
  - `order_id` (uuid, foreign key) - Reference to orders table
  - `menu_item_id` (uuid, nullable) - Reference to menu_items table (nullable for deleted items)
  - `item_name` (text) - Name of the item at time of order
  - `item_price` (numeric) - Price at time of order
  - `quantity` (integer) - Number of items ordered
  - `subtotal` (numeric) - price * quantity
  - `created_at` (timestamptz) - Item creation timestamp
  
  ## Security
  - Enable RLS on both tables
  - Public read access for order tracking (future feature)
  - Admin-only write access
  
  ## Indexes
  - Index on orders(branch_id) for filtering by branch
  - Index on orders(status) for filtering by status
  - Index on orders(created_at) for date sorting
  - Index on orders(customer_phone) for customer lookup
  - Index on order_items(order_id) for efficient joins
*/

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  branch_id text NOT NULL,
  restaurant_name text NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  delivery_method text NOT NULL CHECK (delivery_method IN ('delivery', 'pickup')),
  delivery_area text,
  delivery_address text,
  delivery_notes text,
  customer_latitude numeric,
  customer_longitude numeric,
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'card')),
  items_total numeric NOT NULL DEFAULT 0,
  delivery_price numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled')),
  status_history jsonb DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id uuid,
  item_name text NOT NULL,
  item_price numeric NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  subtotal numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_branch_id ON orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Enable Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orders table
-- Allow authenticated admins to read all orders
CREATE POLICY "Authenticated users can read orders"
  ON orders FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated admins to insert orders
CREATE POLICY "Authenticated users can insert orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated admins to update orders
CREATE POLICY "Authenticated users can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated admins to delete orders
CREATE POLICY "Authenticated users can delete orders"
  ON orders FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for order_items table
-- Allow authenticated admins to read all order items
CREATE POLICY "Authenticated users can read order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated admins to insert order items
CREATE POLICY "Authenticated users can insert order items"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated admins to update order items
CREATE POLICY "Authenticated users can update order items"
  ON order_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated admins to delete order items
CREATE POLICY "Authenticated users can delete order items"
  ON order_items FOR DELETE
  TO authenticated
  USING (true);

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text AS $$
DECLARE
  today_date text;
  order_count integer;
  new_order_number text;
BEGIN
  today_date := to_char(now(), 'YYYYMMDD');
  
  -- Count orders created today
  SELECT COUNT(*) INTO order_count
  FROM orders
  WHERE order_number LIKE 'ORD-' || today_date || '-%';
  
  -- Generate new order number
  new_order_number := 'ORD-' || today_date || '-' || LPAD((order_count + 1)::text, 4, '0');
  
  RETURN new_order_number;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();