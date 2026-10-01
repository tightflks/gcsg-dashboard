# GCSG Dashboard

Georgia Council for Safer Gaming: a public transparency page plus an internal board & staff dashboard. Built with **Next.js 15 (App Router)** and **Supabase**, and deployable to **Vercel**.

| Route | Who | What |
| --- | --- | --- |
| `/` | Public | Transparency report: vendor status, budget, who we serve, timeline, board, newsletter sign-up, material requests |
| `/login` | Staff | Email + password or magic-link sign-in |
| `/admin` | Staff | KPIs, vendor spend, action items (filter, add, edit, delete, change status), risk notes, full timeline (change status, show/hide on public page), meeting log, resources & links |
| `/admin/meetings` | Staff | All meeting notes, with full-text search across every note |
| `/admin/meetings/[slug]` | Staff | One meeting's discussion, decisions and actions, with its Otter/ClickUp source |
| `/admin/vendors/[slug]` | Staff | Vendor detail and contract analysis (e.g. Kindbridge agreement terms) |
| `/admin/inbox` | Staff | Material requests (reply, mark handled) and newsletter subscribers (copy, CSV) |

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, open a new query, paste all of `supabase/setup_all.sql`, edit the staff emails at the bottom, and click **Run**. It creates the tables and row-level security, loads the spreadsheet data and adds staff in one go, and it is safe to re-run (it clears earlier attempts first). The last row should read `Setup complete | 16 | 346 | 27`.
   - Equivalent manual route: run `supabase/migrations/0001_init.sql`, then `supabase/seed.sql`.
3. Give staff access. Only emails in the `staff` table can see `/admin` data:
   ```sql
   insert into public.staff (email, display_name, initials) values
     ('you@example.org', 'Your Name', 'YN');
   ```
4. In **Authentication → Users**, click **Invite user** (or **Add user**) for each staff email.
5. In **Authentication → Sign In / Providers → Email**, turn off **Allow new users to sign up**. Staff sign-in is invite-only (the login form never creates accounts).
6. In **Authentication → URL Configuration**, set **Site URL** to your Vercel URL and add `https://<your-domain>/auth/callback` to the redirect URLs, so magic links work.

### Security model

- **Anyone** can read vendors, board members and milestones marked public. Anyone can also submit a newsletter sign-up or a material request.
- **Everything else** (action items, meeting notes, resources, contract analysis, submissions) is readable and writable only by signed-in users whose email is in `public.staff`. Row-level security enforces this in the database, not just in the UI.

## 2. Deploy to Vercel

1. Import this repo in Vercel (it detects Next.js automatically).
2. Add environment variables (see `.env.example`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL`, e.g. `https://gcsg-dashboard.vercel.app`
3. Deploy.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in your Supabase keys
npm run dev
```

Without Supabase keys, `npm run dev` runs in **demo mode**. Pages use the bundled seed data (`src/data/seed.json`), `/admin` opens without sign-in, and edits are rejected with a "read-only" message. In production, `/admin` always requires Supabase auth.

## Updating data from the spreadsheet

```bash
pip install openpyxl
python3 scripts/import_xlsx.py "path/to/GCSG Meetings and Links.xlsx"
```

This regenerates `supabase/seed.sql` and `src/data/seed.json` from the spreadsheet's Resources & Links, Meeting Notes, Timeline and Kindbridge Agreement Analysis tabs. Re-running `seed.sql` **replaces** the content tables. It never touches staff, subscribers or material requests. Action items edited in the dashboard are also reset, so back them up first if needed.

Vendors, board members and the curated action items are defined in the `STATIC` block of the import script.
