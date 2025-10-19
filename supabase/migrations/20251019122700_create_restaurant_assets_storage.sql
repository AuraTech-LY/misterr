/*
  # Create Restaurant Assets Storage Bucket

  1. Storage Setup
    - Create a public storage bucket named 'restaurant-assets'
    - Set up policies for authenticated users to upload images
    - Allow public read access for all users to view images

  2. Security
    - Authenticated users can upload images (INSERT)
    - Authenticated users can update their own images (UPDATE)
    - Authenticated users can delete their own images (DELETE)
    - Public users can view images (SELECT)
    - File size limit: 5MB per file
    - Allowed file types: image/jpeg, image/png, image/gif, image/webp
*/

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('restaurant-assets', 'restaurant-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist (to allow re-running migration)
DROP POLICY IF EXISTS "Public can view restaurant images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload restaurant images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update restaurant images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete restaurant images" ON storage.objects;

-- Allow public access to view images
CREATE POLICY "Public can view restaurant images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'restaurant-assets');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload restaurant images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'restaurant-assets'
  AND (storage.foldername(name))[1] = 'restaurant-images'
);

-- Allow authenticated users to update images
CREATE POLICY "Authenticated users can update restaurant images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'restaurant-assets')
WITH CHECK (bucket_id = 'restaurant-assets');

-- Allow authenticated users to delete images
CREATE POLICY "Authenticated users can delete restaurant images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'restaurant-assets');
