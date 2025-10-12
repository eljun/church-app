-- Fix Transfer Request RLS Policies
-- Add missing superadmin insert policy for transfer_requests

-- Superadmin can create transfer requests from any church
CREATE POLICY "Superadmin can create any transfer request"
  ON transfer_requests FOR INSERT
  WITH CHECK (is_superadmin());
