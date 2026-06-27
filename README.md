# UniFiles

A clean, Apple-inspired platform for university students to share and download
study material — notes, exams, summaries and more — organized by **university →
career → subject (year & semester) → files**.

Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, and
**Supabase** (Auth + Postgres + Storage).

---

## Features

- 🏛️ 12 CABA/AMBA universities → careers → subjects → files, with a homepage search
- ✍️ **Collaborative subjects** — any logged-in user can add a materia (year/semester), Wikipedia-style, with case-insensitive duplicate protection
- 📚 Subjects organized by **year and semester** (accordion), with a search bar
- 🧭 Breadcrumbs throughout (Inicio › Di Tella › Derecho › 2° Año › Contratos I)
- 🔢 File counts on university, career and subject cards
- 🔍 Filter files by category + sort toggle (**Más recientes / Más descargados**)
- ⬇️ Public download — anyone can browse and download **without** logging in
- 📈 Per-file download counter (via a `SECURITY DEFINER` RPC)
- 🔐 Email + password auth (Supabase) — login required to **upload**
- 📤 Drag & drop upload with cascading **Year → Semester → Subject** selection
- 👤 Profile page listing your uploads, with delete (owner-only)
- 🍎 Apple-style design: frosted-glass navbar, pill buttons, soft shadows, SVG empty states
- 📱 Fully responsive with loading & empty states

---

## Tech stack

| Layer            | Technology                          |
| ---------------- | ----------------------------------- |
| Frontend         | Next.js 14 (App Router) + TypeScript |
| Styling          | Tailwind CSS                        |
| Backend          | Next.js API Routes / Server Components |
| Auth / DB / Storage | Supabase                         |

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Wait for it to finish provisioning.

### 3. Configure environment variables

Copy the example file and fill in your project's values:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

> Find these under **Supabase Dashboard → Project Settings → API**
> (`Project URL` and `anon` `public` key).

### 4. Set up the database, RLS, and storage

Open **Supabase Dashboard → SQL Editor → New query** and run, in order:

1. [`supabase/schema.sql`](./supabase/schema.sql) — creates all tables
   (`profiles`, `universities`, `careers`, `subjects`, `files`), the
   `handle_new_user` trigger, the `increment_downloads` RPC, all RLS policies,
   and the public `files` storage bucket with its policies.
2. [`supabase/seed.sql`](./supabase/seed.sql) — inserts the starter
   universities (Di Tella, San Andrés), their careers, and the full **Derecho
   (Di Tella) curriculum** as subjects (by year & semester).

You can copy-paste each file's contents into the SQL editor and click **Run**.

> **Upgrading an existing database?** Run these migrations in the SQL Editor
> (each is idempotent — safe to re-run):
>
> 1. [`supabase/migration-subjects.sql`](./supabase/migration-subjects.sql) —
>    adds the `subjects` table, `subject_id` + `downloads` on `files`, the
>    `increment_downloads` RPC, RLS, and seeds the Derecho curriculum.
> 2. [`supabase/migration-universities.sql`](./supabase/migration-universities.sql) —
>    adds `acronym`/`zone` on universities, `description` + an authenticated
>    INSERT policy on `subjects`, and seeds the 10 CABA/AMBA universities and
>    their careers.
> 3. [`supabase/migration-features.sql`](./supabase/migration-features.sql) —
>    see **Nuevas migraciones** below.
> 4. [`supabase/migration-onboarding.sql`](./supabase/migration-onboarding.sql) —
>    see **Nuevas migraciones** below.

## Nuevas migraciones

[`supabase/migration-features.sql`](./supabase/migration-features.sql) adds the
admin system, reports, ratings, full-text search, follows and notifications.
Run it once in the **SQL Editor** (idempotent). It creates / alters:

- `profiles.role` (`user` | `admin`) + an `is_admin()` helper and admin RLS
  policies (admins can manage any file / subject / university / report / user)
- `reports` table (+ RLS: users insert/read their own, admins manage all)
- `file_ratings` table (thumbs up/down, one per user per file)
- `files.fts` generated `tsvector` column + GIN index (Spanish full-text search)
- `subject_follows` and `notifications` tables (+ RLS)
- `notify_subject_followers()` trigger — inserts a notification for every
  follower when a new file is uploaded to a subject

### Make yourself an admin

After running the migration, find your user UUID in
**Authentication → Users**, then run in the SQL Editor:

```sql
UPDATE profiles SET role = 'admin' WHERE id = 'YOUR_USER_UUID';
```

The admin panel lives at **/admin** and is protected: non-admins are redirected
to the homepage (enforced in `app/admin/layout.tsx`).

### Email verification (Item 12)

Enable **Authentication → Providers → Email → "Confirm email"** in Supabase.
Unverified users can browse and download, but the upload and rating actions are
gated — they see a "Verificá tu email para subir" call to action that links to
`/verify-email` (which can resend the confirmation email).

### Onboarding, profile personalization & feedback

[`supabase/migration-onboarding.sql`](./supabase/migration-onboarding.sql)
(idempotent) adds:

- `profiles` columns: `onboarding_completed`, `bio`, `year_of_study` (1–6),
  `feedback_given`, `visit_count`, `first_visit_at` (`avatar_url` already exists)
- `user_universities` and `user_careers` (each user's selected unis/careers, RLS:
  public read, owner manages)
- `feedback` table (rating, liked[], improvements[], `improvements_other`, NPS,
  contact email) — users insert their own, admins read all
- `avatars` storage bucket (public read; users write only under their own
  `{user_id}/…` folder)

What it powers:

- **First-login onboarding** (3-step overlay) to pick universities & careers,
  re-openable from the homepage "Personalizar" button. The homepage then shows
  your universities first (with a "Tu universidad" badge) and a "Tus materias"
  section.
- **Profile personalization**: avatar upload (camera overlay, JPG/PNG/WEBP ≤5MB,
  initials fallback with a consistent color), `/perfil/editar` (username with
  live uniqueness check, bio with counter, year, uni/career multi-selects), and
  the public profile shows avatar, bio and badges.
- **Feedback**: a one-time modal triggered by the 3rd download, the 1st upload,
  or 7 days + 3 visits; results live in the admin **Opiniones** section
  (averages, NPS, distribution, tag clouds, table, CSV export).

### 5. (Optional) Email confirmation

By default Supabase requires email confirmation on sign-up. The app handles
both modes:

- **Confirmation ON** → users see a "check your email" screen; the link points
  to `/auth/callback` which exchanges the code for a session.
- **Confirmation OFF** → users are logged in immediately after sign-up.

To toggle it: **Authentication → Providers → Email → "Confirm email"**. For
local development you may want it **off** for convenience.

> If confirmation is **on**, add your local URL to
> **Authentication → URL Configuration → Redirect URLs**, e.g.
> `http://localhost:3000/auth/callback`.

### 6. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Database schema

| Table          | Columns |
| -------------- | ------- |
| `profiles`     | `id` (= `auth.uid`), `username`, `avatar_url`, `created_at` |
| `universities` | `id`, `name`, `slug`, `acronym`, `zone`, `logo_url`, `description` |
| `careers`      | `id`, `university_id`, `name`, `slug`, `description` |
| `subjects`     | `id`, `career_id`, `name`, `slug`, `description`, `year` (1–7), `semester` (1–2), `created_at` |
| `files`        | `id`, `career_id`, `subject_id`, `user_id`, `title`, `description`, `category`, `subject`, `semester`, `year`, `file_url`, `file_name`, `file_size`, `downloads`, `created_at` |

A trigger (`handle_new_user`) automatically inserts a `profiles` row whenever a
new auth user is created, taking the `username` from sign-up metadata (falling
back to the email prefix, and de-duplicating on collision).

---

## Row Level Security (summary)

| Table          | SELECT | INSERT | UPDATE | DELETE |
| -------------- | ------ | ------ | ------ | ------ |
| `universities` | anyone | — | — | — |
| `careers`      | anyone | — | — | — |
| `subjects`     | anyone | any authenticated user | — | — |
| `profiles`     | anyone | own (`auth.uid() = id`) | own | — |
| `files`        | anyone | authenticated, own `user_id` | owner | owner |

**Storage bucket `files`:** public read, authenticated insert, owner-only
delete.

The `increment_downloads(uuid)` function is `SECURITY DEFINER` and granted to
`anon` + `authenticated`, so download counts can be bumped without granting
broad `UPDATE` on `files`.

---

## Storage layout

Files are stored in the public `files` bucket using the path pattern:

```
/{university_slug}/{career_slug}/{subject_slug}/{timestamp}-{sanitized-filename}
```

Max upload size enforced client-side: **25 MB**.

---

## Project structure

```
app/
  layout.tsx                  # Root layout (Navbar + footer)
  page.tsx                    # Homepage — university grid
  not-found.tsx               # 404
  [university]/page.tsx       # Careers list (with file counts)
  [university]/[career]/page.tsx           # Subjects by year/semester + search
  [university]/[career]/[subject]/page.tsx # Files for a subject + filters/sort
  auth/login/page.tsx
  auth/signup/page.tsx
  auth/callback/route.ts      # Email-confirmation code exchange
  profile/page.tsx            # User's uploaded files
components/
  Navbar, Breadcrumb, UniversityCard, UniversityGrid, CareerCard,
  SubjectCard, SubjectAccordion, AddSubject, FileCard, FileBrowser,
  FileUpload, ProfileFiles, AuthShell, EmptyState, SetupNotice, icons
lib/
  supabase.ts                 # Browser client factory
  supabase-server.ts          # Server client factory (cookies)
  utils.ts                    # formatFileSize, slugify, etc.
types/
  index.ts                    # Shared TypeScript types
supabase/
  schema.sql                  # Tables, RLS, storage, trigger, RPC
  seed.sql                    # Seed all 12 universities, careers + Derecho subjects
  migration-subjects.sql      # Upgrade: subjects + downloads system
  migration-universities.sql  # Upgrade: 12 universities + collaborative subjects
middleware.ts                 # Refreshes the Supabase session per request
```

---

## Adding more universities / careers / subjects

Insert rows into `universities`, `careers` and `subjects` (via the SQL editor or
the Table editor). Make sure each `slug` is URL-safe and unique within its parent
— slugs drive the routing (`/{university_slug}/{career_slug}/{subject_slug}`).
For subjects, set `year` (1–7) and `semester` (1 or 2) so they group correctly in
the accordion. See `supabase/migration-subjects.sql` for the Derecho example.

---

## Scripts

| Command         | Description                |
| --------------- | -------------------------- |
| `npm run dev`   | Start the dev server       |
| `npm run build` | Production build           |
| `npm run start` | Run the production build   |
| `npm run lint`  | Lint with ESLint           |

---

## License

MIT — free to use for and by students.
