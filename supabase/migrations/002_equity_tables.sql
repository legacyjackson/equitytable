-- ============================================================
-- MIGRATION 002: Equity Tables, Types, Memberships, Subscriptions
-- ============================================================

-- ----------------------------------------------------------------
-- EQUITY TABLE TYPES
-- ----------------------------------------------------------------
create table public.equity_table_types (
  id                        uuid primary key default uuid_generate_v4(),
  name                      text not null unique,
  slug                      text not null unique,
  description               text,
  recommended_goals         jsonb default '[]',
  default_course_categories text[],
  religious_content_allowed boolean not null default false,
  sort_order                int not null default 0,
  active                    boolean not null default true,
  created_at                timestamptz not null default now()
);

comment on table public.equity_table_types is 'Defines Equity Table types: CBO, Christian, Muslim, Business, etc.';

-- ----------------------------------------------------------------
-- EQUITY TABLES
-- ----------------------------------------------------------------
create table public.equity_tables (
  id                          uuid primary key default uuid_generate_v4(),
  owner_id                    uuid not null references public.profiles(id),
  table_type_id               uuid not null references public.equity_table_types(id),
  name                        text not null,
  slug                        text not null unique,
  mission                     text,
  description                 text,
  logo_url                    text,
  banner_url                  text,
  visibility                  visibility_type not null default 'public',

  -- Metrics (denormalized for performance, updated via triggers/jobs)
  member_count                int not null default 0,
  pathway_participant_count   int not null default 0,

  -- Affiliate
  affiliate_code              text unique,
  affiliate_default_url       text,
  publish_affiliate_earnings  boolean not null default false,

  -- Community settings
  public_message_board        boolean not null default false,
  leaderboard_enabled         boolean not null default true,
  allow_public_goals          boolean not null default true,
  allow_public_events         boolean not null default true,

  -- CTA customization (only if Super Admin enables allow_table_cta_customization)
  cta_override_text           text,

  -- Status
  status                      table_status_type not null default 'active',

  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),

  constraint name_length check (char_length(name) >= 2 and char_length(name) <= 100),
  constraint mission_length check (char_length(mission) <= 300),
  constraint slug_format check (slug ~ '^[a-z0-9-]+$')
);

comment on table public.equity_tables is 'Core entity. Each licensed Equity Table organization.';

create trigger equity_tables_updated_at
  before update on public.equity_tables
  for each row execute procedure public.set_updated_at();

-- Index for public directory lookups
create index idx_equity_tables_visibility on public.equity_tables(visibility) where status = 'active';
create index idx_equity_tables_slug on public.equity_tables(slug);
create index idx_equity_tables_owner on public.equity_tables(owner_id);

-- ----------------------------------------------------------------
-- TABLE MEMBERSHIPS
-- ----------------------------------------------------------------
create table public.table_memberships (
  id          uuid primary key default uuid_generate_v4(),
  table_id    uuid not null references public.equity_tables(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  role        table_role_type not null default 'member',
  status      membership_status_type not null default 'active',
  invited_by  uuid references public.profiles(id),
  joined_at   timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  unique (table_id, user_id)
);

comment on table public.table_memberships is 'User membership in Equity Tables with role and status.';

create trigger table_memberships_updated_at
  before update on public.table_memberships
  for each row execute procedure public.set_updated_at();

create index idx_memberships_table on public.table_memberships(table_id, status);
create index idx_memberships_user on public.table_memberships(user_id, status);

-- ----------------------------------------------------------------
-- TRIGGER: Update member_count when memberships change
-- ----------------------------------------------------------------
create or replace function public.sync_member_count()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.equity_tables
  set member_count = (
    select count(*)
    from public.table_memberships
    where table_id = coalesce(new.table_id, old.table_id)
      and status = 'active'
  )
  where id = coalesce(new.table_id, old.table_id);

  return coalesce(new, old);
end;
$$;

create trigger sync_member_count_on_change
  after insert or update or delete on public.table_memberships
  for each row execute procedure public.sync_member_count();

-- ----------------------------------------------------------------
-- TABLE INVITATIONS
-- ----------------------------------------------------------------
create table public.table_invitations (
  id              uuid primary key default uuid_generate_v4(),
  table_id        uuid not null references public.equity_tables(id) on delete cascade,
  invited_email   text not null,
  invited_by      uuid not null references public.profiles(id),
  role            table_role_type not null default 'member',
  token           text not null unique default encode(gen_random_bytes(32), 'hex'),
  status          invitation_status_type not null default 'pending',
  expires_at      timestamptz not null default (now() + interval '14 days'),
  created_at      timestamptz not null default now(),
  accepted_at     timestamptz,
  accepted_by     uuid references public.profiles(id)
);

comment on table public.table_invitations is 'Pending invitations to join an Equity Table.';

create index idx_invitations_token on public.table_invitations(token) where status = 'pending';
create index idx_invitations_email on public.table_invitations(invited_email, status);
create index idx_invitations_table on public.table_invitations(table_id, status);

-- ----------------------------------------------------------------
-- SUBSCRIPTIONS
-- ----------------------------------------------------------------
create table public.subscriptions (
  id                      uuid primary key default uuid_generate_v4(),
  table_id                uuid not null unique references public.equity_tables(id) on delete cascade,
  stripe_customer_id      text,
  stripe_subscription_id  text unique,
  base_price_id           text,       -- Stripe price ID for $49.99/mo base
  extra_seat_price_id     text,       -- Stripe price ID for $4.99/seat
  status                  subscription_status_type not null default 'active',
  included_seats          int not null default 10,
  extra_seats             int not null default 0,
  current_period_start    timestamptz,
  current_period_end      timestamptz,
  cancel_at_period_end    boolean not null default false,
  trial_end               timestamptz,
  -- Super Admin overrides
  comped                  boolean not null default false,
  comp_reason             text,
  comped_by               uuid references public.profiles(id),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

comment on table public.subscriptions is 'Stripe subscription state per Equity Table.';

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute procedure public.set_updated_at();

-- ----------------------------------------------------------------
-- SEAT USAGE SNAPSHOTS (for billing audit trail)
-- ----------------------------------------------------------------
create table public.seat_usage_snapshots (
  id                    uuid primary key default uuid_generate_v4(),
  table_id              uuid not null references public.equity_tables(id) on delete cascade,
  active_seats          int not null,
  included_seats        int not null,
  billable_extra_seats  int not null,
  captured_at           timestamptz not null default now()
);

create index idx_seat_snapshots_table on public.seat_usage_snapshots(table_id, captured_at desc);
