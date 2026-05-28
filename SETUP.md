# ParkEasy MY — Setup Guide

## Prerequisites
- Node.js 20+
- A free [Supabase](https://supabase.com) account
- npm

## 1. Clone & Install

```bash
git clone <your-github-repo-url>
cd parking_app
npm install
```

## 2. Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your actual credentials:

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (secret) |

## 3. Set Up the Database

In your Supabase project, go to **SQL Editor** and run these two files in order:

1. `supabase/migrations/001_initial_schema.sql` — creates all tables, RLS policies, and realtime
2. `supabase/seed.sql` — inserts 3 demo malls with ~500 parking slots

## 4. Enable Realtime

In Supabase → **Database → Replication**, ensure `parking_slots` and `parking_sessions` are enabled.

## 5. Create Admin User

In Supabase → **Authentication → Users**, click **Add user** and create:
- Email: `admin@parkeasy.my`
- Password: (your choice)

Then in SQL Editor, set the role:
```sql
update public.profiles 
set role = 'admin' 
where id = (select id from auth.users where email = 'admin@parkeasy.my');
```

## 6. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

| URL | Description |
|---|---|
| `/` | Public mall dashboard |
| `/mall/:id` | Live parking floor map |
| `/admin` | Admin dashboard |
| `/admin/entry` | Register vehicle entry |
| `/admin/exit` | Process vehicle exit |
| `/admin/rates` | Configure parking rates |

## 7. Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Add all `.env.local` variables in Vercel → Project → Settings → Environment Variables.

## Architecture

```
Next.js 16 (Vercel) ──► Supabase (PostgreSQL + Auth + Realtime)
                    ──► Billplz (Payment — Phase 2)
```

## Payment Integration (Phase 2)

For live payment processing, sign up at [Billplz](https://www.billplz.com) or [Billplz Sandbox](https://www.billplz-sandbox.com) and add:
- `BILLPLZ_API_KEY`
- `BILLPLZ_COLLECTION_ID`
- `BILLPLZ_X_SIGNATURE`

The sandbox mock flow is already wired in — just swap the credentials.

## Cost (POC)

| Service | Cost |
|---|---|
| Vercel | Free |
| Supabase | Free (500MB, 50K MAU) |
| Domain | Optional — ~RM 50/year |
| **Total** | **RM 0/month** |
