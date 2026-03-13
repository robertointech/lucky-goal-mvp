CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_code TEXT NOT NULL,
  sender_wallet TEXT NOT NULL,
  recipient_wallet TEXT,
  message_text TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_wallet);
CREATE INDEX IF NOT EXISTS idx_messages_tournament ON messages(tournament_code);
