-- Migration: Add support for multiple church images
-- This migration changes the image_url column to images array

-- Step 1: Add new images column (array of text)
ALTER TABLE churches
ADD COLUMN images TEXT[] DEFAULT '{}';

-- Step 2: Migrate existing image_url data to images array
UPDATE churches
SET images = ARRAY[image_url]::TEXT[]
WHERE image_url IS NOT NULL AND image_url != '';

-- Step 3: Keep image_url for backward compatibility (can be removed later)
-- For now, we'll keep both columns and sync them

-- Step 4: Create a function to keep image_url in sync with first image
CREATE OR REPLACE FUNCTION sync_church_primary_image()
RETURNS TRIGGER AS $$
BEGIN
  -- Update image_url to be the first image in the array
  IF array_length(NEW.images, 1) > 0 THEN
    NEW.image_url := NEW.images[1];
  ELSE
    NEW.image_url := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger to automatically sync image_url
CREATE TRIGGER church_image_sync_trigger
BEFORE INSERT OR UPDATE OF images ON churches
FOR EACH ROW
EXECUTE FUNCTION sync_church_primary_image();

-- Add comment for documentation
COMMENT ON COLUMN churches.images IS 'Array of image URLs for the church. First image is the primary image.';
COMMENT ON COLUMN churches.image_url IS 'Primary church image URL (synced from first image in images array). Kept for backward compatibility.';
