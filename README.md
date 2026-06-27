# UniFiles

A clean, professional platform for university students to share and download
study material — notes, exams, summaries and more — organized by **university →
career → files**.

Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, and
**Supabase** (Auth + Postgres + Storage).

---

## Features

- 🏛️ Browse universities → careers → file repositories
- 🧭 Breadcrumb navigation throughout (Home › University › Career › Files)
- 🔍 Filter files by category and subject; sorted by most recent
- ⬇️ Public download — anyone can browse and download **without** logging in
- 🔐 Email + password auth (Supabase) — login required to **upload**
- 📤 Upload PDF, images, Word, PowerPoint, etc. with rich metadata
- 👤 Profile page listing your uploads, with delete (owner-only)
- 📱 Responsive, minimal design (Notion / Linear style) with loading & empty states

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

1. [`supabase/schema.sql`](./supabase/schema.sql) — creates tables, the
   `handle_new_user` trigger, all RLS policies, and the public `files` storage
   bucket with its policies.
2. [`supabase/seed.sql`](./supabase/seed.sql) — inserts the starter
   universities (Di Tella, San Andrés) and their careers.

You can copy-paste each file's contents into the SQL editor and click **Run**.

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
| `universities` | `id`, `name`, `slug`, `logo_url`, `description` |
| `careers`      | `id`, `university_id`, `name`, `slug`, `description` |
| `files`        | `id`, `career_id`, `user_id`, `title`, `description`, `category`, `subject`, `semester`, `year`, `file_url`, `file_name`, `file_size`, `created_at` |

A trigger (`handle_new_user`) automatically inserts a `profiles` row whenever a
new auth user is created, taking the `username` from sign-up metadata (falling
back to the email prefix, and de-duplicating on collision).

---

## Row Level Security (summary)

| Table          | SELECT | INSERT | UPDATE | DELETE |
| -------------- | ------ | ------ | ------ | ------ |
| `universities` | anyone | — | — | — |
| `careers`      | anyone | — | — | — |
| `profiles`     | anyone | own (`auth.uid() = id`) | own | — |
| `files`        | anyone | authenticated, own `user_id` | owner | owner |

**Storage bucket `files`:** public read, authenticated insert, owner-only
delete.

---

## Storage layout

Files are stored in the public `files` bucket using the path pattern:

```
/{university_slug}/{career_slug}/{timestamp}-{sanitized-filename}
```

Max upload size enforced client-side: **25 MB**.

---

## Project structure

```
app/
  layout.tsx                  # Root layout (Navbar + footer)
  page.tsx                    # Homepage — university grid
  not-found.tsx               # 404
  [university]/page.tsx       # Careers list
  [university]/[career]/page.tsx  # Files list + upload
  auth/login/page.tsx
  auth/signup/page.tsx
  auth/callback/route.ts      # Email-confirmation code exchange
  profile/page.tsx            # User's uploaded files
components/
  Navbar, Breadcrumb, UniversityCard, CareerCard,
  FileCard, FileList, FileUpload, ProfileFiles,
  AuthShell, SetupNotice
lib/
  supabase.ts                 # Browser + server client factories
  utils.ts                    # formatFileSize, slugify, etc.
types/
  index.ts                    # Shared TypeScript types
supabase/
  schema.sql                  # Tables, RLS, storage, trigger
  seed.sql                    # Seed universities + careers
middleware.ts                 # Refreshes the Supabase session per request
```

---

## Adding more universities / careers

Insert rows into `universities` and `careers` (via the SQL editor or the Table
editor). Make sure each `slug` is URL-safe and unique — slugs drive the routing
(`/{university_slug}/{career_slug}`).

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
