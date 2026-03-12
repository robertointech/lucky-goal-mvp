-- Add custom_questions JSONB field to tournaments
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS custom_questions JSONB DEFAULT NULL;
