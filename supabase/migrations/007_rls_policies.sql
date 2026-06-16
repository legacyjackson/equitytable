-- ============================================================
-- MIGRATION 007: Row Level Security Policies
-- ============================================================
-- Every user-data table has RLS. The core pattern:
--   - Public content is readable by anyone (anon or authed)
--   - Private/member content requires active membership
--   - Owner/Admin actions require role check
--   - Super Admin bypasses most restrictions via helper function
-- ============================================================

-- ----------------------------------------------------------------
-- RLS HELPER FUNCTIONS
-- ----------------------------------------------------------------

-- Is the current user a super admin?
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.platform_roles
    where user_id = auth.uid()
      and role = 'super_admin'
  );
$$;

-- Is the current user a content admin or super admin?
create or replace function public.is_content_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.platform_roles
    where user_id = auth.uid()
      and role in ('super_admin', 'content_admin')
  );
$$;

-- Is the current user an active member of a specific table?
create or replace function public.is_table_member(p_table_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.table_memberships
    where table_id = p_table_id
      and user_id = auth.uid()
      and status = 'active'
  );
$$;

-- Is the current user an owner or admin of a specific table?
create or replace function public.is_table_admin(p_table_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.table_memberships
    where table_id = p_table_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
      and status = 'active'
  );
$$;

-- Is the current user the owner of a specific table?
create or replace function public.is_table_owner(p_table_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.table_memberships
    where table_id = p_table_id
      and user_id = auth.uid()
      and role = 'owner'
      and status = 'active'
  );
$$;

-- Is the current user a facilitator, admin, or owner of a table?
create or replace function public.is_table_facilitator(p_table_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.table_memberships
    where table_id = p_table_id
      and user_id = auth.uid()
      and role in ('owner', 'admin', 'facilitator')
      and status = 'active'
  );
$$;

-- ----------------------------------------------------------------
-- ENABLE RLS ON ALL TABLES
-- ----------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.platform_roles enable row level security;
alter table public.equity_table_types enable row level security;
alter table public.equity_tables enable row level security;
alter table public.table_memberships enable row level security;
alter table public.table_invitations enable row level security;
alter table public.subscriptions enable row level security;
alter table public.seat_usage_snapshots enable row level security;
alter table public.affiliate_settings enable row level security;
alter table public.affiliate_links enable row level security;
alter table public.affiliate_clicks enable row level security;
alter table public.affiliate_conversions enable row level security;
alter table public.affiliate_payouts enable row level security;
alter table public.course_categories enable row level security;
alter table public.courses enable row level security;
alter table public.course_modules enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_audio enable row level security;
alter table public.lesson_audio_segments enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.course_progress enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.equity_events enable row level security;
alter table public.event_rsvps enable row level security;
alter table public.recording_consents enable row level security;
alter table public.event_recordings enable row level security;
alter table public.goals enable row level security;
alter table public.goal_updates enable row level security;
alter table public.goal_contributions enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.points_ledger enable row level security;
alter table public.notifications enable row level security;
alter table public.files enable row level security;
alter table public.system_settings enable row level security;
alter table public.feature_flags enable row level security;
alter table public.audit_logs enable row level security;
alter table public.legal_pages enable row level security;

-- ----------------------------------------------------------------
-- PROFILES POLICIES
-- ----------------------------------------------------------------
create policy "profiles: anyone can view public profiles"
  on public.profiles for select
  using (public_profile = true or auth.uid() = id or public.is_super_admin());

create policy "profiles: users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles: super admin can view all"
  on public.profiles for select
  using (public.is_super_admin());

create policy "profiles: super admin can update all"
  on public.profiles for update
  using (public.is_super_admin());

-- System can insert (via trigger)
create policy "profiles: system insert on signup"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ----------------------------------------------------------------
-- PLATFORM ROLES POLICIES
-- ----------------------------------------------------------------
create policy "platform_roles: super admin can manage"
  on public.platform_roles for all
  using (public.is_super_admin());

create policy "platform_roles: users can read own roles"
  on public.platform_roles for select
  using (user_id = auth.uid());

-- ----------------------------------------------------------------
-- EQUITY TABLE TYPES POLICIES
-- ----------------------------------------------------------------
create policy "table_types: anyone can read active types"
  on public.equity_table_types for select
  using (active = true);

create policy "table_types: super admin can manage"
  on public.equity_table_types for all
  using (public.is_super_admin());

-- ----------------------------------------------------------------
-- EQUITY TABLES POLICIES
-- ----------------------------------------------------------------
create policy "equity_tables: public tables readable by all"
  on public.equity_tables for select
  using (visibility = 'public' and status = 'active');

create policy "equity_tables: members can read their tables"
  on public.equity_tables for select
  using (public.is_table_member(id));

create policy "equity_tables: owner can update table"
  on public.equity_tables for update
  using (public.is_table_admin(id));

create policy "equity_tables: authenticated users can create"
  on public.equity_tables for insert
  with check (auth.uid() = owner_id);

create policy "equity_tables: super admin full access"
  on public.equity_tables for all
  using (public.is_super_admin());

-- ----------------------------------------------------------------
-- TABLE MEMBERSHIPS POLICIES
-- ----------------------------------------------------------------
create policy "memberships: members can view own table memberships"
  on public.table_memberships for select
  using (
    user_id = auth.uid()
    or public.is_table_member(table_id)
    or public.is_super_admin()
  );

create policy "memberships: admins can manage memberships"
  on public.table_memberships for insert
  with check (public.is_table_admin(table_id) or public.is_super_admin());

create policy "memberships: admins can update memberships"
  on public.table_memberships for update
  using (public.is_table_admin(table_id) or public.is_super_admin());

-- Users can update their own (e.g. to leave a table)
create policy "memberships: users can update own"
  on public.table_memberships for update
  using (user_id = auth.uid());

-- ----------------------------------------------------------------
-- TABLE INVITATIONS POLICIES
-- ----------------------------------------------------------------
create policy "invitations: admins can manage"
  on public.table_invitations for all
  using (public.is_table_admin(table_id) or public.is_super_admin());

create policy "invitations: invitee can read by token"
  on public.table_invitations for select
  using (
    invited_email = (select email from public.profiles where id = auth.uid())
    or public.is_table_admin(table_id)
    or public.is_super_admin()
  );

-- ----------------------------------------------------------------
-- SUBSCRIPTIONS POLICIES
-- ----------------------------------------------------------------
create policy "subscriptions: table owners can view"
  on public.subscriptions for select
  using (public.is_table_owner(table_id) or public.is_super_admin());

create policy "subscriptions: super admin full access"
  on public.subscriptions for all
  using (public.is_super_admin());

-- System-level insert (via Stripe webhook server action)
create policy "subscriptions: system can insert"
  on public.subscriptions for insert
  with check (public.is_super_admin());

-- ----------------------------------------------------------------
-- AFFILIATE SETTINGS POLICIES
-- ----------------------------------------------------------------
create policy "affiliate_settings: super admin only"
  on public.affiliate_settings for all
  using (public.is_super_admin());

-- Authenticated users can read (for CTA rendering)
create policy "affiliate_settings: authed can read"
  on public.affiliate_settings for select
  using (auth.uid() is not null);

-- ----------------------------------------------------------------
-- AFFILIATE LINKS POLICIES
-- ----------------------------------------------------------------
create policy "affiliate_links: table members can read own table link"
  on public.affiliate_links for select
  using (public.is_table_member(table_id) or public.is_super_admin());

create policy "affiliate_links: super admin can manage"
  on public.affiliate_links for all
  using (public.is_super_admin());

-- ----------------------------------------------------------------
-- AFFILIATE CLICKS POLICIES
-- ----------------------------------------------------------------
-- Inserts happen server-side via API route (service role), not directly from client
create policy "affiliate_clicks: authenticated users can insert"
  on public.affiliate_clicks for insert
  with check (auth.uid() is not null);

create policy "affiliate_clicks: table admins can read own"
  on public.affiliate_clicks for select
  using (public.is_table_admin(table_id) or public.is_super_admin());

-- ----------------------------------------------------------------
-- AFFILIATE CONVERSIONS POLICIES
-- ----------------------------------------------------------------
create policy "conversions: table admins can read own"
  on public.affiliate_conversions for select
  using (public.is_table_admin(table_id) or public.is_super_admin());

create policy "conversions: super admin can manage"
  on public.affiliate_conversions for all
  using (public.is_super_admin());

-- ----------------------------------------------------------------
-- AFFILIATE PAYOUTS POLICIES
-- ----------------------------------------------------------------
create policy "payouts: table owners can read"
  on public.affiliate_payouts for select
  using (public.is_table_owner(table_id) or public.is_super_admin());

create policy "payouts: super admin can manage"
  on public.affiliate_payouts for all
  using (public.is_super_admin());

-- ----------------------------------------------------------------
-- COURSES POLICIES
-- ----------------------------------------------------------------
create policy "courses: published courses readable by authenticated users"
  on public.courses for select
  using (status = 'published' and auth.uid() is not null);

create policy "courses: draft courses readable by content admins"
  on public.courses for select
  using (public.is_content_admin());

create policy "courses: content admins can manage"
  on public.courses for all
  using (public.is_content_admin());

-- ----------------------------------------------------------------
-- COURSE MODULES + LESSONS POLICIES
-- ----------------------------------------------------------------
create policy "course_modules: same as courses"
  on public.course_modules for select
  using (
    auth.uid() is not null and
    exists (
      select 1 from public.courses
      where id = course_id and (status = 'published' or public.is_content_admin())
    )
  );

create policy "course_modules: content admins can manage"
  on public.course_modules for all
  using (public.is_content_admin());

create policy "lessons: published readable by authenticated"
  on public.lessons for select
  using (status = 'published' and auth.uid() is not null);

create policy "lessons: draft readable by content admins"
  on public.lessons for select
  using (public.is_content_admin());

create policy "lessons: content admins can manage"
  on public.lessons for all
  using (public.is_content_admin());

-- ----------------------------------------------------------------
-- LESSON AUDIO + SEGMENTS POLICIES
-- ----------------------------------------------------------------
create policy "lesson_audio: readable by authenticated for published lessons"
  on public.lesson_audio for select
  using (auth.uid() is not null and status = 'ready');

create policy "lesson_audio: content admins can manage"
  on public.lesson_audio for all
  using (public.is_content_admin());

create policy "audio_segments: readable by authenticated"
  on public.lesson_audio_segments for select
  using (auth.uid() is not null);

create policy "audio_segments: content admins can manage"
  on public.lesson_audio_segments for all
  using (public.is_content_admin());

-- ----------------------------------------------------------------
-- LESSON + COURSE PROGRESS POLICIES
-- ----------------------------------------------------------------
create policy "lesson_progress: users can manage own"
  on public.lesson_progress for all
  using (user_id = auth.uid());

create policy "lesson_progress: table admins can read table progress"
  on public.lesson_progress for select
  using (public.is_table_admin(table_id) or public.is_super_admin());

create policy "course_progress: users can manage own"
  on public.course_progress for all
  using (user_id = auth.uid());

-- ----------------------------------------------------------------
-- QUIZZES + ATTEMPTS POLICIES
-- ----------------------------------------------------------------
create policy "quizzes: readable by authenticated"
  on public.quizzes for select
  using (auth.uid() is not null);

create policy "quizzes: content admins can manage"
  on public.quizzes for all
  using (public.is_content_admin());

create policy "quiz_attempts: users can manage own"
  on public.quiz_attempts for all
  using (user_id = auth.uid());

-- ----------------------------------------------------------------
-- EQUITY EVENTS POLICIES
-- ----------------------------------------------------------------
create policy "events: public events readable by all"
  on public.equity_events for select
  using (visibility = 'public' and status = 'published');

create policy "events: table members can read table events"
  on public.equity_events for select
  using (
    visibility in ('public', 'table_only')
    and public.is_table_member(table_id)
  );

create policy "events: facilitators can manage"
  on public.equity_events for all
  using (public.is_table_facilitator(table_id) or public.is_super_admin());

-- ----------------------------------------------------------------
-- EVENT RSVPs POLICIES
-- ----------------------------------------------------------------
create policy "rsvps: users can manage own"
  on public.event_rsvps for all
  using (user_id = auth.uid());

create policy "rsvps: table admins can view"
  on public.event_rsvps for select
  using (
    public.is_table_facilitator(
      (select table_id from public.equity_events where id = event_id)
    )
    or public.is_super_admin()
  );

-- ----------------------------------------------------------------
-- RECORDINGS POLICIES
-- ----------------------------------------------------------------
create policy "recordings: public recordings readable by all"
  on public.event_recordings for select
  using (visibility = 'public' and status = 'ready');

create policy "recordings: table members can read table recordings"
  on public.event_recordings for select
  using (
    visibility in ('public', 'table_only')
    and public.is_table_member(table_id)
  );

create policy "recordings: facilitators can manage"
  on public.event_recordings for all
  using (public.is_table_facilitator(table_id) or public.is_super_admin());

-- ----------------------------------------------------------------
-- GOALS POLICIES
-- ----------------------------------------------------------------
create policy "goals: public goals readable by all"
  on public.goals for select
  using (visibility = 'public' and status != 'canceled');

create policy "goals: table members can read table goals"
  on public.goals for select
  using (
    visibility in ('public', 'table_only')
    and public.is_table_member(table_id)
  );

create policy "goals: table admins can manage"
  on public.goals for all
  using (public.is_table_admin(table_id) or public.is_super_admin());

create policy "goal_updates: table members can insert"
  on public.goal_updates for insert
  with check (
    auth.uid() = user_id
    and public.is_table_member(
      (select table_id from public.goals where id = goal_id)
    )
  );

create policy "goal_updates: table members can read"
  on public.goal_updates for select
  using (
    public.is_table_member(
      (select table_id from public.goals where id = goal_id)
    )
  );

create policy "goal_contributions: table members can insert"
  on public.goal_contributions for insert
  with check (
    auth.uid() = user_id
    and public.is_table_member(
      (select table_id from public.goals where id = goal_id)
    )
  );

create policy "goal_contributions: table admins can read"
  on public.goal_contributions for select
  using (
    public.is_table_admin(
      (select table_id from public.goals where id = goal_id)
    )
  );

-- ----------------------------------------------------------------
-- POSTS + COMMENTS + REACTIONS POLICIES
-- ----------------------------------------------------------------
create policy "posts: public posts readable by all"
  on public.posts for select
  using (
    visibility = 'public'
    and exists (
      select 1 from public.equity_tables
      where id = table_id and public_message_board = true
    )
  );

create policy "posts: table members can read table posts"
  on public.posts for select
  using (
    visibility in ('public', 'table_only')
    and public.is_table_member(table_id)
  );

create policy "posts: table members can create"
  on public.posts for insert
  with check (
    auth.uid() = user_id
    and public.is_table_member(table_id)
  );

create policy "posts: post authors and admins can update"
  on public.posts for update
  using (
    auth.uid() = user_id
    or public.is_table_admin(table_id)
    or public.is_super_admin()
  );

create policy "posts: admins can delete"
  on public.posts for delete
  using (public.is_table_admin(table_id) or public.is_super_admin());

create policy "comments: table members can read and insert"
  on public.comments for select
  using (
    public.is_table_member(
      (select table_id from public.posts where id = post_id)
    )
  );

create policy "comments: members can insert own"
  on public.comments for insert
  with check (
    auth.uid() = user_id
    and public.is_table_member(
      (select table_id from public.posts where id = post_id)
    )
  );

create policy "comments: authors and admins can update"
  on public.comments for update
  using (
    auth.uid() = user_id
    or public.is_super_admin()
  );

create policy "reactions: authenticated users can manage own"
  on public.reactions for all
  using (user_id = auth.uid());

-- ----------------------------------------------------------------
-- BADGES + GAMIFICATION POLICIES
-- ----------------------------------------------------------------
create policy "badges: anyone can read active badges"
  on public.badges for select
  using (active = true);

create policy "badges: content admins can manage"
  on public.badges for all
  using (public.is_content_admin());

create policy "user_badges: users can read own"
  on public.user_badges for select
  using (user_id = auth.uid() or public.is_super_admin());

create policy "user_badges: table members can read in table context"
  on public.user_badges for select
  using (public.is_table_member(table_id));

-- System awards badges (service role); no direct user insert
create policy "user_badges: system can insert"
  on public.user_badges for insert
  with check (public.is_super_admin());

create policy "points_ledger: users can read own"
  on public.points_ledger for select
  using (user_id = auth.uid());

create policy "points_ledger: table members can read table leaderboard data"
  on public.points_ledger for select
  using (public.is_table_member(table_id));

-- ----------------------------------------------------------------
-- NOTIFICATIONS POLICIES
-- ----------------------------------------------------------------
create policy "notifications: users can manage own"
  on public.notifications for all
  using (user_id = auth.uid());

-- ----------------------------------------------------------------
-- FILES POLICIES
-- ----------------------------------------------------------------
create policy "files: table members can read table files"
  on public.files for select
  using (
    public.is_table_member(table_id)
    or (visibility = 'public')
  );

create policy "files: facilitators can upload"
  on public.files for insert
  with check (
    auth.uid() = uploaded_by
    and public.is_table_facilitator(table_id)
  );

create policy "files: super admin full access"
  on public.files for all
  using (public.is_super_admin());

-- ----------------------------------------------------------------
-- SYSTEM SETTINGS + FEATURE FLAGS + AUDIT LOGS POLICIES
-- ----------------------------------------------------------------
create policy "system_settings: super admin only"
  on public.system_settings for all
  using (public.is_super_admin());

create policy "feature_flags: super admin can manage"
  on public.feature_flags for all
  using (public.is_super_admin());

create policy "feature_flags: authenticated can read enabled flags"
  on public.feature_flags for select
  using (enabled = true and auth.uid() is not null);

create policy "audit_logs: super admin can read"
  on public.audit_logs for select
  using (public.is_super_admin());

-- Audit logs are written via service role only in server actions
create policy "audit_logs: system can insert"
  on public.audit_logs for insert
  with check (public.is_super_admin());

-- ----------------------------------------------------------------
-- LEGAL PAGES POLICIES
-- ----------------------------------------------------------------
create policy "legal_pages: anyone can read published"
  on public.legal_pages for select
  using (published = true);

create policy "legal_pages: super admin can manage"
  on public.legal_pages for all
  using (public.is_super_admin());

-- ----------------------------------------------------------------
-- COURSE CATEGORIES POLICIES
-- ----------------------------------------------------------------
create policy "course_categories: anyone can read"
  on public.course_categories for select
  using (active = true);

create policy "course_categories: content admins can manage"
  on public.course_categories for all
  using (public.is_content_admin());
