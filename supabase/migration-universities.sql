-- ============================================================================
-- UniFiles — Migration: CABA/AMBA universities + collaborative subjects
-- Run in the Supabase SQL Editor. Idempotent (safe to run more than once).
-- Adds: acronym/zone on universities, description + INSERT policy on subjects,
-- and seeds 10 new universities with their careers.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. New columns
-- ----------------------------------------------------------------------------
alter table public.universities add column if not exists acronym text;
alter table public.universities add column if not exists zone text;

alter table public.subjects add column if not exists description text;

-- ----------------------------------------------------------------------------
-- 2. Let any authenticated user create subjects (crowdsourced)
-- ----------------------------------------------------------------------------
drop policy if exists "subjects_insert_authenticated" on public.subjects;
create policy "subjects_insert_authenticated" on public.subjects
  for insert to authenticated
  with check (true);

-- ----------------------------------------------------------------------------
-- 3. Backfill acronym/zone for the universities that already exist
-- ----------------------------------------------------------------------------
update public.universities set acronym = 'UTDT', zone = 'Belgrano, CABA'
  where slug = 'di-tella';
update public.universities set acronym = 'UdeSA', zone = 'Victoria, Pcia. de Bs. As.'
  where slug = 'san-andres';

-- ----------------------------------------------------------------------------
-- 4. Seed the 10 new universities
-- ----------------------------------------------------------------------------
insert into public.universities (name, slug, acronym, zone, description)
values
  ('Universidad Argentina de la Empresa', 'uade', 'UADE', 'Monserrat, CABA',
   'Universidad privada con fuerte orientación a negocios, tecnología y diseño.'),
  ('Universidad Católica Argentina', 'uca', 'UCA', 'Puerto Madero, CABA',
   'Universidad privada católica con amplia oferta académica.'),
  ('Universidad Abierta Interamericana', 'uai', 'UAI', 'CABA y GBA',
   'Universidad privada con sedes en CABA y el Gran Buenos Aires.'),
  ('Universidad de Belgrano', 'ub', 'UB', 'Belgrano, CABA',
   'Universidad privada reconocida por su tradición académica.'),
  ('Universidad de Palermo', 'up', 'UP', 'Palermo, CABA',
   'Universidad privada destacada en diseño, arquitectura y comunicación.'),
  ('Universidad Argentina J. F. Kennedy', 'kennedy', 'UK', 'Monserrat, CABA',
   'Universidad privada con amplia oferta en ciencias sociales y de la salud.'),
  ('Universidad del Salvador', 'usal', 'USAL', 'Recoleta, CABA',
   'Universidad privada jesuita con larga trayectoria.'),
  ('Universidad Austral', 'austral', 'Austral', 'Pilar y CABA',
   'Universidad privada con campus en Pilar y sede en CABA.'),
  ('Instituto Tecnológico de Buenos Aires', 'itba', 'ITBA', 'Puerto Madero, CABA',
   'Instituto privado especializado en ingeniería y tecnología.'),
  ('Universidad del CEMA', 'ucema', 'UCEMA', 'San Nicolás, CABA',
   'Universidad privada con foco en economía, negocios y finanzas.')
on conflict (slug) do update
  set acronym = excluded.acronym,
      zone = excluded.zone,
      description = coalesce(public.universities.description, excluded.description);

-- ----------------------------------------------------------------------------
-- 5. Seed careers for the new universities (one big list, joined by uni slug)
-- ----------------------------------------------------------------------------
insert into public.careers (university_id, name, slug)
select u.id, c.name, c.slug
from (values
  -- UADE
  ('uade', 'Administración de Empresas', 'administracion-de-empresas'),
  ('uade', 'Contador Público', 'contador-publico'),
  ('uade', 'Ingeniería en Sistemas', 'ingenieria-en-sistemas'),
  ('uade', 'Ingeniería Industrial', 'ingenieria-industrial'),
  ('uade', 'Abogacía', 'abogacia'),
  ('uade', 'Marketing', 'marketing'),
  ('uade', 'Diseño Gráfico', 'diseno-grafico'),
  ('uade', 'Arquitectura', 'arquitectura'),
  ('uade', 'Relaciones Internacionales', 'relaciones-internacionales'),
  ('uade', 'Recursos Humanos', 'recursos-humanos'),
  -- UCA
  ('uca', 'Derecho', 'derecho'),
  ('uca', 'Administración de Empresas', 'administracion-de-empresas'),
  ('uca', 'Economía', 'economia'),
  ('uca', 'Psicología', 'psicologia'),
  ('uca', 'Medicina', 'medicina'),
  ('uca', 'Ingeniería Civil', 'ingenieria-civil'),
  ('uca', 'Ciencias Políticas', 'ciencias-politicas'),
  ('uca', 'Comunicación Social', 'comunicacion-social'),
  ('uca', 'Filosofía', 'filosofia'),
  ('uca', 'Teología', 'teologia'),
  -- UAI
  ('uai', 'Medicina', 'medicina'),
  ('uai', 'Abogacía', 'abogacia'),
  ('uai', 'Psicología', 'psicologia'),
  ('uai', 'Ingeniería en Sistemas', 'ingenieria-en-sistemas'),
  ('uai', 'Administración de Empresas', 'administracion-de-empresas'),
  ('uai', 'Comunicación', 'comunicacion'),
  ('uai', 'Diseño Gráfico', 'diseno-grafico'),
  ('uai', 'Arquitectura', 'arquitectura'),
  ('uai', 'Enfermería', 'enfermeria'),
  -- UB
  ('ub', 'Abogacía', 'abogacia'),
  ('ub', 'Arquitectura', 'arquitectura'),
  ('ub', 'Ingeniería en Sistemas', 'ingenieria-en-sistemas'),
  ('ub', 'Psicología', 'psicologia'),
  ('ub', 'Administración de Empresas', 'administracion-de-empresas'),
  ('ub', 'Relaciones Internacionales', 'relaciones-internacionales'),
  ('ub', 'Diseño Industrial', 'diseno-industrial'),
  ('ub', 'Nutrición', 'nutricion'),
  ('ub', 'Contador Público', 'contador-publico'),
  -- UP
  ('up', 'Diseño Gráfico', 'diseno-grafico'),
  ('up', 'Arquitectura', 'arquitectura'),
  ('up', 'Abogacía', 'abogacia'),
  ('up', 'Administración de Empresas', 'administracion-de-empresas'),
  ('up', 'Psicología', 'psicologia'),
  ('up', 'Ingeniería en Informática', 'ingenieria-en-informatica'),
  ('up', 'Comunicación', 'comunicacion'),
  ('up', 'Diseño de Indumentaria', 'diseno-de-indumentaria'),
  ('up', 'Marketing', 'marketing'),
  ('up', 'Relaciones Públicas', 'relaciones-publicas'),
  -- Kennedy
  ('kennedy', 'Psicología', 'psicologia'),
  ('kennedy', 'Abogacía', 'abogacia'),
  ('kennedy', 'Contador Público', 'contador-publico'),
  ('kennedy', 'Administración de Empresas', 'administracion-de-empresas'),
  ('kennedy', 'Ciencias de la Educación', 'ciencias-de-la-educacion'),
  ('kennedy', 'Kinesiología', 'kinesiologia'),
  ('kennedy', 'Nutrición', 'nutricion'),
  -- USAL
  ('usal', 'Abogacía', 'abogacia'),
  ('usal', 'Psicología', 'psicologia'),
  ('usal', 'Medicina', 'medicina'),
  ('usal', 'Ciencias de la Educación', 'ciencias-de-la-educacion'),
  ('usal', 'Administración de Empresas', 'administracion-de-empresas'),
  ('usal', 'Relaciones Internacionales', 'relaciones-internacionales'),
  ('usal', 'Filosofía', 'filosofia'),
  ('usal', 'Comunicación Social', 'comunicacion-social'),
  ('usal', 'Historia', 'historia'),
  -- Austral
  ('austral', 'Administración de Empresas', 'administracion-de-empresas'),
  ('austral', 'Derecho', 'derecho'),
  ('austral', 'Ingeniería Industrial', 'ingenieria-industrial'),
  ('austral', 'Medicina', 'medicina'),
  ('austral', 'Comunicación', 'comunicacion'),
  ('austral', 'Economía', 'economia'),
  ('austral', 'Ingeniería en Sistemas', 'ingenieria-en-sistemas'),
  ('austral', 'Psicología', 'psicologia'),
  -- ITBA
  ('itba', 'Ingeniería en Informática', 'ingenieria-en-informatica'),
  ('itba', 'Ingeniería Industrial', 'ingenieria-industrial'),
  ('itba', 'Ingeniería Electrónica', 'ingenieria-electronica'),
  ('itba', 'Ingeniería Química', 'ingenieria-quimica'),
  ('itba', 'Ingeniería en Petróleo', 'ingenieria-en-petroleo'),
  ('itba', 'Licenciatura en Análisis de Negocios', 'licenciatura-en-analisis-de-negocios'),
  -- UCEMA
  ('ucema', 'Economía', 'economia'),
  ('ucema', 'Administración de Empresas', 'administracion-de-empresas'),
  ('ucema', 'Contador Público', 'contador-publico'),
  ('ucema', 'Finanzas', 'finanzas'),
  ('ucema', 'Marketing', 'marketing'),
  ('ucema', 'Ingeniería en Sistemas', 'ingenieria-en-sistemas')
) as c(uni_slug, name, slug)
join public.universities u on u.slug = c.uni_slug
on conflict (university_id, slug) do nothing;
