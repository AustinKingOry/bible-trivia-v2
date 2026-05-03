-- ============================================================
-- Migration: 003_add_topic_tag
-- Adds topic_tag (subject-matter) to questions and rounds.
-- Separate from question format/mechanics (categoryId).
-- ============================================================

alter table questions add column if not exists topic_tag text;
alter table rounds    add column if not exists topic_tag text;

-- Index for topic-filtered queries
create index if not exists questions_topic_tag on questions (topic_tag) where deleted_at is null;
create index if not exists rounds_topic_tag    on rounds    (topic_tag);

-- Back-fill existing bible questions (optional — safe to skip)
-- update questions set topic_tag = 'bible' where topic_tag is null and source = 'seed';

comment on column questions.topic_tag is
  'Subject-matter tag (e.g. bible, science, nature). Separate from categoryId which is the question format/mechanics.';

comment on column rounds.topic_tag is
  'Optional subject-matter filter applied when building the question queue for this round.';
