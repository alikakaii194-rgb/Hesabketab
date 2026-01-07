-- ====================================================================
-- HESAB KETAB: STORAGE SETUP SCRIPT
-- ====================================================================
-- This script sets up the storage bucket and its access policies.
-- It should be run once.
-- ====================================================================

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('hesabketabsatl', 'hesabketabsatl', true)
ON CONFLICT (id) DO NOTHING;

-- Define policies for the 'hesabketabsatl' bucket

-- 1. Allow anonymous read access to all files
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO anon, authenticated
USING ( bucket_id = 'hesabketabsatl' );

-- 2. Allow authenticated users to upload files
DROP POLICY IF EXISTS "Allow authenticated users to upload" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'hesabketabsatl' );

-- 3. Allow authenticated users to update their own files
DROP POLICY IF EXISTS "Allow authenticated users to update their own files" ON storage.objects;
CREATE POLICY "Allow authenticated users to update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING ( auth.uid() = owner )
WITH CHECK ( auth.uid() = owner );

-- 4. Allow authenticated users to delete their own files
DROP POLICY IF EXISTS "Allow authenticated users to delete their own files" ON storage.objects;
CREATE POLICY "Allow authenticated users to delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING ( auth.uid() = owner );

-- Grant usage on the schema to the necessary roles
GRANT USAGE ON SCHEMA storage TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA storage TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA storage TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA storage TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA storage GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA storage GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA storage GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
