-- Add passkey_on_join column to tournaments
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS passkey_on_join BOOLEAN DEFAULT false;
