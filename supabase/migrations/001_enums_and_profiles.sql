-- ============================================================
-- MIGRATION 001: Enums and Profiles
-- Equity Table — Phase 0 Foundation
-- ============================================================

-- ----------------------------------------------------------------
-- EXTENSIONS
-- ----------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- for fuzzy search later

-- ----------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------

-- Platform-level roles
create type platform_role_type as enum (
  'super_admin',
  'content_admin',
  'support_admin'
);

-- Equity Table membership roles
create type table_role_type as enum (
  'owner',
  'admin',
  'facilitator',
  'member'
);

-- Membership statuses
create type membership_status_type as enum (
  'active',
  'invited',
  'pending',
  'removed',
  'suspended'
);

-- Invitation statuses
create type invitation_status_type as enum (
  'pending',
  'accepted',
  'expired',
  'revoked'
);

-- Table visibility
create type visibility_type as enum (
  'public',
  'private',
  'invite_only'
);

-- Equity Table status
create type table_status_type as enum (
  'active',
  'trial',
  'past_due',
  'canceled',
  'suspended'
);

-- Subscription/billing status
create type subscription_status_type as enum (
  'active',
  'trialing',
  'past_due',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'paused',
  'unpaid'
);

-- Content status
create type content_status_type as enum (
  'draft',
  'published',
  'archived'
);

-- Course level
create type course_level_type as enum (
  'beginner',
  'intermediate',
  'advanced'
);

-- Lesson progress status
create type progress_status_type as enum (
  'not_started',
  'in_progress',
  'completed'
);

-- Audio provider
create type audio_provider_type as enum (
  'kokoro',
  'piper',
  'xtts',
  'human_upload',
  'other'
);

-- Audio generation status
create type audio_status_type as enum (
  'pending',
  'processing',
  'ready',
  'failed'
);

-- Event types
create type event_type as enum (
  'class',
  'workshop',
  'meetup',
  'webinar',
  'cohort',
  'other'
);

-- Event location type
create type location_type as enum (
  'online',
  'in_person',
  'hybrid'
);

-- Event status
create type event_status_type as enum (
  'draft',
  'published',
  'canceled',
  'completed'
);

-- RSVP status
create type rsvp_status_type as enum (
  'going',
  'maybe',
  'not_going',
  'waitlist'
);

-- Recording storage provider
create type storage_provider_type as enum (
  'supabase',
  'mux',
  'other'
);

-- Recording status
create type recording_status_type as enum (
  'processing',
  'ready',
  'failed',
  'hidden'
);

-- Goal status
create type goal_status_type as enum (
  'active',
  'completed',
  'paused',
  'canceled'
);

-- Goal contribution type
create type contribution_type as enum (
  'none',
  'manual',
  'pledge',
  'stripe'
);

-- Goal contribution status
create type contribution_status_type as enum (
  'pledged',
  'pending',
  'confirmed',
  'rejected',
  'refunded'
);

-- Affiliate payout status
create type payout_status_type as enum (
  'pending',
  'approved',
  'paid',
  'rejected',
  'failed',
  'canceled'
);

-- Affiliate conversion source
create type conversion_source_type as enum (
  'webhook',
  'manual',
  'csv'
);

-- Post type
create type post_type as enum (
  'announcement',
  'discussion',
  'resource',
  'reflection',
  'event_update',
  'goal_update'
);

-- Reaction target type
create type reaction_target_type as enum (
  'post',
  'comment',
  'goal_update',
  'event'
);

-- ----------------------------------------------------------------
-- PROFILES TABLE
-- ----------------------------------------------------------------
-- Extends Supabase auth.users. Created automatically on sign-up
-- via trigger. One profile per auth user.
-- ----------------------------------------------------------------
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null,
  username        text unique,
  full_name       text,
  avatar_url      text,
  banner_url      text,
  bio             text,
  location        text,
  public_profile  boolean not null default false,
  onboarding_completed boolean not null default false,
  social_links    jsonb default '{}',
  financial_interests text[],
  notification_prefs jsonb default '{"email": true, "in_app": true}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint username_length check (char_length(username) >= 3 and char_length(username) <= 30),
  constraint username_format check (username ~ '^[a-zA-Z0-9_-]+$'),
  constraint bio_length check (char_length(bio) <= 500)
);

comment on table public.profiles is 'User profiles extending Supabase auth. Auto-created on sign-up.';

-- ----------------------------------------------------------------
-- PLATFORM ROLES TABLE
-- ----------------------------------------------------------------
create table public.platform_roles (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  role        platform_role_type not null,
  granted_by  uuid references public.profiles(id),
  created_at  timestamptz not null default now(),

  unique (user_id, role)
);

comment on table public.platform_roles is 'Super Admin, Content Admin, Support Admin role assignments.';

-- ----------------------------------------------------------------
-- TRIGGER: Auto-create profile on auth.users insert
-- ----------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _username text;
  _super_admin_emails text[] := array[
    'julius@globalinvestmentcompanies.com',
    'cathy@globalinvestmentcompanies.com',
    'jasmon@globalinvestmentcompanies.com',
    'ricky@globalinvestmentcompanies.com'
  ];
begin
  -- Generate a unique username from email prefix
  _username := lower(split_part(new.email, '@', 1));
  _username := regexp_replace(_username, '[^a-zA-Z0-9_-]', '_', 'g');

  -- Ensure uniqueness by appending random suffix if needed
  while exists (select 1 from public.profiles where username = _username) loop
    _username := _username || '_' || floor(random() * 9000 + 1000)::text;
  end loop;

  -- Create profile
  insert into public.profiles (id, email, username, full_name)
  values (
    new.id,
    new.email,
    _username,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );

  -- Auto-assign super_admin if email matches seeded list
  if new.email = any(_super_admin_emails) then
    insert into public.platform_roles (user_id, role)
    values (new.id, 'super_admin')
    on conflict (user_id, role) do nothing;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------------------
-- FUNCTION: updated_at auto-timestamp
-- ----------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();
