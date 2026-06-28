-- ============================================================================
-- UniPag — Migration: subject/career reports, career & feature suggestions
-- Run in the Supabase SQL Editor. Idempotent (safe to run more than once).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. subject_reports
-- ----------------------------------------------------------------------------
create table if not exists public.subject_reports (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references public.subjects (id) on delete cascade,
  reported_by uuid references public.profiles (id) on delete set null,
  reason text not null,
  details text,
  status text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  unique (subject_id, reported_by)
);
alter table public.subject_reports enable row level security;

drop policy if exists "subject_reports_insert_own" on public.subject_reports;
create policy "subject_reports_insert_own" on public.subject_reports
  for insert to authenticated with check (auth.uid() = reported_by);
drop policy if exists "subject_reports_select_own" on public.subject_reports;
create policy "subject_reports_select_own" on public.subject_reports
  for select to authenticated using (auth.uid() = reported_by);
drop policy if exists "subject_reports_admin_all" on public.subject_reports;
create policy "subject_reports_admin_all" on public.subject_reports
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- 2. career_suggestions
-- ----------------------------------------------------------------------------
create table if not exists public.career_suggestions (
  id uuid primary key default gen_random_uuid(),
  university_id uuid references public.universities (id) on delete cascade,
  suggested_by uuid references public.profiles (id) on delete set null,
  career_name text not null,
  faculty text,
  additional_info text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);
alter table public.career_suggestions enable row level security;

drop policy if exists "career_suggestions_insert_own" on public.career_suggestions;
create policy "career_suggestions_insert_own" on public.career_suggestions
  for insert to authenticated with check (auth.uid() = suggested_by);
drop policy if exists "career_suggestions_admin_all" on public.career_suggestions;
create policy "career_suggestions_admin_all" on public.career_suggestions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- 3. career_reports
-- ----------------------------------------------------------------------------
create table if not exists public.career_reports (
  id uuid primary key default gen_random_uuid(),
  career_id uuid references public.careers (id) on delete cascade,
  reported_by uuid references public.profiles (id) on delete set null,
  reason text not null,
  details text,
  status text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  unique (career_id, reported_by)
);
alter table public.career_reports enable row level security;

drop policy if exists "career_reports_insert_own" on public.career_reports;
create policy "career_reports_insert_own" on public.career_reports
  for insert to authenticated with check (auth.uid() = reported_by);
drop policy if exists "career_reports_select_own" on public.career_reports;
create policy "career_reports_select_own" on public.career_reports
  for select to authenticated using (auth.uid() = reported_by);
drop policy if exists "career_reports_admin_all" on public.career_reports;
create policy "career_reports_admin_all" on public.career_reports
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- 4. suggestions (feature requests) + upvotes
-- ----------------------------------------------------------------------------
create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  type text not null,
  title text not null,
  description text not null,
  contact_email text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'planned', 'completed', 'rejected')),
  created_at timestamptz not null default now()
);
alter table public.suggestions enable row level security;

drop policy if exists "suggestions_select_public" on public.suggestions;
create policy "suggestions_select_public" on public.suggestions
  for select using (status not in ('pending', 'rejected'));
drop policy if exists "suggestions_insert" on public.suggestions;
create policy "suggestions_insert" on public.suggestions
  for insert to authenticated with check (true);
drop policy if exists "suggestions_admin_all" on public.suggestions;
create policy "suggestions_admin_all" on public.suggestions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table if not exists public.suggestion_upvotes (
  id uuid primary key default gen_random_uuid(),
  suggestion_id uuid references public.suggestions (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (suggestion_id, user_id)
);
alter table public.suggestion_upvotes enable row level security;

drop policy if exists "suggestion_upvotes_select" on public.suggestion_upvotes;
create policy "suggestion_upvotes_select" on public.suggestion_upvotes
  for select using (true);
drop policy if exists "suggestion_upvotes_manage_own" on public.suggestion_upvotes;
create policy "suggestion_upvotes_manage_own" on public.suggestion_upvotes
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
