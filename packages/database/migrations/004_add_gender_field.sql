-- Add gender field to members table

-- Create gender enum
CREATE TYPE gender_type AS ENUM ('male', 'female');

-- Add gender column to members table
ALTER TABLE members
ADD COLUMN gender gender_type;

-- Create index for gender field (used in reports)
CREATE INDEX idx_members_gender ON members(gender);

-- Add comment
COMMENT ON COLUMN members.gender IS 'Gender of the member (male/female)';
