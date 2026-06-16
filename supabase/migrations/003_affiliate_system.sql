-- ============================================================
-- MIGRATION 003: Affiliate System
-- ============================================================

-- ----------------------------------------------------------------
-- AFFILIATE SETTINGS (platform-wide, editable by Super Admin)
-- ----------------------------------------------------------------
create table public.affiliate_settings (
  id                              uuid primary key default uuid_generate_v4(),
  default_destination_url         text not null default 'https://legacyplan.app/',
  default_payout_amount           numeric(10,2) not null default 179.99,
  payout_currency                 text not null default 'USD',
  cta_default_text                text not null default 'Ready to turn learning into action? Start your Global Pathway.',
  cta_default_text_event          text not null default 'Ready for the next step? Begin your Global Pathway.',
  cta_default_text_course         text not null default 'You''ve learned the concept. Now build your plan.',
  allow_table_cta_customization   boolean not null default false,
  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now()
);

comment on table public.affiliate_settings is 'Platform-wide affiliate and CTA settings. Single row. Super Admin only.';

create trigger affiliate_settings_updated_at
  before update on public.affiliate_settings
  for each row execute procedure public.set_updated_at();

-- ----------------------------------------------------------------
-- AFFILIATE LINKS (one per Equity Table)
-- ----------------------------------------------------------------
create table public.affiliate_links (
  id              uuid primary key default uuid_generate_v4(),
  table_id        uuid not null unique references public.equity_tables(id) on delete cascade,
  code            text not null unique,
  destination_url text not null,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.affiliate_links is 'Unique affiliate link per Equity Table for Global Pathways referrals.';

create trigger affiliate_links_updated_at
  before update on public.affiliate_links
  for each row execute procedure public.set_updated_at();

create index idx_affiliate_links_code on public.affiliate_links(code) where active = true;

-- ----------------------------------------------------------------
-- AFFILIATE CLICKS
-- ----------------------------------------------------------------
create table public.affiliate_clicks (
  id                  uuid primary key default uuid_generate_v4(),
  table_id            uuid references public.equity_tables(id) on delete set null,
  user_id             uuid references public.profiles(id) on delete set null,
  affiliate_link_id   uuid references public.affiliate_links(id) on delete set null,
  course_id           uuid,   -- FK added after courses table
  lesson_id           uuid,   -- FK added after lessons table
  event_id            uuid,   -- FK added after events table
  cta_text            text,
  cta_placement       text,   -- e.g. 'lesson_end', 'event_post', 'dashboard'
  destination_url     text not null,
  ip_hash             text,   -- hashed, never plain IP
  user_agent          text,
  clicked_at          timestamptz not null default now()
);

comment on table public.affiliate_clicks is 'Every click on a Global Pathways CTA, linked to table + user.';

create index idx_clicks_table on public.affiliate_clicks(table_id, clicked_at desc);
create index idx_clicks_user on public.affiliate_clicks(user_id, clicked_at desc);
create index idx_clicks_link on public.affiliate_clicks(affiliate_link_id);

-- ----------------------------------------------------------------
-- AFFILIATE CONVERSIONS
-- ----------------------------------------------------------------
create table public.affiliate_conversions (
  id                  uuid primary key default uuid_generate_v4(),
  table_id            uuid references public.equity_tables(id) on delete set null,
  user_id             uuid references public.profiles(id) on delete set null,
  affiliate_click_id  uuid references public.affiliate_clicks(id) on delete set null,
  purchaser_email     text not null,
  external_order_id   text,
  amount              numeric(10,2) not null,
  payout_amount       numeric(10,2) not null,
  payout_status       payout_status_type not null default 'pending',
  source              conversion_source_type not null,
  notes               text,
  converted_at        timestamptz not null default now(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.affiliate_conversions is 'Global Pathways purchase attributed to an Equity Table.';

create trigger conversions_updated_at
  before update on public.affiliate_conversions
  for each row execute procedure public.set_updated_at();

-- Increment pathway_participant_count when conversion confirmed
create or replace function public.sync_pathway_count()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.payout_status = 'approved' and (old.payout_status is null or old.payout_status != 'approved') then
    update public.equity_tables
    set pathway_participant_count = pathway_participant_count + 1
    where id = new.table_id;
  end if;
  return new;
end;
$$;

create trigger sync_pathway_count_on_conversion
  after insert or update on public.affiliate_conversions
  for each row execute procedure public.sync_pathway_count();

create index idx_conversions_table on public.affiliate_conversions(table_id, payout_status);

-- ----------------------------------------------------------------
-- AFFILIATE PAYOUTS
-- ----------------------------------------------------------------
create table public.affiliate_payouts (
  id              uuid primary key default uuid_generate_v4(),
  table_id        uuid not null references public.equity_tables(id) on delete cascade,
  amount          numeric(10,2) not null,
  status          payout_status_type not null default 'pending',
  payment_method  text,
  notes           text,
  processed_by    uuid references public.profiles(id),
  paid_at         timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.affiliate_payouts is 'Payout records to Equity Tables for affiliate conversions.';

create trigger payouts_updated_at
  before update on public.affiliate_payouts
  for each row execute procedure public.set_updated_at();

create index idx_payouts_table on public.affiliate_payouts(table_id, status);
