-- GCSG Dashboard schema
-- Public (anon) can read vendors, board members and public milestones, and can
-- submit newsletter sign-ups / material requests. Everything else is staff-only:
-- a signed-in user counts as staff only if their email is in public.staff.

create extension if not exists citext;

-- ── Staff allowlist ─────────────────────────────────────────────────────────
create table if not exists public.staff (
  email citext primary key,
  display_name text,
  initials text,
  created_at timestamptz not null default now()
);

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.staff
    where email = (auth.jwt() ->> 'email')::citext
  );
$$;

grant execute on function public.is_staff() to anon, authenticated;

-- ── Content tables ──────────────────────────────────────────────────────────
create table if not exists public.vendors (
  id bigint generated always as identity primary key,
  slug text unique not null,
  name text not null,
  role text,
  status_label text,
  status_tone text check (status_tone in ('done', 'progress', 'blocked', 'upcoming')),
  detail text,
  cost_label text,
  annual_cost numeric,
  signed boolean not null default false,
  risk_label text,
  risk_tone text check (risk_tone in ('done', 'progress', 'blocked', 'upcoming')),
  risk_points text[] not null default '{}',
  sort int not null default 0
);

create table if not exists public.board_members (
  id bigint generated always as identity primary key,
  name text not null,
  role text,
  initials text,
  sort int not null default 0
);

create table if not exists public.milestones (
  id bigint generated always as identity primary key,
  date_label text not null,
  sort_date date,
  title text not null,
  detail text,
  status text not null default 'upcoming'
    check (status in ('complete', 'in_progress', 'overdue', 'upcoming', 'deferred')),
  is_public boolean not null default false,
  public_title text,
  public_note text,
  sort int not null default 0
);

create table if not exists public.action_items (
  id bigint generated always as identity primary key,
  title text not null,
  owner text,
  status text not null default 'open'
    check (status in ('open', 'in_review', 'blocked', 'overdue', 'not_done', 'done')),
  due_date date,
  note text,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.resources (
  id bigint generated always as identity primary key,
  section text,
  name text not null,
  description text,
  kind text,
  url text,
  sort int not null default 0
);

create table if not exists public.vendor_terms (
  id bigint generated always as identity primary key,
  vendor_slug text not null references public.vendors (slug) on delete cascade,
  section text,
  term text not null,
  detail text,
  risk_level text,
  sort int not null default 0
);

create table if not exists public.meetings (
  slug text primary key,
  date date not null,
  title text not null,
  subtitle text,
  source_url text
);

create table if not exists public.meeting_notes (
  id bigint generated always as identity primary key,
  meeting_slug text not null references public.meetings (slug) on delete cascade,
  kind text not null check (kind in ('discussion', 'decision', 'action')),
  body text not null,
  owner text,
  sort int not null default 0
);
create index if not exists meeting_notes_meeting_idx on public.meeting_notes (meeting_slug, sort);

-- ── Public submissions ──────────────────────────────────────────────────────
create table if not exists public.subscribers (
  id bigint generated always as identity primary key,
  email citext unique not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  created_at timestamptz not null default now()
);

create table if not exists public.material_requests (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 200),
  email citext not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  organization text check (char_length(organization) <= 200),
  message text check (char_length(message) <= 4000),
  handled boolean not null default false,
  created_at timestamptz not null default now()
);

-- keep action_items.updated_at fresh
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists action_items_touch on public.action_items;
create trigger action_items_touch before update on public.action_items
  for each row execute function public.touch_updated_at();

-- ── Row-level security ──────────────────────────────────────────────────────
alter table public.staff enable row level security;
alter table public.vendors enable row level security;
alter table public.board_members enable row level security;
alter table public.milestones enable row level security;
alter table public.action_items enable row level security;
alter table public.resources enable row level security;
alter table public.vendor_terms enable row level security;
alter table public.meetings enable row level security;
alter table public.meeting_notes enable row level security;
alter table public.subscribers enable row level security;
alter table public.material_requests enable row level security;

-- staff can see the allowlist (to show names); only the SQL editor/service role edits it
create policy "staff read staff" on public.staff for select using (public.is_staff());

-- public content
create policy "public read vendors" on public.vendors for select using (true);
create policy "staff write vendors" on public.vendors for all using (public.is_staff()) with check (public.is_staff());

create policy "public read board" on public.board_members for select using (true);
create policy "staff write board" on public.board_members for all using (public.is_staff()) with check (public.is_staff());

create policy "public read public milestones" on public.milestones for select using (is_public or public.is_staff());
create policy "staff write milestones" on public.milestones for all using (public.is_staff()) with check (public.is_staff());

-- staff-only content
create policy "staff all action_items" on public.action_items for all using (public.is_staff()) with check (public.is_staff());
create policy "staff all resources" on public.resources for all using (public.is_staff()) with check (public.is_staff());
create policy "staff all vendor_terms" on public.vendor_terms for all using (public.is_staff()) with check (public.is_staff());
create policy "staff all meetings" on public.meetings for all using (public.is_staff()) with check (public.is_staff());
create policy "staff all meeting_notes" on public.meeting_notes for all using (public.is_staff()) with check (public.is_staff());

-- submissions: anyone may insert, only staff may read/manage
create policy "anyone subscribes" on public.subscribers for insert with check (true);
create policy "staff read subscribers" on public.subscribers for select using (public.is_staff());
create policy "staff delete subscribers" on public.subscribers for delete using (public.is_staff());

create policy "anyone requests materials" on public.material_requests for insert with check (true);
create policy "staff manage requests" on public.material_requests for select using (public.is_staff());
create policy "staff update requests" on public.material_requests for update using (public.is_staff()) with check (public.is_staff());
