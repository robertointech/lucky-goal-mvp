-- Global Players table (ranking + XP)
CREATE TABLE IF NOT EXISTS global_players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nickname TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT '⚽',
  total_xp INTEGER NOT NULL DEFAULT 0,
  total_games INTEGER NOT NULL DEFAULT 0,
  total_wins INTEGER NOT NULL DEFAULT 0,
  total_goals INTEGER NOT NULL DEFAULT 0,
  wallet_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: same nickname + wallet = same player
CREATE UNIQUE INDEX IF NOT EXISTS idx_global_players_nickname_wallet
  ON global_players (nickname, COALESCE(wallet_address, ''));

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES global_players(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW()
);

-- One achievement of each type per player
CREATE UNIQUE INDEX IF NOT EXISTS idx_achievements_player_type
  ON achievements (player_id, achievement_type);

-- Enable RLS
ALTER TABLE global_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "global_players_select" ON global_players FOR SELECT USING (true);
CREATE POLICY "global_players_insert" ON global_players FOR INSERT WITH CHECK (true);
CREATE POLICY "global_players_update" ON global_players FOR UPDATE USING (true);

CREATE POLICY "achievements_select" ON achievements FOR SELECT USING (true);
CREATE POLICY "achievements_insert" ON achievements FOR INSERT WITH CHECK (true);

-- Index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_global_players_xp ON global_players (total_xp DESC);
