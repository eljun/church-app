-- Create storage bucket for transfer documents
-- This bucket stores uploaded transfer request letters (PDF, DOC, images)

-- Create the bucket (public so files can be accessed via URL)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'transfer-documents',
  'transfer-documents',
  true,
  10485760, -- 10MB in bytes
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ]
)
ON CONFLICT (id) DO NOTHING; -- Don't error if bucket already exists

-- Create RLS policies for the transfer-documents bucket
-- Note: DROP POLICY IF EXISTS is used to make this migration idempotent (safe to run multiple times)

-- Policy 1: Allow authenticated users to upload files
DROP POLICY IF EXISTS "Authenticated users can upload transfer documents" ON storage.objects;
CREATE POLICY "Authenticated users can upload transfer documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'transfer-documents');

-- Policy 2: Allow public read access (so files can be downloaded via URL)
DROP POLICY IF EXISTS "Public can view transfer documents" ON storage.objects;
CREATE POLICY "Public can view transfer documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'transfer-documents');

-- Policy 3: Allow authenticated users to delete files
DROP POLICY IF EXISTS "Authenticated users can delete transfer documents" ON storage.objects;
CREATE POLICY "Authenticated users can delete transfer documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'transfer-documents');

-- Policy 4: Allow authenticated users to update files
DROP POLICY IF EXISTS "Authenticated users can update transfer documents" ON storage.objects;
CREATE POLICY "Authenticated users can update transfer documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'transfer-documents');
