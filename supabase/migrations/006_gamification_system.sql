-- ============================================================
-- MIGRATION 006: Gamification, Notifications, Files, System, Audit
-- ============================================================

-- ----------------------------------------------------------------
-- BADGES
-- ----------------------------------------------------------------
-- criteria jsonb structure:
-- {
--   "type": "lesson_count",       // or "course_count", "event_attended", "invite_sent", etc.
--   "threshold": 1,
--   "auto_award": true
-- }
-- ----------------------------------------------------------------
create table public.badges (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  slug        text not null unique,
  description text,
  icon        text,             -- emoji or icon name
  icon_url    text,             -- optional image badge
  points      int not null default 0,
  criteria    jsonb not null default '{}',
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

comment on table public.badges is 'Badges awarded to users for completing milestones.';

-- ----------------------------------------------------------------
-- USER BADGES
-- ----------------------------------------------------------------
create table public.user_badges (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  badge_id    uuid not null references public.badges(id) on delete cascade,
  table_id    uuid references public.equity_tables(id) on delete set null,
  earned_at   timestamptz not null default now(),

  unique (user_id, badge_id, table_id)
);

create index idx_user_badges_user on public.user_badges(user_id);
create index idx_user_badges_table on public.user_badges(table_id, badge_id);

-- ----------------------------------------------------------------
-- POINTS LEDGER
-- ----------------------------------------------------------------
-- All point transactions are append-only for auditability.
-- Sum for a user's total: SELECT SUM(points) WHERE user_id = ?
-- ----------------------------------------------------------------
create table public.points_ledger (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  table_id    uuid references public.equity_tables(id) on delete set null,
  points      int not null,   -- positive or negative
  reason      text not null,
  source_type text not null,  -- 'lesson_complete' | 'event_attend' | 'goal_create' | etc.
  source_id   uuid,           -- ID of the related record
  created_at  timestamptz not null default now()
);

comment on table public.points_ledger is 'Append-only ledger of all XP point transactions per user.';

create index idx_points_user on public.points_ledger(user_id, created_at desc);
create index idx_points_table on public.points_ledger(table_id, user_id);

-- ----------------------------------------------------------------
-- NOTIFICATIONS
-- ----------------------------------------------------------------
create table public.notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  body        text not null,
  link_url    text,
  icon        text,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index idx_notifications_user on public.notifications(user_id, read_at, created_at desc);

-- ----------------------------------------------------------------
-- FILES
-- ----------------------------------------------------------------
create table public.files (
  id          uuid primary key default uuid_generate_v4(),
  table_id    uuid references public.equity_tables(id) on delete cascade,
  event_id    uuid references public.equity_events(id) on delete set null,
  uploaded_by uuid not null references public.profiles(id),
  file_url    text not null,
  storage_path text,
  file_type   text not null,
  file_name   text not null,
  mime_type   text,
  size_bytes  bigint,
  visibility  visibility_type not null default 'table_only',
  created_at  timestamptz not null default now()
);

create index idx_files_table on public.files(table_id, visibility);

-- ----------------------------------------------------------------
-- SYSTEM SETTINGS
-- ----------------------------------------------------------------
-- Generic key-value store for platform settings editable by Super Admin.
-- Examples: maintenance_mode, max_upload_mb, feature flags, etc.
-- ----------------------------------------------------------------
create table public.system_settings (
  key         text primary key,
  value       jsonb not null,
  description text,
  updated_by  uuid references public.profiles(id),
  updated_at  timestamptz not null default now()
);

comment on table public.system_settings is 'Platform-wide settings. Key-value store. Super Admin only.';

-- ----------------------------------------------------------------
-- FEATURE FLAGS
-- ----------------------------------------------------------------
create table public.feature_flags (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null unique,
  slug          text not null unique,
  description   text,
  enabled       boolean not null default false,
  enabled_for   jsonb default '{}',  -- { "table_ids": [], "user_ids": [], "table_types": [] }
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.feature_flags is 'Feature flags for gradual rollouts and A/B testing.';

create trigger feature_flags_updated_at
  before update on public.feature_flags
  for each row execute procedure public.set_updated_at();

-- ----------------------------------------------------------------
-- AUDIT LOGS
-- ----------------------------------------------------------------
-- Append-only. Used for compliance and Super Admin auditing.
-- ----------------------------------------------------------------
create table public.audit_logs (
  id              uuid primary key default uuid_generate_v4(),
  actor_user_id   uuid references public.profiles(id) on delete set null,
  action          text not null,      -- 'user.role.assign', 'table.create', 'payout.mark_paid', etc.
  target_type     text,               -- 'user' | 'equity_table' | 'subscription' | 'course' | etc.
  target_id       uuid,
  metadata        jsonb default '{}', -- additional context
  ip_hash         text,
  user_agent      text,
  created_at      timestamptz not null default now()
);

comment on table public.audit_logs is 'Append-only audit trail for all significant platform actions.';

create index idx_audit_actor on public.audit_logs(actor_user_id, created_at desc);
create index idx_audit_target on public.audit_logs(target_type, target_id, created_at desc);
create index idx_audit_action on public.audit_logs(action, created_at desc);

-- ----------------------------------------------------------------
-- ADD DEFERRED FOREIGN KEYS
-- (for tables created in later migrations that reference earlier ones)
-- ----------------------------------------------------------------

-- Affiliate clicks FK to courses, lessons, events
alter table public.affiliate_clicks
  add constraint fk_clicks_course
    foreign key (course_id) references public.courses(id) on delete set null;

alter table public.affiliate_clicks
  add constraint fk_clicks_lesson
    foreign key (lesson_id) references public.lessons(id) on delete set null;

alter table public.affiliate_clicks
  add constraint fk_clicks_event
    foreign key (event_id) references public.equity_events(id) on delete set null;

-- ----------------------------------------------------------------
-- LEGAL PAGES (editable content store)
-- ----------------------------------------------------------------
create table public.legal_pages (
  id          uuid primary key default uuid_generate_v4(),
  slug        text not null unique,  -- 'privacy', 'terms', 'affiliate-disclosure', etc.
  title       text not null,
  content     text not null,
  published   boolean not null default true,
  updated_by  uuid references public.profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.legal_pages is 'Editable legal pages (privacy, terms, disclaimers). Super Admin only.';

create trigger legal_pages_updated_at
  before update on public.legal_pages
  for each row execute procedure public.set_updated_at();
