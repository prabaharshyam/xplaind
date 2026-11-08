# xplaind

Xplaind (https://xplaind.in) is a free-first, plain-English AI learning platform for India: nine role roadmaps over one shared library of lessons, a placement test, videos, projects, interview practice and a few AI tools. No ads and no paid placement. The product focus is AI education (FOCUS-1 in the PRD).

**Taking over this project? Start with [docs/HANDOVER.md](docs/HANDOVER.md).** The spec is [docs/PRD.md](docs/PRD.md); requirement IDs such as PL-1 and RM-2 are used in commit messages and tests.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
npm run check        # lint, typecheck, unit tests, content validation
npm run build && CI=1 npm run test:e2e   # Playwright (Chromium at 360px); build first
npm run test:db      # row-level security tests, needs TEST_DATABASE_URL (Postgres 16)
```

Copy `.env.example` to `.env.local` when a feature needs keys. The site runs without any of them: accounts, AI tools and weekly emails stay off until their settings exist (see HANDOVER.md, section 4).

## Layout

| Path | What it holds |
| --- | --- |
| `src/app` | Pages and API routes (Next.js App Router) |
| `src/components` | Shared UI |
| `src/lib` | Logic with unit tests: content schemas and loader, placement, roadmaps, interview, AI guards |
| `content` | All editorial content as YAML and MDX, checked by `npm run content:validate` |
| `supabase` | SQL migrations and row-level security tests |
| `e2e` | Playwright tests |
| `scripts` | Content validation, trace check, video view counts |
| `docs` | HANDOVER, PRD, decisions, brand, product plan, set-up notes |
