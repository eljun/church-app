# Church Images Upload - Setup Instructions

This document outlines the steps needed to set up the church image upload feature using Supabase Storage.

## 1. Run Database Migration

Apply the migration to add support for multiple images:

```bash
# In your Supabase SQL editor or via CLI
psql $DATABASE_URL < packages/database/migrations/002_add_church_images_array.sql
```

Or manually run the SQL from `packages/database/migrations/002_add_church_images_array.sql` in your Supabase SQL editor.

## 2. Create Supabase Storage Bucket

In your Supabase Dashboard:

1. Go to **Storage** → **Create a new bucket**
2. Name: `church-images`
3. Public bucket: **Yes** (or configure RLS policies)
4. Save

### Storage Policies (Optional - for security)

If you want to restrict uploads to authenticated users:

```sql
-- Policy: Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'church-images');

-- Policy: Allow public to read
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'church-images');

-- Policy: Allow users to delete their uploads
CREATE POLICY "Allow authenticated to delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'church-images');
```

## 3. Update Environment Variables (if needed)

The app uses the existing Supabase environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## 4. Test the Feature

1. Navigate to `/churches/new` or edit an existing church
2. Drag and drop images or click to select
3. Upload up to 5 images
4. The first image will be the primary photo
5. Reorder images by clicking "Set Primary" on any image

## Features

- ✅ Drag and drop file upload
- ✅ Multiple image support (up to 5 images)
- ✅ Image preview grid
- ✅ Primary image selection (first image)
- ✅ Image removal
- ✅ Upload progress indicator
- ✅ File type validation (PNG, JPG, JPEG, WEBP, GIF)
- ✅ Automatic storage in Supabase Storage
- ✅ Backward compatibility with existing `image_url` field

## Database Schema

The `churches` table now has:

- `images` (TEXT[]): Array of image URLs
- `image_url` (TEXT): Primary image URL (auto-synced from first image in array)

A trigger automatically keeps `image_url` in sync with the first image in the `images` array for backward compatibility.

## Component Usage

```tsx
import { ImageUpload } from '@/components/ui/image-upload'

<ImageUpload
  value={images}
  onChange={setImages}
  maxFiles={5}
  bucketName="church-images"
  path="churches"
/>
```

## Troubleshooting

### Images not uploading

1. Check Supabase Storage bucket exists and is accessible
2. Verify bucket name is correct (`church-images`)
3. Check browser console for errors
4. Verify Supabase credentials in `.env.local`

### Images not displaying

1. Ensure bucket is public or has proper RLS policies
2. Check image URLs are valid
3. Verify CORS settings in Supabase Storage

### Migration errors

1. Ensure you're connected to the correct database
2. Check if the `images` column already exists
3. Run migrations in order
