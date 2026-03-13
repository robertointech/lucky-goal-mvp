CREATE TABLE IF NOT EXISTS medals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES global_players(id) ON DELETE CASCADE,
  medal_type TEXT NOT NULL,
  tournament_code TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_medals_unique ON medals(player_id, medal_type, tournament_code);
CREATE INDEX IF NOT EXISTS idx_medals_player ON medals(player_id);
