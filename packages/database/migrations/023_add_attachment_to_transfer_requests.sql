-- Add attachment_url column to transfer_requests table
-- This stores the uploaded transfer request letter (PDF/document)

ALTER TABLE transfer_requests
ADD COLUMN IF NOT EXISTS attachment_url TEXT;

COMMENT ON COLUMN transfer_requests.attachment_url IS 'URL to the uploaded transfer request letter document';
