-- ============================================================
-- MIGRATION 004: Learning Portal — Courses, Modules, Lessons, Audio
-- ============================================================

-- ----------------------------------------------------------------
-- COURSE CATEGORIES
-- ----------------------------------------------------------------
create table public.course_categories (
  id                uuid primary key default uuid_generate_v4(),
  name              text not null unique,
  slug              text not null unique,
  description       text,
  icon              text,
  religious_context text,   -- 'christian' | 'muslim' | 'jewish' | null
  sort_order        int not null default 0,
  active            boolean not null default true,
  created_at        timestamptz not null default now()
);

comment on table public.course_categories is 'Financial literacy course categories including religious-specific ones.';

-- ----------------------------------------------------------------
-- COURSES
-- ----------------------------------------------------------------
create table public.courses (
  id                          uuid primary key default uuid_generate_v4(),
  title                       text not null,
  slug                        text not null unique,
  description                 text,
  category_id                 uuid not null references public.course_categories(id),
  level                       course_level_type not null default 'beginner',
  estimated_minutes           int,
  thumbnail_url               text,
  status                      content_status_type not null default 'draft',

  -- Targeting
  table_type_recommendations  text[],  -- slugs of recommended table types
  religious_context           text,    -- 'christian' | 'muslim' | 'jewish' | null

  -- Metadata
  created_by                  uuid references public.profiles(id),
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

comment on table public.courses is 'Financial literacy courses. Each has modules and lessons.';

create trigger courses_updated_at
  before update on public.courses
  for each row execute procedure public.set_updated_at();

create index idx_courses_category on public.courses(category_id, status);
create index idx_courses_status on public.courses(status);
create index idx_courses_slug on public.courses(slug);

-- ----------------------------------------------------------------
-- COURSE MODULES (chapters/sections within a course)
-- ----------------------------------------------------------------
create table public.course_modules (
  id          uuid primary key default uuid_generate_v4(),
  course_id   uuid not null references public.courses(id) on delete cascade,
  title       text not null,
  description text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.course_modules is 'Chapters/sections within a course.';

create trigger course_modules_updated_at
  before update on public.course_modules
  for each row execute procedure public.set_updated_at();

create index idx_modules_course on public.course_modules(course_id, sort_order);

-- ----------------------------------------------------------------
-- LESSONS
-- ----------------------------------------------------------------
-- content jsonb structure:
-- [
--   { "type": "heading", "text": "..." },
--   { "type": "paragraph", "id": "p1", "text": "..." },
--   { "type": "bullet_list", "items": ["...", "..."] },
--   { "type": "callout", "label": "...", "text": "..." },
--   { "type": "image", "url": "...", "alt": "..." },
--   { "type": "quiz_prompt", "quiz_id": "..." }
-- ]
-- ----------------------------------------------------------------
create table public.lessons (
  id                  uuid primary key default uuid_generate_v4(),
  course_id           uuid not null references public.courses(id) on delete cascade,
  module_id           uuid references public.course_modules(id) on delete set null,
  title               text not null,
  slug                text not null,
  summary             text,
  content             jsonb not null default '[]',
  transcript_text     text,          -- plain text for TTS + search
  estimated_minutes   int,
  sort_order          int not null default 0,
  status              content_status_type not null default 'draft',
  cta_override_text   text,          -- overrides platform default CTA for this lesson

  -- Reflection prompt shown after lesson
  reflection_prompt   text,

  -- Recommended next lesson
  next_lesson_id      uuid references public.lessons(id),

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  unique (course_id, slug)
);

comment on table public.lessons is 'Individual lessons within a course. Contains structured content blocks.';

create trigger lessons_updated_at
  before update on public.lessons
  for each row execute procedure public.set_updated_at();

create index idx_lessons_course on public.lessons(course_id, sort_order);
create index idx_lessons_module on public.lessons(module_id);
create index idx_lessons_slug on public.lessons(slug);

-- ----------------------------------------------------------------
-- LESSON AUDIO
-- ----------------------------------------------------------------
create table public.lesson_audio (
  id              uuid primary key default uuid_generate_v4(),
  lesson_id       uuid not null unique references public.lessons(id) on delete cascade,
  audio_url       text,
  audio_provider  audio_provider_type not null default 'kokoro',
  voice_name      text,
  language        text not null default 'en',
  duration_seconds numeric(10,2),
  status          audio_status_type not null default 'pending',
  error_message   text,
  generated_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.lesson_audio is 'TTS or human-uploaded audio file per lesson.';

create trigger lesson_audio_updated_at
  before update on public.lesson_audio
  for each row execute procedure public.set_updated_at();

-- ----------------------------------------------------------------
-- LESSON AUDIO SEGMENTS (for read-along sync)
-- ----------------------------------------------------------------
-- Each segment maps a time range to a text block in the lesson.
-- Enables word/paragraph highlighting synced to audio playback.
-- ----------------------------------------------------------------
create table public.lesson_audio_segments (
  id              uuid primary key default uuid_generate_v4(),
  lesson_audio_id uuid not null references public.lesson_audio(id) on delete cascade,
  lesson_id       uuid not null references public.lessons(id) on delete cascade,
  segment_index   int not null,
  start_time      numeric(10,3) not null, -- seconds
  end_time        numeric(10,3) not null,
  text            text not null,
  block_id        text,   -- matches "id" field in lesson.content jsonb blocks
  created_at      timestamptz not null default now(),

  unique (lesson_audio_id, segment_index)
);

comment on table public.lesson_audio_segments is 'Timestamped text segments for read-along audio sync.';

create index idx_segments_audio on public.lesson_audio_segments(lesson_audio_id, segment_index);
create index idx_segments_lesson on public.lesson_audio_segments(lesson_id);

-- ----------------------------------------------------------------
-- LESSON PROGRESS
-- ----------------------------------------------------------------
create table public.lesson_progress (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid not null references public.profiles(id) on delete cascade,
  lesson_id             uuid not null references public.lessons(id) on delete cascade,
  table_id              uuid references public.equity_tables(id) on delete set null,
  status                progress_status_type not null default 'not_started',
  progress_percent      numeric(5,2) not null default 0 check (progress_percent >= 0 and progress_percent <= 100),
  last_position_seconds numeric(10,2) not null default 0,
  completed_at          timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  unique (user_id, lesson_id, table_id)
);

comment on table public.lesson_progress is 'Per-user lesson completion tracking within a table context.';

create trigger lesson_progress_updated_at
  before update on public.lesson_progress
  for each row execute procedure public.set_updated_at();

create index idx_lesson_progress_user on public.lesson_progress(user_id, status);
create index idx_lesson_progress_lesson on public.lesson_progress(lesson_id);

-- ----------------------------------------------------------------
-- COURSE PROGRESS
-- ----------------------------------------------------------------
create table public.course_progress (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  course_id           uuid not null references public.courses(id) on delete cascade,
  table_id            uuid references public.equity_tables(id) on delete set null,
  completed_lessons   int not null default 0,
  total_lessons       int not null default 0,
  progress_percent    numeric(5,2) not null default 0,
  completed_at        timestamptz,
  updated_at          timestamptz not null default now(),

  unique (user_id, course_id, table_id)
);

create index idx_course_progress_user on public.course_progress(user_id);

-- ----------------------------------------------------------------
-- QUIZZES
-- ----------------------------------------------------------------
-- questions jsonb structure:
-- [
--   {
--     "id": "q1",
--     "type": "multiple_choice",
--     "text": "What is a budget?",
--     "options": [{"id": "a", "text": "..."}, ...],
--     "correct_option_id": "a",
--     "explanation": "..."
--   }
-- ]
-- ----------------------------------------------------------------
create table public.quizzes (
  id            uuid primary key default uuid_generate_v4(),
  lesson_id     uuid not null references public.lessons(id) on delete cascade,
  title         text,
  questions     jsonb not null default '[]',
  passing_score numeric(5,2) not null default 70,   -- percentage
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger quizzes_updated_at
  before update on public.quizzes
  for each row execute procedure public.set_updated_at();

-- ----------------------------------------------------------------
-- QUIZ ATTEMPTS
-- ----------------------------------------------------------------
create table public.quiz_attempts (
  id          uuid primary key default uuid_generate_v4(),
  quiz_id     uuid not null references public.quizzes(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  score       numeric(5,2) not null,
  answers     jsonb not null default '{}',
  passed      boolean not null,
  created_at  timestamptz not null default now()
);

create index idx_quiz_attempts_user on public.quiz_attempts(user_id, quiz_id);
create index idx_quiz_attempts_quiz on public.quiz_attempts(quiz_id);
