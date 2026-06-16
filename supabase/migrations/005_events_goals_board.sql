-- ============================================================
-- MIGRATION 005: Events, Recordings, Goals, Message Board
-- ============================================================

-- ----------------------------------------------------------------
-- EQUITY EVENTS
-- ----------------------------------------------------------------
create table public.equity_events (
  id                  uuid primary key default uuid_generate_v4(),
  table_id            uuid not null references public.equity_tables(id) on delete cascade,
  created_by          uuid not null references public.profiles(id),
  title               text not null,
  slug                text not null,
  description         text,
  event_type          event_type not null default 'class',
  visibility          visibility_type not null default 'table_only',
  starts_at           timestamptz not null,
  ends_at             timestamptz not null,
  timezone            text not null default 'America/Los_Angeles',
  location_type       location_type not null default 'online',
  meeting_url         text,
  address             text,
  capacity            int,
  image_url           text,

  -- Learning attachment
  attached_course_id  uuid references public.courses(id) on delete set null,
  attached_lesson_id  uuid references public.lessons(id) on delete set null,

  -- Structured agenda: [{ "time": "6:00 PM", "title": "Welcome", "description": "..." }]
  agenda              jsonb default '[]',

  -- Post-event
  post_event_reflection_enabled boolean not null default true,
  cta_after_event     boolean not null default true,

  status              event_status_type not null default 'draft',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint valid_times check (ends_at > starts_at),
  unique (table_id, slug)
);

comment on table public.equity_events is 'Financial literacy events hosted by Equity Tables.';

create trigger events_updated_at
  before update on public.equity_events
  for each row execute procedure public.set_updated_at();

create index idx_events_table on public.equity_events(table_id, status, starts_at);
create index idx_events_public on public.equity_events(visibility, starts_at) where status = 'published';

-- ----------------------------------------------------------------
-- EVENT RSVPs
-- ----------------------------------------------------------------
create table public.event_rsvps (
  id              uuid primary key default uuid_generate_v4(),
  event_id        uuid not null references public.equity_events(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  status          rsvp_status_type not null default 'going',
  checked_in      boolean not null default false,
  checked_in_at   timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique (event_id, user_id)
);

create trigger event_rsvps_updated_at
  before update on public.event_rsvps
  for each row execute procedure public.set_updated_at();

create index idx_rsvps_event on public.event_rsvps(event_id, status);
create index idx_rsvps_user on public.event_rsvps(user_id);

-- ----------------------------------------------------------------
-- RECORDING CONSENTS
-- ----------------------------------------------------------------
create table public.recording_consents (
  id              uuid primary key default uuid_generate_v4(),
  event_id        uuid not null references public.equity_events(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  consented       boolean not null,
  consent_text    text not null,
  consented_at    timestamptz not null default now(),

  unique (event_id, user_id)
);

-- ----------------------------------------------------------------
-- EVENT RECORDINGS
-- ----------------------------------------------------------------
create table public.event_recordings (
  id                uuid primary key default uuid_generate_v4(),
  event_id          uuid references public.equity_events(id) on delete set null,
  table_id          uuid not null references public.equity_tables(id) on delete cascade,
  uploaded_by       uuid not null references public.profiles(id),
  title             text not null,
  description       text,
  video_url         text,
  audio_url         text,
  thumbnail_url     text,
  storage_provider  storage_provider_type not null default 'supabase',
  storage_path      text,    -- internal path in Supabase Storage
  mux_asset_id      text,    -- for future Mux integration
  duration_seconds  numeric(10,2),
  visibility        visibility_type not null default 'table_only',
  status            recording_status_type not null default 'ready',
  tags              text[],
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.event_recordings is 'Recorded event videos stored in Supabase Storage (Mux-ready).';

create trigger recordings_updated_at
  before update on public.event_recordings
  for each row execute procedure public.set_updated_at();

create index idx_recordings_table on public.event_recordings(table_id, visibility, status);
create index idx_recordings_event on public.event_recordings(event_id);

-- ----------------------------------------------------------------
-- GOALS
-- ----------------------------------------------------------------
create table public.goals (
  id                  uuid primary key default uuid_generate_v4(),
  table_id            uuid not null references public.equity_tables(id) on delete cascade,
  created_by          uuid not null references public.profiles(id),
  title               text not null,
  description         text,
  goal_type           text not null,
  target_metric       text,
  current_value       numeric(15,2) not null default 0,
  target_value        numeric(15,2) not null,
  currency            text,

  start_date          date,
  target_date         date,

  visibility          visibility_type not null default 'table_only',
  accept_contributions boolean not null default false,
  contribution_type   contribution_type not null default 'none',
  suggested_amounts   numeric(10,2)[],
  featured            boolean not null default false,

  status              goal_status_type not null default 'active',
  completed_at        timestamptz,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint valid_target check (target_value > 0),
  constraint valid_current check (current_value >= 0)
);

comment on table public.goals is 'Shared goals for Equity Tables with progress tracking.';

create trigger goals_updated_at
  before update on public.goals
  for each row execute procedure public.set_updated_at();

create index idx_goals_table on public.goals(table_id, status, visibility);

-- ----------------------------------------------------------------
-- GOAL UPDATES (progress log entries)
-- ----------------------------------------------------------------
create table public.goal_updates (
  id              uuid primary key default uuid_generate_v4(),
  goal_id         uuid not null references public.goals(id) on delete cascade,
  user_id         uuid not null references public.profiles(id),
  update_value    numeric(15,2),  -- amount to add to current_value (can be null for text-only)
  update_text     text,
  evidence_url    text,
  created_at      timestamptz not null default now()
);

create index idx_goal_updates on public.goal_updates(goal_id, created_at desc);

-- Trigger to update goal current_value when a numeric update is posted
create or replace function public.apply_goal_update()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.update_value is not null then
    update public.goals
    set
      current_value = current_value + new.update_value,
      updated_at = now()
    where id = new.goal_id;

    -- Auto-complete if target reached
    update public.goals
    set
      status = 'completed',
      completed_at = now()
    where id = new.goal_id
      and status = 'active'
      and current_value >= target_value;
  end if;
  return new;
end;
$$;

create trigger apply_goal_update_on_insert
  after insert on public.goal_updates
  for each row execute procedure public.apply_goal_update();

-- ----------------------------------------------------------------
-- GOAL CONTRIBUTIONS
-- ----------------------------------------------------------------
create table public.goal_contributions (
  id                      uuid primary key default uuid_generate_v4(),
  goal_id                 uuid not null references public.goals(id) on delete cascade,
  user_id                 uuid references public.profiles(id) on delete set null,
  amount                  numeric(10,2) not null,
  contribution_type       contribution_type not null,
  stripe_payment_intent_id text,
  note                    text,
  status                  contribution_status_type not null default 'pending',
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create trigger contributions_updated_at
  before update on public.goal_contributions
  for each row execute procedure public.set_updated_at();

create index idx_contributions_goal on public.goal_contributions(goal_id, status);

-- ----------------------------------------------------------------
-- POSTS (Message Board)
-- ----------------------------------------------------------------
create table public.posts (
  id          uuid primary key default uuid_generate_v4(),
  table_id    uuid not null references public.equity_tables(id) on delete cascade,
  user_id     uuid not null references public.profiles(id),
  title       text,
  body        text not null,
  post_type   post_type not null default 'discussion',
  visibility  visibility_type not null default 'table_only',
  pinned      boolean not null default false,

  -- Optional attachments
  attached_file_url text,
  attached_goal_id  uuid references public.goals(id) on delete set null,
  attached_event_id uuid references public.equity_events(id) on delete set null,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.posts is 'Message board posts for Equity Tables.';

create trigger posts_updated_at
  before update on public.posts
  for each row execute procedure public.set_updated_at();

create index idx_posts_table on public.posts(table_id, visibility, pinned desc, created_at desc);

-- ----------------------------------------------------------------
-- COMMENTS
-- ----------------------------------------------------------------
create table public.comments (
  id          uuid primary key default uuid_generate_v4(),
  post_id     uuid not null references public.posts(id) on delete cascade,
  user_id     uuid not null references public.profiles(id),
  body        text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger comments_updated_at
  before update on public.comments
  for each row execute procedure public.set_updated_at();

create index idx_comments_post on public.comments(post_id, created_at);

-- ----------------------------------------------------------------
-- REACTIONS
-- ----------------------------------------------------------------
create table public.reactions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  target_type reaction_target_type not null,
  target_id   uuid not null,
  reaction    text not null,   -- e.g. '👍', '❤️', '🔥'
  created_at  timestamptz not null default now(),

  unique (user_id, target_type, target_id, reaction)
);

create index idx_reactions_target on public.reactions(target_type, target_id);
