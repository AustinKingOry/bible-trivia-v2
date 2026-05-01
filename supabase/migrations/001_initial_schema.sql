-- ============================================================
-- Bible Trivia Game Management System — Supabase Schema
-- Migration: 001_initial_schema
-- ============================================================

-- Enable UUID extension (already available in Supabase)
create extension if not exists "uuid-ossp";

-- ────────────────────────────────────────────────────────────
-- QUESTIONS
-- Stores all admin-created and AI-generated questions.
-- Seed questions live only in the app bundle (data.ts).
-- ────────────────────────────────────────────────────────────
create table if not exists questions (
  id              text        primary key,          -- client-generated uid
  category_id     text        not null,
  difficulty      text        not null check (difficulty in ('all','easy','medium','hard')),
  question        text        not null,
  answer          text        not null,
  source          text        not null check (source in ('seed','manual','ai')),
  tags            text[]      default '{}',

  -- Category-specific structured fields (stored as jsonb for flexibility)
  quote_fields    jsonb,      -- { verseRef, partialVerse, completion }
  open_verse_fields jsonb,    -- { book, chapter, verse, verseText }
  true_false_fields jsonb,    -- { statement, isTrue, explanation }
  hot_seat_fields jsonb,      -- { challenge, acceptableAnswers[] }

  -- Future
  ai_generated    boolean     default false,
  source_ref      text,       -- PDF page, URL, etc.

  -- Sync fields
  created_at      bigint      not null,             -- Unix ms (matches client)
  updated_at      bigint      not null,
  deleted_at      bigint,                           -- soft delete

  -- Supabase audit
  inserted_at     timestamptz default now()
);

create index if not exists questions_category_difficulty
  on questions (category_id, difficulty)
  where deleted_at is null;

-- ────────────────────────────────────────────────────────────
-- SESSIONS
-- ────────────────────────────────────────────────────────────
create table if not exists sessions (
  id              text        primary key,
  name            text        not null,
  status          text        not null check (status in ('setup','active','ended')),
  active_round_id text,

  created_at      bigint      not null,
  updated_at      bigint      not null,
  deleted_at      bigint,
  inserted_at     timestamptz default now()
);

-- ────────────────────────────────────────────────────────────
-- TEAMS
-- ────────────────────────────────────────────────────────────
create table if not exists teams (
  id              text        primary key,
  session_id      text        not null references sessions(id) on delete cascade,
  name            text        not null,
  color           text        not null,
  players         text[]      default '{}',

  created_at      bigint      not null,
  updated_at      bigint      not null,
  deleted_at      bigint,
  inserted_at     timestamptz default now()
);

create index if not exists teams_session_id on teams (session_id);

-- ────────────────────────────────────────────────────────────
-- ROUNDS
-- ────────────────────────────────────────────────────────────
create table if not exists rounds (
  id                    text    primary key,
  session_id            text    not null references sessions(id) on delete cascade,
  name                  text    not null,
  category_id           text    not null,
  difficulty            text    not null,
  status                text    not null check (status in ('pending','active','completed')),
  question_limit        int,
  question_queue        text[]  default '{}',
  question_index        int     default 0,
  current_team_turn_id  text,
  turn_started_at       bigint,
  turn_expires_at       bigint,

  created_at            bigint  not null,
  updated_at            bigint  not null,
  deleted_at            bigint,
  inserted_at           timestamptz default now()
);

create index if not exists rounds_session_id on rounds (session_id);

-- ────────────────────────────────────────────────────────────
-- ACTIVITIES (score log)
-- ────────────────────────────────────────────────────────────
create table if not exists activities (
  id          text    primary key,
  session_id  text    not null references sessions(id) on delete cascade,
  round_id    text    not null references rounds(id)   on delete cascade,
  team_id     text    not null references teams(id)    on delete cascade,
  question_id text    not null,
  points      int     not null,
  reason      text    not null check (reason in ('correct','wrong','steal')),

  created_at  bigint  not null,
  updated_at  bigint  not null,
  deleted_at  bigint,
  inserted_at timestamptz default now()
);

create index if not exists activities_round_id   on activities (round_id);
create index if not exists activities_session_id on activities (session_id);
create index if not exists activities_team_id    on activities (team_id);

-- ────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- For now: public read/write (single-admin app, no auth).
-- Lock this down if you add multi-user auth later.
-- ────────────────────────────────────────────────────────────
alter table questions  enable row level security;
alter table sessions   enable row level security;
alter table teams      enable row level security;
alter table rounds     enable row level security;
alter table activities enable row level security;

-- Allow all operations for anonymous users (anon key)
create policy "public_all_questions"  on questions  for all using (true) with check (true);
create policy "public_all_sessions"   on sessions   for all using (true) with check (true);
create policy "public_all_teams"      on teams      for all using (true) with check (true);
create policy "public_all_rounds"     on rounds     for all using (true) with check (true);
create policy "public_all_activities" on activities for all using (true) with check (true);

-- ────────────────────────────────────────────────────────────
-- REALTIME (optional — enable for live scoreboard later)
-- ────────────────────────────────────────────────────────────
-- alter publication supabase_realtime add table activities;
-- alter publication supabase_realtime add table rounds;
