-- ============================================================================
-- UniPag — Seed data (universities + careers)
-- Run AFTER schema.sql, in the Supabase SQL Editor.
-- Safe to re-run: uses ON CONFLICT on the unique slug columns.
-- ============================================================================

insert into public.universities (name, slug, acronym, zone, description)
values
  (
    'Universidad Torcuato Di Tella',
    'di-tella',
    'UTDT',
    'Belgrano, CABA',
    'Universidad privada en Buenos Aires reconocida por sus programas en economía, derecho y negocios.'
  ),
  (
    'Universidad de San Andrés',
    'san-andres',
    'UdeSA',
    'Victoria, Pcia. de Bs. As.',
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

-- ----------------------------------------------------------------------------
-- Subjects — Derecho (Universidad Di Tella) curriculum, by year & semester
-- ----------------------------------------------------------------------------
insert into public.subjects (career_id, year, semester, name, slug)
select c.id, s.year, s.semester, s.name, s.slug
from public.careers c
join public.universities u on u.id = c.university_id
cross join (values
  (1, 1, 'Teoría General del Derecho', 'teoria-general-del-derecho'),
  (1, 1, 'Derecho Constitucional I', 'derecho-constitucional-i'),
  (1, 1, 'Fundamentos del Derecho Privado', 'fundamentos-del-derecho-privado'),
  (1, 1, 'Historia Contemporánea', 'historia-contemporanea'),
  (1, 2, 'Derecho Penal I', 'derecho-penal-i'),
  (1, 2, 'Derecho Constitucional II', 'derecho-constitucional-ii'),
  (1, 2, 'Filosofía Moral', 'filosofia-moral'),
  (1, 2, 'Obligaciones', 'obligaciones'),
  (2, 1, 'Derecho de Daños y Seguros', 'derecho-de-danos-y-seguros'),
  (2, 1, 'Derecho Penal II', 'derecho-penal-ii'),
  (2, 1, 'Lógica y Redacción', 'logica-y-redaccion'),
  (2, 1, 'Microeconomía', 'microeconomia'),
  (2, 2, 'Derechos Reales', 'derechos-reales'),
  (2, 2, 'Análisis Económico del Derecho', 'analisis-economico-del-derecho'),
  (2, 2, 'Filosofía Política', 'filosofia-politica'),
  (2, 2, 'Derecho Procesal Penal', 'derecho-procesal-penal'),
  (3, 1, 'Familia y Sucesiones', 'familia-y-sucesiones'),
  (3, 1, 'Contratos I', 'contratos-i'),
  (3, 1, 'Derecho Laboral y de la Seguridad Social', 'derecho-laboral-y-de-la-seguridad-social'),
  (3, 1, 'Sociedades', 'sociedades'),
  (3, 2, 'Derecho Procesal Civil I', 'derecho-procesal-civil-i'),
  (3, 2, 'Derecho Administrativo', 'derecho-administrativo'),
  (3, 2, 'Derecho y Sociedad', 'derecho-y-sociedad'),
  (3, 2, 'Derecho Internacional Público', 'derecho-internacional-publico'),
  (4, 1, 'Derecho Procesal Civil II', 'derecho-procesal-civil-ii'),
  (4, 1, 'Macroeconomía', 'macroeconomia'),
  (4, 1, 'Derecho Tributario', 'derecho-tributario'),
  (4, 2, 'Concursos y Quiebras', 'concursos-y-quiebras'),
  (4, 2, 'Contabilidad y Análisis Financiero', 'contabilidad-y-analisis-financiero'),
  (4, 2, 'Contratos II', 'contratos-ii'),
  (4, 2, 'Derecho Internacional Privado', 'derecho-internacional-privado'),
  (5, 1, 'Derecho Ambiental', 'derecho-ambiental'),
  (5, 2, 'Mediación y Arbitraje', 'mediacion-y-arbitraje'),
  (5, 2, 'Ética Profesional', 'etica-profesional')
) as s(year, semester, name, slug)
where u.slug = 'di-tella' and c.slug = 'derecho'
on conflict (career_id, slug) do nothing;

-- ----------------------------------------------------------------------------
-- CABA / AMBA universities (subjects are created collaboratively by users)
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
  set acronym = excluded.acronym, zone = excluded.zone;

insert into public.careers (university_id, name, slug)
select u.id, c.name, c.slug
from (values
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
  ('uai', 'Medicina', 'medicina'),
  ('uai', 'Abogacía', 'abogacia'),
  ('uai', 'Psicología', 'psicologia'),
  ('uai', 'Ingeniería en Sistemas', 'ingenieria-en-sistemas'),
  ('uai', 'Administración de Empresas', 'administracion-de-empresas'),
  ('uai', 'Comunicación', 'comunicacion'),
  ('uai', 'Diseño Gráfico', 'diseno-grafico'),
  ('uai', 'Arquitectura', 'arquitectura'),
  ('uai', 'Enfermería', 'enfermeria'),
  ('ub', 'Abogacía', 'abogacia'),
  ('ub', 'Arquitectura', 'arquitectura'),
  ('ub', 'Ingeniería en Sistemas', 'ingenieria-en-sistemas'),
  ('ub', 'Psicología', 'psicologia'),
  ('ub', 'Administración de Empresas', 'administracion-de-empresas'),
  ('ub', 'Relaciones Internacionales', 'relaciones-internacionales'),
  ('ub', 'Diseño Industrial', 'diseno-industrial'),
  ('ub', 'Nutrición', 'nutricion'),
  ('ub', 'Contador Público', 'contador-publico'),
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
  ('kennedy', 'Psicología', 'psicologia'),
  ('kennedy', 'Abogacía', 'abogacia'),
  ('kennedy', 'Contador Público', 'contador-publico'),
  ('kennedy', 'Administración de Empresas', 'administracion-de-empresas'),
  ('kennedy', 'Ciencias de la Educación', 'ciencias-de-la-educacion'),
  ('kennedy', 'Kinesiología', 'kinesiologia'),
  ('kennedy', 'Nutrición', 'nutricion'),
  ('usal', 'Abogacía', 'abogacia'),
  ('usal', 'Psicología', 'psicologia'),
  ('usal', 'Medicina', 'medicina'),
  ('usal', 'Ciencias de la Educación', 'ciencias-de-la-educacion'),
  ('usal', 'Administración de Empresas', 'administracion-de-empresas'),
  ('usal', 'Relaciones Internacionales', 'relaciones-internacionales'),
  ('usal', 'Filosofía', 'filosofia'),
  ('usal', 'Comunicación Social', 'comunicacion-social'),
  ('usal', 'Historia', 'historia'),
  ('austral', 'Administración de Empresas', 'administracion-de-empresas'),
  ('austral', 'Derecho', 'derecho'),
  ('austral', 'Ingeniería Industrial', 'ingenieria-industrial'),
  ('austral', 'Medicina', 'medicina'),
  ('austral', 'Comunicación', 'comunicacion'),
  ('austral', 'Economía', 'economia'),
  ('austral', 'Ingeniería en Sistemas', 'ingenieria-en-sistemas'),
  ('austral', 'Psicología', 'psicologia'),
  ('itba', 'Ingeniería en Informática', 'ingenieria-en-informatica'),
  ('itba', 'Ingeniería Industrial', 'ingenieria-industrial'),
  ('itba', 'Ingeniería Electrónica', 'ingenieria-electronica'),
  ('itba', 'Ingeniería Química', 'ingenieria-quimica'),
  ('itba', 'Ingeniería en Petróleo', 'ingenieria-en-petroleo'),
  ('itba', 'Licenciatura en Análisis de Negocios', 'licenciatura-en-analisis-de-negocios'),
  ('ucema', 'Economía', 'economia'),
  ('ucema', 'Administración de Empresas', 'administracion-de-empresas'),
  ('ucema', 'Contador Público', 'contador-publico'),
  ('ucema', 'Finanzas', 'finanzas'),
  ('ucema', 'Marketing', 'marketing'),
  ('ucema', 'Ingeniería en Sistemas', 'ingenieria-en-sistemas')
) as c(uni_slug, name, slug)
join public.universities u on u.slug = c.uni_slug
on conflict (university_id, slug) do nothing;
