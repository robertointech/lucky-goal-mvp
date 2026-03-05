-- Lucky Goal Multiplayer Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Tournaments table (winner_id FK added after players table)
create table if not exists tournaments (
  id uuid default uuid_generate_v4() primary key,
  code text unique not null,
  host_wallet text not null,
  prize_amount numeric default 0,
  status text default 'waiting' check (status in ('waiting', 'starting', 'question', 'penalty', 'results', 'finished')),
  current_question integer default 0,
  winner_id uuid,
  created_at timestamp with time zone default now()
);

-- Players table
create table if not exists players (
  id uuid default uuid_generate_v4() primary key,
  tournament_id uuid references tournaments(id) on delete cascade not null,
  nickname text not null,
  avatar text not null,
  score integer default 0,
  goals integer default 0,
  wallet_address text,
  is_winner boolean default false,
  created_at timestamp with time zone default now()
);

-- Add winner_id FK now that players table exists
alter table tournaments
  add constraint fk_winner
  foreign key (winner_id) references players(id) on delete set null;

-- Answers table
create table if not exists answers (
  id uuid default uuid_generate_v4() primary key,
  tournament_id uuid references tournaments(id) on delete cascade not null,
  player_id uuid references players(id) on delete cascade not null,
  question_index integer not null,
  is_correct boolean default false,
  time_ms integer default 0,
  created_at timestamp with time zone default now()
);

-- Indexes for performance
create index if not exists idx_players_tournament on players(tournament_id);
create index if not exists idx_answers_tournament on answers(tournament_id);
create index if not exists idx_answers_player on answers(player_id);
create index if not exists idx_tournaments_code on tournaments(code);

-- Enable Realtime on all tables
alter publication supabase_realtime add table tournaments;
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table answers;

-- Row Level Security (permissive for MVP)
alter table tournaments enable row level security;
alter table players enable row level security;
alter table answers enable row level security;

-- Allow anonymous access for MVP (tournaments are public by code)
create policy "Anyone can read tournaments" on tournaments for select using (true);
create policy "Anyone can insert tournaments" on tournaments for insert with check (true);
create policy "Anyone can update tournaments" on tournaments for update using (true);

create policy "Anyone can read players" on players for select using (true);
create policy "Anyone can insert players" on players for insert with check (true);
create policy "Anyone can update players" on players for update using (true);

create policy "Anyone can read answers" on answers for select using (true);
create policy "Anyone can insert answers" on answers for insert with check (true);
