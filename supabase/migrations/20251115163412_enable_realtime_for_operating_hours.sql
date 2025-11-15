/*
  # Enable Realtime for Operating Hours

  1. Changes
    - Enable realtime publication for operating_hours table to allow real-time subscriptions
    - This allows clients to receive instant updates when operating hours change

  2. Security
    - Realtime respects existing RLS policies
    - Public can already read operating hours via RLS policy
*/

-- Enable realtime for operating_hours table
ALTER publication supabase_realtime ADD TABLE operating_hours;
