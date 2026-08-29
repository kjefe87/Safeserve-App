# SafeServe — Next.js scaffold

Replaces the Softr front end. Airtable stays the database — no data migration needed.
This gives you the Owner / Manager / Staff role-based routing that Softr's free tier
doesn't support, at $0/month hosting cost.

## What's built

- **Login** (`/login`) — Email + PIN against your existing `Users` table (Active must be checked)
- **Dashboard** (`/dashboard`) — role-aware nav, mirrors the Softr page-visibility table
- **Checklists** (`/checklists`) — fully working: lists the 18 FDA tasks, Mark Complete
  writes to both `Checklists` and `Compliance Logs` in one call (fixes the gap noted in
  the handoff doc section 3.3)
- **5 stub pages** (Issues Log, Temperature Logs, Inspection Report, Staff Certifications,
  Compliance Logs) — each has the auth/role check wired up already; you just need to add
  the data fetch, following the Checklists page as the template. The `lib/airtable.js`
  functions for all of these already exist and are restaurant-scoped.

## Setup

1. `npm install`
2. Copy `.env.local.example` to `.env.local` and fill in:
   - `AIRTABLE_API_KEY` — Airtable personal access token (needs read/write on your base)
   - `AIRTABLE_BASE_ID` — starts with `app...`, found in Airtable API docs for your base
   - `SESSION_SECRET` — random 32+ char string (`openssl rand -base64 32`)
3. `npm run dev` — runs at `localhost:3000`

## Important: PINs are now hashed, not plaintext

The `PIN` field in your `Users` table now stores a **bcrypt hash**, not the plain
number — the login route compares hashes in code rather than matching plaintext via
Airtable's filter. This means:

- Never type a plain PIN directly into the Airtable `PIN` field — it won't work, since
  login expects a hash there.
- To set or reset a user's PIN, run this from the project folder:
  ```
  node scripts/set-pin.js someone@example.com 1234
  ```
  This hashes `1234` and writes the hash into that user's `PIN` field. Do this once per
  user (owner, manager, each staff member) before they try to log in.
- Every user also needs `Active` checked to `TRUE` in Airtable.

If you already put a plaintext PIN in Airtable while testing earlier, re-run the script
for that user — it'll overwrite it with a proper hash.

## Deploying (free)

1. Push this folder to a GitHub repo
2. Import it in Vercel (vercel.com) — free tier, no card required
3. Add the same three env vars in Vercel's project settings
4. Deploy — you'll get a `.vercel.app` URL to replace `safeserve.softr.app`

## Next steps to finish the MVP

- Wire up the 5 stub pages (copy the Checklists pattern)
- Add the "missed task" reminder trigger point — since that's already built in Make.com,
  no changes needed there; Make.com watches Airtable directly, not the app
- When ready for the PDF inspection report, that can also stay entirely in Make.com —
  this app doesn't need to touch that automation at all
- Add basic styling — everything here is intentionally unstyled inline CSS so you can
  restyle freely in Cursor without fighting existing classes
