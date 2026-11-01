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

## 4. Switch on Google sign-in

1. Go to [Google Cloud Console](https://console.cloud.google.com/), then APIs & Services, then Credentials.
2. Choose Create credentials, then OAuth client ID, then Web application. If Google asks, set up the consent screen first: External, app name "Xplaind", your support email.
3. Under Authorised redirect URIs, add `https://blgqdjtbzhrtiohepmvn.supabase.co/auth/v1/callback`.
4. Copy the Client ID and Client secret.
5. In Supabase, go to Authentication, then Sign In / Providers, then Google. Switch it on, paste both values and save.

## 5. Switch on GitHub sign-in

1. On GitHub, go to Settings, then Developer settings, then OAuth Apps, then New OAuth App.
2. Homepage URL: `https://xplaind.in`. Authorization callback URL: `https://blgqdjtbzhrtiohepmvn.supabase.co/auth/v1/callback`.
3. Register it, then generate a client secret. Copy the Client ID and the secret.
4. In Supabase, go to Authentication, then Sign In / Providers, then GitHub. Switch it on, paste both values and save.

## 6. Email and password

The Email provider (Authentication, then Sign In / Providers, then Email) handles both passwords and sign-in links, and it is on by default.

"Confirm email" decides what happens after someone signs up with a password:

- On: they must open a confirmation email before they can use their account.
- Off: they are signed in straight away. This is quicker, but the email address is not checked.

The site works either way.

## 7. Check it works

Open the site and press "Sign up". Tick "I am 18 or older", then try each way in:

- Continue with Google
- Continue with GitHub
- Email and password
- An emailed link

Each one should land you on the dashboard with your test result and progress from that device. Then sign out and try Download the Roadmap or the mock interview: a "Sign up free" prompt should open.
