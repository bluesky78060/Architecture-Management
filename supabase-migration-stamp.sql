-- Add stamp_image column to company_info table
-- This column stores the company stamp image as Base64 text
-- Run this SQL in Supabase Dashboard -> SQL Editor

ALTER TABLE company_info
ADD COLUMN IF NOT EXISTS stamp_image TEXT;

-- Add comment for documentation
COMMENT ON COLUMN company_info.stamp_image IS 'Company stamp image stored as Base64 data URL';
