-- ============================================================
-- Migration: 004_image_game
-- Creates tables for the Image Game mode.
-- All tables are scoped to auth.uid() via RLS.
-- ============================================================

-- ── Image Questions ───────────────────────────────────────────────────────────
-- Shared question bank for image identification games.
-- Questions are publicly readable; only the owner may write.

create table if not exists image_questions (
  id            text        primary key,
  user_id       uuid        references auth.users(id) on delete cascade,
  image_url     text        not null,
  answer        text        not null,
  hint          text,
  topic_tag     text,
  difficulty    text        not null check (difficulty in ('easy','medium','hard')),
  source        text        not null check (source in ('manual','ai')),

  -- Sync fields (Unix ms — matches client timestamps)
  created_at    bigint      not null,
  updated_at    bigint      not null,
  deleted_at    bigint,
  inserted_at   timestamptz default now()
);

create index if not exists image_questions_user_id   on image_questions (user_id) where deleted_at is null;
create index if not exists image_questions_topic_tag on image_questions (topic_tag) where deleted_at is null;
create index if not exists image_questions_difficulty on image_questions (difficulty) where deleted_at is null;

-- ── Image Sessions ────────────────────────────────────────────────────────────

create table if not exists image_sessions (
  id                text    primary key,
  user_id           uuid    references auth.users(id) on delete cascade,
  name              text    not null,
  participant_mode  text    not null check (participant_mode in ('individual','team')),
  status            text    not null check (status in ('setup','active','ended')),

  created_at        bigint  not null,
  updated_at        bigint  not null,
  deleted_at        bigint,
  inserted_at       timestamptz default now()
);

create index if not exists image_sessions_user_id on image_sessions (user_id);

-- ── Image Participants ────────────────────────────────────────────────────────

create table if not exists image_participants (
  id            text    primary key,
  user_id       uuid    references auth.users(id) on delete cascade,
  session_id    text    not null references image_sessions(id) on delete cascade,
  name          text    not null,
  type          text    not null check (type in ('individual','team')),
  members       text[]  default '{}',
  color         text    not null,
  score         int     not null default 0,
  sort_order    int     not null default 0,   -- preserves queue order

  created_at    bigint  not null,
  updated_at    bigint  not null,
  deleted_at    bigint,
  inserted_at   timestamptz default now()
);

create index if not exists image_participants_session_id on image_participants (session_id);
create index if not exists image_participants_user_id    on image_participants (user_id);

-- ── Image Rounds ──────────────────────────────────────────────────────────────

create table if not exists image_rounds (
  id                  text    primary key,
  user_id             uuid    references auth.users(id) on delete cascade,
  session_id          text    not null references image_sessions(id) on delete cascade,
  name                text    not null,
  topic_tag           text,
  difficulty          text    default 'all',
  status              text    not null check (status in ('pending','active','completed')),
  question_queue      text[]  default '{}',
  question_index      int     not null default 0,
  participant_queue   text[]  default '{}',
  answer_time_secs    int     not null default 30,
  points_correct      int     not null default 10,
  points_wrong        int     not null default 0,

  created_at          bigint  not null,
  updated_at          bigint  not null,
  deleted_at          bigint,
  inserted_at         timestamptz default now()
);

create index if not exists image_rounds_session_id on image_rounds (session_id);
create index if not exists image_rounds_user_id    on image_rounds (user_id);

-- ── Image Activities (score log) ──────────────────────────────────────────────

create table if not exists image_activities (
  id              text    primary key,
  user_id         uuid    references auth.users(id) on delete cascade,
  session_id      text    not null references image_sessions(id) on delete cascade,
  round_id        text    not null references image_rounds(id)   on delete cascade,
  question_id     text    not null,
  participant_id  text    not null,
  result          text    not null check (result in ('correct','wrong','skip')),
  points          int     not null,

  created_at      bigint  not null,
  inserted_at     timestamptz default now()
);

create index if not exists image_activities_session_id on image_activities (session_id);
create index if not exists image_activities_round_id   on image_activities (round_id);
create index if not exists image_activities_user_id    on image_activities (user_id);

-- ── Row Level Security ────────────────────────────────────────────────────────

alter table image_questions    enable row level security;
alter table image_sessions     enable row level security;
alter table image_participants enable row level security;
alter table image_rounds       enable row level security;
alter table image_activities   enable row level security;

-- Image questions: public read, own write
create policy "read_all_image_questions" on image_questions
  for select using (true);

create policy "own_image_questions_write" on image_questions
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- All other tables: strictly own
create policy "own_image_sessions"     on image_sessions
  for all using  (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_image_participants" on image_participants
  for all using  (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_image_rounds"       on image_rounds
  for all using  (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_image_activities"   on image_activities
  for all using  (auth.uid() = user_id) with check (auth.uid() = user_id);
