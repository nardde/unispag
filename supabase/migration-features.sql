-- ============================================================================
-- UniPag — Migration: admin, reports, ratings, search, follows, notifications
-- Run in the Supabase SQL Editor. Idempotent (safe to run more than once).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Roles on profiles
-- ----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists role text not null default 'user'
  check (role in ('user', 'admin'));

-- Helper: is the current user an admin? (avoids recursive RLS on profiles)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- Admins may update / delete any profile or file.
drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all" on public.profiles
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "files_admin_all" on public.files;
create policy "files_admin_all" on public.files
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "subjects_admin_all" on public.subjects;
create policy "subjects_admin_all" on public.subjects
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "universities_admin_all" on public.universities;
create policy "universities_admin_all" on public.universities
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "careers_admin_all" on public.careers;
create policy "careers_admin_all" on public.careers
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- 2. Reports
-- ----------------------------------------------------------------------------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  file_id uuid references public.files (id) on delete cascade,
  reported_by uuid references public.profiles (id) on delete set null,
  reason text not null,
  details text,
  status text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  created_at timestamptz not null default now()
);
create index if not exists reports_file_id_idx on public.reports (file_id);
create unique index if not exists reports_unique_reporter
  on public.reports (file_id, reported_by);

alter table public.reports enable row level security;

drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own" on public.reports
  for insert to authenticated
  with check (auth.uid() = reported_by);

-- A reporter may read their own reports (so we can tell if they already reported).
drop policy if exists "reports_select_own" on public.reports;
create policy "reports_select_own" on public.reports
  for select to authenticated
  using (auth.uid() = reported_by);

drop policy if exists "reports_admin_all" on public.reports;
create policy "reports_admin_all" on public.reports
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- 3. File ratings (thumbs up / down)
-- ----------------------------------------------------------------------------
create table if not exists public.file_ratings (
  id uuid primary key default gen_random_uuid(),
  file_id uuid references public.files (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete cascade,
  value int not null check (value in (1, -1)),
  created_at timestamptz not null default now(),
  unique (file_id, user_id)
);
create index if not exists file_ratings_file_id_idx on public.file_ratings (file_id);

alter table public.file_ratings enable row level security;

drop policy if exists "file_ratings_select" on public.file_ratings;
create policy "file_ratings_select" on public.file_ratings
  for select using (true);

drop policy if exists "file_ratings_manage_own" on public.file_ratings;
create policy "file_ratings_manage_own" on public.file_ratings
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 4. Full-text search on files (Spanish)
-- ----------------------------------------------------------------------------
alter table public.files
  add column if not exists fts tsvector
  generated always as (
    to_tsvector('spanish', coalesce(title, '') || ' ' || coalesce(description, ''))
  ) stored;

create index if not exists files_fts_idx on public.files using gin (fts);

-- ----------------------------------------------------------------------------
-- 5. Subject follows
-- ----------------------------------------------------------------------------
create table if not exists public.subject_follows (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references public.subjects (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (subject_id, user_id)
);
create index if not exists subject_follows_subject_idx on public.subject_follows (subject_id);

alter table public.subject_follows enable row level security;

drop policy if exists "subject_follows_select" on public.subject_follows;
create policy "subject_follows_select" on public.subject_follows
  for select using (true);

drop policy if exists "subject_follows_manage_own" on public.subject_follows;
create policy "subject_follows_manage_own" on public.subject_follows
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 6. Notifications
-- ----------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete cascade,
  type text not null,
  message text not null,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, read);

alter table public.notifications enable row level security;

drop policy if exists "notifications_own" on public.notifications;
create policy "notifications_own" on public.notifications
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 7. Notify subject followers when a new file is uploaded
-- ----------------------------------------------------------------------------
create or replace function public.notify_subject_followers()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  s_name text;
  s_slug text;
  c_slug text;
  u_slug text;
begin
  if new.subject_id is null then
    return new;
  end if;

  select s.name, s.slug, c.slug, u.slug
    into s_name, s_slug, c_slug, u_slug
  from public.subjects s
  join public.careers c on c.id = s.career_id
  join public.universities u on u.id = c.university_id
  where s.id = new.subject_id;

  insert into public.notifications (user_id, type, message, link)
  select f.user_id,
         'new_file',
         'Nuevo archivo en ' || coalesce(s_name, 'una materia') || ': ' || new.title,
         '/' || u_slug || '/' || c_slug || '/' || s_slug
  from public.subject_follows f
  where f.subject_id = new.subject_id
    and f.user_id <> new.user_id; -- don't notify the uploader

  return new;
end;
$$;

drop trigger if exists on_file_created_notify on public.files;
create trigger on_file_created_notify
  after insert on public.files
  for each row execute function public.notify_subject_followers();
