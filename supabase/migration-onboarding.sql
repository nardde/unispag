-- ============================================================================
-- UniFiles — Migration: onboarding, profile personalization, feedback
-- Run in the Supabase SQL Editor. Idempotent (safe to run more than once).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Profile columns
-- ----------------------------------------------------------------------------
alter table public.profiles add column if not exists onboarding_completed boolean not null default false;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists year_of_study int;
alter table public.profiles add column if not exists feedback_given boolean not null default false;
alter table public.profiles add column if not exists visit_count int not null default 0;
alter table public.profiles add column if not exists first_visit_at timestamptz;

-- year_of_study range check (guarded so re-runs don't error)
do $$
begin
  alter table public.profiles
    add constraint profiles_year_of_study_chk check (year_of_study between 1 and 6);
exception
  when duplicate_object then null;
end $$;

-- ----------------------------------------------------------------------------
-- 2. user_universities / user_careers
-- ----------------------------------------------------------------------------
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
create policy "user_universities_select" on public.user_universities
  for select using (true);

drop policy if exists "user_universities_manage_own" on public.user_universities;
create policy "user_universities_manage_own" on public.user_universities
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_careers_select" on public.user_careers;
create policy "user_careers_select" on public.user_careers
  for select using (true);

drop policy if exists "user_careers_manage_own" on public.user_careers;
create policy "user_careers_manage_own" on public.user_careers
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 3. Feedback
-- ----------------------------------------------------------------------------
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
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "feedback_admin_select" on public.feedback;
create policy "feedback_admin_select" on public.feedback
  for select to authenticated
  using (public.is_admin());

-- ----------------------------------------------------------------------------
-- 4. Avatars storage bucket (public read, owner-only write under their folder)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars_owner_write" on storage.objects;
create policy "avatars_owner_write" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_owner_update" on storage.objects;
create policy "avatars_owner_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_owner_delete" on storage.objects;
create policy "avatars_owner_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
