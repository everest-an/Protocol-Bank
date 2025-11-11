-- Migration: Add category field to stream_payments table
-- Date: 2025-11-12
-- Purpose: Support category filtering for stream payments

-- Add category column
ALTER TABLE stream_payments 
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'Other';

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_stream_payments_category 
ON stream_payments(category);

-- Add comment
COMMENT ON COLUMN stream_payments.category IS 'Payment category: AI Services, Marketing, Logistics, Raw Materials, Software, Consulting, Other';

-- Update existing records with default category
UPDATE stream_payments 
SET category = 'Other' 
WHERE category IS NULL;
