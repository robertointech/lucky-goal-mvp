-- Add goalkeeper_logo column to tournaments (base64 string)
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS goalkeeper_logo TEXT DEFAULT NULL;

-- Create wallet_registry table
CREATE TABLE IF NOT EXISTS wallet_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  nickname TEXT NOT NULL,
  avatar TEXT NOT NULL,
  created_via TEXT NOT NULL CHECK (created_via IN ('passkey', 'external')),
  tournament_code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for lookups by wallet address
CREATE INDEX IF NOT EXISTS idx_wallet_registry_address ON wallet_registry(wallet_address);

-- Index for lookups by tournament
CREATE INDEX IF NOT EXISTS idx_wallet_registry_tournament ON wallet_registry(tournament_code);

-- RLS policies
ALTER TABLE wallet_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert wallet_registry"
  ON wallet_registry FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read wallet_registry"
  ON wallet_registry FOR SELECT
  USING (true);
