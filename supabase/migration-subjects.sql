-- ============================================================================
-- UniFiles — Migration: subject organization + download counter
-- Run this in the Supabase SQL Editor IF you already ran the original
-- schema.sql / seed.sql. It is idempotent (safe to run more than once).
-- For a brand-new project, schema.sql + seed.sql already include all of this.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. subjects table (year/semester curriculum layer)
-- ----------------------------------------------------------------------------
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  career_id uuid not null references public.careers (id) on delete cascade,
  name text not null,
  slug text not null,
  year int not null check (year between 1 and 7),
  semester int not null check (semester between 1 and 2),
  created_at timestamptz not null default now(),
  unique (career_id, slug)
);

create index if not exists subjects_career_id_idx on public.subjects (career_id);

alter table public.subjects enable row level security;

drop policy if exists "subjects_select" on public.subjects;
create policy "subjects_select" on public.subjects
  for select using (true);

-- ----------------------------------------------------------------------------
-- 2. files: link to subject + download counter
-- ----------------------------------------------------------------------------
alter table public.files
  add column if not exists subject_id uuid references public.subjects (id) on delete set null;

alter table public.files
  add column if not exists downloads int not null default 0;

create index if not exists files_subject_id_idx on public.files (subject_id);

-- ----------------------------------------------------------------------------
-- 3. increment_downloads(): public, SECURITY DEFINER so anyone can bump the
--    counter on download without broad UPDATE rights on the files table.
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
-- 4. Seed Derecho (Universidad Di Tella) curriculum subjects
-- ----------------------------------------------------------------------------
insert into public.subjects (career_id, year, semester, name, slug)
select c.id, s.year, s.semester, s.name, s.slug
from public.careers c
join public.universities u on u.id = c.university_id
cross join (values
  -- Año 1
  (1, 1, 'Teoría General del Derecho', 'teoria-general-del-derecho'),
  (1, 1, 'Derecho Constitucional I', 'derecho-constitucional-i'),
  (1, 1, 'Fundamentos del Derecho Privado', 'fundamentos-del-derecho-privado'),
  (1, 1, 'Historia Contemporánea', 'historia-contemporanea'),
  (1, 2, 'Derecho Penal I', 'derecho-penal-i'),
  (1, 2, 'Derecho Constitucional II', 'derecho-constitucional-ii'),
  (1, 2, 'Filosofía Moral', 'filosofia-moral'),
  (1, 2, 'Obligaciones', 'obligaciones'),
  -- Año 2
  (2, 1, 'Derecho de Daños y Seguros', 'derecho-de-danos-y-seguros'),
  (2, 1, 'Derecho Penal II', 'derecho-penal-ii'),
  (2, 1, 'Lógica y Redacción', 'logica-y-redaccion'),
  (2, 1, 'Microeconomía', 'microeconomia'),
  (2, 2, 'Derechos Reales', 'derechos-reales'),
  (2, 2, 'Análisis Económico del Derecho', 'analisis-economico-del-derecho'),
  (2, 2, 'Filosofía Política', 'filosofia-politica'),
  (2, 2, 'Derecho Procesal Penal', 'derecho-procesal-penal'),
  -- Año 3
  (3, 1, 'Familia y Sucesiones', 'familia-y-sucesiones'),
  (3, 1, 'Contratos I', 'contratos-i'),
  (3, 1, 'Derecho Laboral y de la Seguridad Social', 'derecho-laboral-y-de-la-seguridad-social'),
  (3, 1, 'Sociedades', 'sociedades'),
  (3, 2, 'Derecho Procesal Civil I', 'derecho-procesal-civil-i'),
  (3, 2, 'Derecho Administrativo', 'derecho-administrativo'),
  (3, 2, 'Derecho y Sociedad', 'derecho-y-sociedad'),
  (3, 2, 'Derecho Internacional Público', 'derecho-internacional-publico'),
  -- Año 4
  (4, 1, 'Derecho Procesal Civil II', 'derecho-procesal-civil-ii'),
  (4, 1, 'Macroeconomía', 'macroeconomia'),
  (4, 1, 'Derecho Tributario', 'derecho-tributario'),
  (4, 2, 'Concursos y Quiebras', 'concursos-y-quiebras'),
  (4, 2, 'Contabilidad y Análisis Financiero', 'contabilidad-y-analisis-financiero'),
  (4, 2, 'Contratos II', 'contratos-ii'),
  (4, 2, 'Derecho Internacional Privado', 'derecho-internacional-privado'),
  -- Año 5
  (5, 1, 'Derecho Ambiental', 'derecho-ambiental'),
  (5, 2, 'Mediación y Arbitraje', 'mediacion-y-arbitraje'),
  (5, 2, 'Ética Profesional', 'etica-profesional')
) as s(year, semester, name, slug)
where u.slug = 'di-tella' and c.slug = 'derecho'
on conflict (career_id, slug) do nothing;
