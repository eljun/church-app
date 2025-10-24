-- Add status column to transfer_history table to track approved/rejected transfers
ALTER TABLE transfer_history
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved'
CHECK (status IN ('approved', 'rejected'));

COMMENT ON COLUMN transfer_history.status IS 'Status of the transfer: approved or rejected';
