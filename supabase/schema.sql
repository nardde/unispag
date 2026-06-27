-- ============================================================================
-- UniFiles — Database schema, RLS policies, storage, and triggers
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
