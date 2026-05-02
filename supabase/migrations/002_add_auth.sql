-- ============================================================
-- Migration: 002_add_auth
-- Adds user_id (auth.uid()) to all tables and creates
-- category_settings table. Updates RLS to scope per-user.
-- ============================================================

-- ── Add user_id to existing tables ───────────────────────────────────────────

alter table questions  add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table sessions   add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table teams      add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table rounds     add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table activities add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- Indexes for user-scoped queries
create index if not exists questions_user_id  on questions  (user_id) where deleted_at is null;
create index if not exists sessions_user_id   on sessions   (user_id) where deleted_at is null;
create index if not exists teams_user_id      on teams      (user_id);
create index if not exists rounds_user_id     on rounds     (user_id);
create index if not exists activities_user_id on activities (user_id);

-- ── Category settings ─────────────────────────────────────────────────────────
-- Stores admin-configured scoring and timing overrides per category, per user.

create table if not exists category_settings (
  id            text        primary key,          -- uid from client
  user_id       uuid        not null references auth.users(id) on delete cascade,
  category_id   text        not null,

  -- Scoring
  points_correct  int     not null default 10,
  points_wrong    int     not null default 0,
  steal_points    int     not null default 7,

  -- Timers
  answer_time_secs  int   not null default 30,
  steal_time_secs   int   not null default 10,
  hot_seat_time_secs int  not null default 60,

  -- Sync fields
  created_at    bigint      not null,
  updated_at    bigint      not null,
  deleted_at    bigint,
  inserted_at   timestamptz default now(),

  unique (user_id, category_id)
);

create index if not exists category_settings_user_id on category_settings (user_id);

-- ── Drop the old open-access policies ────────────────────────────────────────

drop policy if exists "public_all_questions"  on questions;
drop policy if exists "public_all_sessions"   on sessions;
drop policy if exists "public_all_teams"      on teams;
drop policy if exists "public_all_rounds"     on rounds;
drop policy if exists "public_all_activities" on activities;

-- ── New per-user RLS policies ─────────────────────────────────────────────────
-- Each user can only read and write their own rows.

-- Questions: own rows + public read of others' questions (shared question bank)
create policy "own_questions_write" on questions
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "read_all_questions" on questions
  for select
  using (true);   -- anyone can read questions (shared bank)

-- Sessions: strictly own
create policy "own_sessions" on sessions
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Teams: strictly own
create policy "own_teams" on teams
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Rounds: strictly own
create policy "own_rounds" on rounds
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Activities: strictly own
create policy "own_activities" on activities
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Category settings: strictly own
alter table category_settings enable row level security;

create policy "own_category_settings" on category_settings
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
