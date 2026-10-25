# Switching on accounts (Supabase)

Accounts stay hidden until these settings exist. The site works without them. Supabase's screens change names from time to time; if a label below differs, look for the nearest match.

## 1. Create the project

1. Sign in at supabase.com and create a new project. Choose the Mumbai region (closest to learners in India) and save the database password somewhere safe.
2. Open the SQL editor, paste the whole of `supabase/migrations/20261025000000_initial.sql`, and run it once. It creates the tables, row-level security and grants.

## 2. Copy three values into Vercel

In Supabase, open the project's API settings (Project Settings, then API or API Keys) and copy:

- the project URL
- the publishable key (older projects call it the anon key)
- the secret key (older projects call it the service_role key). This one is a secret: never paste it into code, chat or a document.

In Vercel, open the project, then Settings, then Environment Variables, and add them for Production and Preview:

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | the project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the publishable (anon) key |
| `SUPABASE_SERVICE_ROLE_KEY` | the secret (service_role) key |
| `NEXT_PUBLIC_SITE_URL` | `https://xplaind.in` |

Then redeploy, so the new values are built in.

## 3. Tell Supabase where sign-in links may go

In Supabase, Authentication, then URL Configuration:

- Site URL: `https://xplaind.in`
- Redirect URLs: add `https://xplaind.in/auth/callback**` and, for Vercel previews, `https://*-zaiphr.vercel.app/auth/callback**`

Email sign-in is on by default. Supabase's built-in email sender allows only a few emails an hour, which is fine for testing. Before launch, connect a proper email service (slice S7).

## 4. Check it works

Open the site, use "Sign in" in the footer, tick "I am 18 or older", and open the emailed link in the same browser. You should land on the dashboard with your test result and progress from that device.
