-- Fix avatar storage policies for easier upload
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

-- Create more permissive policies for testing
CREATE POLICY "Allow authenticated uploads to avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Allow public read of avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Allow authenticated update of avatars"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "Allow authenticated delete of avatars"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars');

-- Ensure the bucket is public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'avatars';
