-- ============================================================================
-- UniFiles — Seed data (universities + careers)
-- Run AFTER schema.sql, in the Supabase SQL Editor.
-- Safe to re-run: uses ON CONFLICT on the unique slug columns.
-- ============================================================================

insert into public.universities (name, slug, description)
values
  (
    'Universidad Torcuato Di Tella',
    'di-tella',
    'Universidad privada en Buenos Aires reconocida por sus programas en economía, derecho y negocios.'
  ),
  (
    'Universidad de San Andrés',
    'san-andres',
    'Universidad privada en Victoria, Buenos Aires, con foco en formación académica de excelencia.'
  )
on conflict (slug) do nothing;

-- Careers for Universidad Di Tella
insert into public.careers (university_id, name, slug)
select u.id, c.name, c.slug
from public.universities u
cross join (values
  ('Derecho', 'derecho'),
  ('Administración de Empresas', 'administracion-de-empresas'),
  ('Economía', 'economia'),
  ('Ingeniería Informática', 'ingenieria-informatica'),
  ('Arquitectura', 'arquitectura')
) as c(name, slug)
where u.slug = 'di-tella'
on conflict (university_id, slug) do nothing;

-- Careers for Universidad de San Andrés
insert into public.careers (university_id, name, slug)
select u.id, c.name, c.slug
from public.universities u
cross join (values
  ('Administración', 'administracion'),
  ('Economía', 'economia'),
  ('Derecho', 'derecho'),
  ('Comunicación', 'comunicacion'),
  ('Ingeniería', 'ingenieria')
) as c(name, slug)
where u.slug = 'san-andres'
on conflict (university_id, slug) do nothing;
