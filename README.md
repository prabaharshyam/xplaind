# xplaind

Xplaind (xplaind.ai) is a free-first AI learning path for India. A short test places each learner on a nine-level ladder (B1 to P3) for a goal, starting with GenAI Engineer. The site then shows the next five steps, each with the best free or low-cost course, a check and a project. There are no ads and no paid placement.

The spec is [docs/PRD.md](docs/PRD.md). Requirement IDs such as PL-1 and RM-2 are used in commit messages and tests.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run check      # lint, typecheck, unit tests
npm run test:e2e   # Playwright (Chromium at 360px)
```

Copy `.env.example` to `.env.local` when a slice needs keys. Slices S0 to S4 need none.

## Layout

| Path | What it holds |
| --- | --- |
| `src/app` | Pages and routes (Next.js App Router) |
| `src/lib` | Pure logic with unit tests: dates, content schemas, placement scoring |
| `content` | Editorial content as YAML and MDX files, reviewed by pull request |
| `data` | Generated data such as link-check results |
| `e2e` | Playwright tests |
| `docs` | The PRD |
