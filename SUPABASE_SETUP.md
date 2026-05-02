# Supabase Setup Guide

This guide walks through connecting the Bible Trivia Game to Supabase for cloud sync.

---

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New project**
3. Choose a name (e.g. `bible-trivia`), set a database password, pick a region
4. Wait ~2 minutes for the project to provision

---

## 2. Run the Database Migration

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New query**
3. Copy and paste the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Click **Run**

This creates:
- `questions` table (custom + AI-generated questions)
- `sessions` table
- `teams` table
- `rounds` table
- `activities` table (score log)
- Row Level Security policies (public read/write for single-admin use)
- Indexes for common queries

---

## 3. Get Your API Keys

1. In your Supabase dashboard, go to **Settings → API**
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ keep this secret

---

## 4. Configure Environment Variables

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Fill in your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> ⚠️ **Never commit `.env.local` to git.** It is already in `.gitignore`.

---

## 5. Start the App

```bash
npm install
npm run dev
```

The sync indicator in the bottom-left sidebar will show **"Synced"** with a green dot once connected.

---

## What Gets Synced

| Data | Direction | Notes |
|---|---|---|
| Custom questions (manual + AI) | Push + Pull | Shared across all devices |
| Sessions | Push only | Per-device game data |
| Teams | Push only | Per-device |
| Rounds | Push only | Per-device |
| Activities (score log) | Push only | Per-device |
| Seed questions | Never | Bundled in `src/lib/data.ts` |
| Category settings | Never | Local preference |

### Sync Strategy

**Offline-first:** The app is fully functional without internet. All game data is stored in `localStorage` via Zustand.

**Dirty tracking:** Every mutation sets `synced: false` on the record via `markDirty()`. The sync engine reads all `synced: false` records and upserts them to Supabase.

**Auto-sync:** Runs on page load and every 60 seconds automatically.

**Manual sync:** Click the `↑↓` button in the sidebar sync panel, or click **Sync now** when dirty records are shown.

**Conflict resolution:** Last-write-wins based on `updated_at` timestamp (Unix ms). Remote questions with a newer `updated_at` than the local copy win during pull.

---

## API Endpoints

All routes are in `src/app/api/`:

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/questions` | Fetch all remote custom questions |
| `GET` | `/api/questions?since=<ms>` | Fetch questions updated after timestamp |
| `POST` | `/api/questions` | Upsert questions (bulk) |
| `DELETE` | `/api/questions?id=<id>` | Soft-delete a question |
| `POST` | `/api/sync` | Full sync: push all dirty + pull questions |

---

## Per-Question Sync Status

In the Questions browser, each custom question shows:

- **↑** (gold) — not yet synced to cloud; click to push immediately
- **✓** (green) — synced

---

## Security Notes

For a youth church admin tool shared with trusted users, the current RLS policies (public read/write) are fine.

If you want to add authentication later:

1. Enable **Supabase Auth** in the dashboard
2. Replace the `public_all_*` RLS policies with `auth.uid() is not null` checks
3. Add a login screen to the Next.js app

---

## Troubleshooting

**Sync indicator shows "Not configured"**
→ Check that `.env.local` exists and has the correct keys. Restart `npm run dev` after changing env vars.

**Sync shows "Error"**
→ Open browser DevTools → Console for the full error. Common causes:
- Wrong Supabase URL or key
- Migration not run yet
- RLS policies blocking the anon key

**Questions not appearing on another device**
→ Only custom questions (source: `manual` or `ai`) are synced. Seed questions live in `data.ts`. Trigger a manual sync on both devices.

---

## Authentication Setup (Migration 002)

After running the initial schema, run the auth migration:

1. Go to **SQL Editor** in your Supabase dashboard
2. Paste and run `supabase/migrations/002_add_auth.sql`

This adds:
- `user_id` column to all tables
- `category_settings` table (scoring/timing preferences per user)
- Per-user Row Level Security policies (each user sees only their own data)
- Questions remain publicly readable (shared question bank)

### Enable Email Auth

In your Supabase dashboard:
1. Go to **Authentication → Providers**
2. Ensure **Email** is enabled (it is by default)
3. Optionally enable **Magic Links** (passwordless sign-in)
4. Under **Authentication → Email Templates**, customise the confirmation email if desired

### What Syncs When Logged In

| Data | Syncs |
|---|---|
| Custom questions | ✅ Push + pull |
| Sessions | ✅ Push |
| Teams | ✅ Push |
| Rounds | ✅ Push |
| Activities (scores) | ✅ Push |
| Category settings (scoring/timing) | ✅ Push + pull |
| Seed questions | ❌ Bundled only |

### What Happens When Logged Out

All data is saved locally in `localStorage` as always. Nothing is sent to the database. The sync indicator shows a **"Sign In / Register"** button. Clicking it opens the auth modal.
