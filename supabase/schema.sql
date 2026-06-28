-- ============================================================================
-- UniPag — Database schema, RLS policies, storage, and triggers
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.universities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  acronym text,
  zone text,
  logo_url text,
  description text
);

create table if not exists public.careers (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities (id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  unique (university_id, slug)
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  career_id uuid not null references public.careers (id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  year int not null check (year between 1 and 7),
  semester int not null check (semester between 1 and 2),
  created_at timestamptz not null default now(),
  unique (career_id, slug)
);

create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  career_id uuid not null references public.careers (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  category text not null check (category in ('notes', 'exam', 'summary', 'other')),
  subject text not null,
  semester text,
  year int,
  file_url text not null,
  file_name text not null,
  file_size bigint not null default 0,
  downloads int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists files_career_id_idx on public.files (career_id);
create index if not exists files_subject_id_idx on public.files (subject_id);
create index if not exists files_user_id_idx on public.files (user_id);
create index if not exists careers_university_id_idx on public.careers (university_id);
create index if not exists subjects_career_id_idx on public.subjects (career_id);

-- ----------------------------------------------------------------------------
-- Auto-create a profile row when a new auth user signs up.
-- Reads `username` from the signup metadata; falls back to the email prefix.
-- ----------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  desired_username text;
begin
  desired_username := coalesce(
    nullif(new.raw_user_meta_data ->> 'username', ''),
    split_part(new.email, '@', 1)
  );

  -- Ensure uniqueness by appending a short suffix on collision.
  if exists (select 1 from public.profiles where username = desired_username) then
    desired_username := desired_username || '-' || substr(new.id::text, 1, 4);
  end if;

  insert into public.profiles (id, username)
  values (new.id, desired_username);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.universities enable row level security;
alter table public.careers enable row level security;
alter table public.subjects enable row level security;
alter table public.files enable row level security;

-- Universities: public read.
drop policy if exists "universities_select" on public.universities;
create policy "universities_select" on public.universities
  for select using (true);

-- Careers: public read.
drop policy if exists "careers_select" on public.careers;
create policy "careers_select" on public.careers
  for select using (true);

-- Subjects: public read; any authenticated user can create (crowdsourced).
drop policy if exists "subjects_select" on public.subjects;
create policy "subjects_select" on public.subjects
  for select using (true);

drop policy if exists "subjects_insert_authenticated" on public.subjects;
create policy "subjects_insert_authenticated" on public.subjects
  for insert to authenticated
  with check (true);

-- Profiles: public read; users can insert/update their own row.
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Files: public read; authenticated users insert their own; owners delete/update.
drop policy if exists "files_select" on public.files;
create policy "files_select" on public.files
  for select using (true);

drop policy if exists "files_insert_authenticated" on public.files;
create policy "files_insert_authenticated" on public.files
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "files_delete_own" on public.files;
create policy "files_delete_own" on public.files
  for delete to authenticated
  using (auth.uid() = user_id);

drop policy if exists "files_update_own" on public.files;
create policy "files_update_own" on public.files
  for update to authenticated
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- increment_downloads(): public, SECURITY DEFINER so anyone (even anonymous)
-- can bump a file's download counter without broad UPDATE rights.
-- ----------------------------------------------------------------------------
create or replace function public.increment_downloads(p_file_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.files set downloads = downloads + 1 where id = p_file_id;
$$;

grant execute on function public.increment_downloads(uuid) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- Storage bucket: "files" (public read, authenticated write/delete-own)
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('files', 'files', true)
on conflict (id) do nothing;

drop policy if exists "files_bucket_public_read" on storage.objects;
create policy "files_bucket_public_read" on storage.objects
  for select using (bucket_id = 'files');

drop policy if exists "files_bucket_authenticated_insert" on storage.objects;
create policy "files_bucket_authenticated_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'files');

drop policy if exists "files_bucket_owner_delete" on storage.objects;
create policy "files_bucket_owner_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'files' and owner = auth.uid());

-- ============================================================================
-- Feature layer (admin, reports, ratings, FTS, follows, notifications)
-- Mirrors supabase/migration-features.sql so fresh installs include everything.
-- ============================================================================

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

-- ----------------------------------------------------------------------------
-- Onboarding / profile personalization / feedback
-- ----------------------------------------------------------------------------
alter table public.profiles add column if not exists onboarding_completed boolean not null default false;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists year_of_study int;
alter table public.profiles add column if not exists feedback_given boolean not null default false;
alter table public.profiles add column if not exists visit_count int not null default 0;
alter table public.profiles add column if not exists first_visit_at timestamptz;

do $$
begin
  alter table public.profiles
    add constraint profiles_year_of_study_chk check (year_of_study between 1 and 6);
exception
  when duplicate_object then null;
end $$;

create table if not exists public.user_universities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  university_id uuid not null references public.universities (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, university_id)
);

create table if not exists public.user_careers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  career_id uuid not null references public.careers (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, career_id)
);

create index if not exists user_universities_user_idx on public.user_universities (user_id);
create index if not exists user_careers_user_idx on public.user_careers (user_id);

alter table public.user_universities enable row level security;
alter table public.user_careers enable row level security;

drop policy if exists "user_universities_select" on public.user_universities;
create policy "user_universities_select" on public.user_universities for select using (true);
drop policy if exists "user_universities_manage_own" on public.user_universities;
create policy "user_universities_manage_own" on public.user_universities
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_careers_select" on public.user_careers;
create policy "user_careers_select" on public.user_careers for select using (true);
drop policy if exists "user_careers_manage_own" on public.user_careers;
create policy "user_careers_manage_own" on public.user_careers
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  rating int check (rating between 1 and 5),
  liked text[],
  improvements text[],
  improvements_other text,
  nps_score int check (nps_score between 0 and 10),
  contact_email text,
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;
drop policy if exists "feedback_insert_own" on public.feedback;
create policy "feedback_insert_own" on public.feedback
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "feedback_admin_select" on public.feedback;
create policy "feedback_admin_select" on public.feedback
  for select to authenticated using (public.is_admin());

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects for select using (bucket_id = 'avatars');
drop policy if exists "avatars_owner_write" on storage.objects;
create policy "avatars_owner_write" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatars_owner_update" on storage.objects;
create policy "avatars_owner_update" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatars_owner_delete" on storage.objects;
create policy "avatars_owner_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ----------------------------------------------------------------------------
-- Subject/career reports + career & feature suggestions
-- ----------------------------------------------------------------------------
create table if not exists public.subject_reports (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references public.subjects (id) on delete cascade,
  reported_by uuid references public.profiles (id) on delete set null,
  reason text not null,
  details text,
  status text not null default 'pending' check (status in ('pending','resolved','dismissed')),
  created_at timestamptz not null default now(),
  unique (subject_id, reported_by)
);
alter table public.subject_reports enable row level security;
drop policy if exists "subject_reports_insert_own" on public.subject_reports;
create policy "subject_reports_insert_own" on public.subject_reports for insert to authenticated with check (auth.uid() = reported_by);
drop policy if exists "subject_reports_select_own" on public.subject_reports;
create policy "subject_reports_select_own" on public.subject_reports for select to authenticated using (auth.uid() = reported_by);
drop policy if exists "subject_reports_admin_all" on public.subject_reports;
create policy "subject_reports_admin_all" on public.subject_reports for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table if not exists public.career_suggestions (
  id uuid primary key default gen_random_uuid(),
  university_id uuid references public.universities (id) on delete cascade,
  suggested_by uuid references public.profiles (id) on delete set null,
  career_name text not null,
  faculty text,
  additional_info text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);
alter table public.career_suggestions enable row level security;
drop policy if exists "career_suggestions_insert_own" on public.career_suggestions;
create policy "career_suggestions_insert_own" on public.career_suggestions for insert to authenticated with check (auth.uid() = suggested_by);
drop policy if exists "career_suggestions_admin_all" on public.career_suggestions;
create policy "career_suggestions_admin_all" on public.career_suggestions for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table if not exists public.career_reports (
  id uuid primary key default gen_random_uuid(),
  career_id uuid references public.careers (id) on delete cascade,
  reported_by uuid references public.profiles (id) on delete set null,
  reason text not null,
  details text,
  status text not null default 'pending' check (status in ('pending','resolved','dismissed')),
  created_at timestamptz not null default now(),
  unique (career_id, reported_by)
);
alter table public.career_reports enable row level security;
drop policy if exists "career_reports_insert_own" on public.career_reports;
create policy "career_reports_insert_own" on public.career_reports for insert to authenticated with check (auth.uid() = reported_by);
drop policy if exists "career_reports_select_own" on public.career_reports;
create policy "career_reports_select_own" on public.career_reports for select to authenticated using (auth.uid() = reported_by);
drop policy if exists "career_reports_admin_all" on public.career_reports;
create policy "career_reports_admin_all" on public.career_reports for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  type text not null,
  title text not null,
  description text not null,
  contact_email text,
  status text not null default 'pending' check (status in ('pending','approved','planned','completed','rejected')),
  created_at timestamptz not null default now()
);
alter table public.suggestions enable row level security;
drop policy if exists "suggestions_select_public" on public.suggestions;
create policy "suggestions_select_public" on public.suggestions for select using (status not in ('pending','rejected'));
drop policy if exists "suggestions_insert" on public.suggestions;
create policy "suggestions_insert" on public.suggestions for insert to authenticated with check (true);
drop policy if exists "suggestions_admin_all" on public.suggestions;
create policy "suggestions_admin_all" on public.suggestions for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table if not exists public.suggestion_upvotes (
  id uuid primary key default gen_random_uuid(),
  suggestion_id uuid references public.suggestions (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (suggestion_id, user_id)
);
alter table public.suggestion_upvotes enable row level security;
drop policy if exists "suggestion_upvotes_select" on public.suggestion_upvotes;
create policy "suggestion_upvotes_select" on public.suggestion_upvotes for select using (true);
drop policy if exists "suggestion_upvotes_manage_own" on public.suggestion_upvotes;
create policy "suggestion_upvotes_manage_own" on public.suggestion_upvotes for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
