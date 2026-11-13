# Xplaind

Free-first AI learning path for India. Read docs/PRD.md before changing anything. Requirement IDs (PL-1, RM-2 and so on) are the spec.

New to this repo, or taking over from another account? Read docs/HANDOVER.md first: it covers the product, the owner, the services, the content system, the workflow and what is pending.

## Stack
Next.js App Router, TypeScript strict, Tailwind, Supabase (Postgres, auth with Google, GitHub, email and password or an email link, row-level security), Zod, Vitest, Playwright, GitHub Actions.

## Rules
- Editorial content is files under content/, validated by Zod with `npm run content:validate`. Never store editorial content in the database.
- User tables follow the SQL in the PRD data model. Every table has row-level security and a test for it.
- Placement scoring and next-five-steps are pure functions with unit tests and no database or UI imports.
- Code that ranks or orders resources must never read affiliate or commission fields (ED-2). Keep the test.
- Release 1 makes no language-model calls at run time.
- Never show a price without its check date (RM-6).
- No ads, no sponsored placement, no tracking scripts beyond the analytics chosen in the PRD.
- Under-18 learners get no account and nothing stored on the server (PV-2).
- Mobile first at 360 px wide. WCAG 2.1 AA on test, result, roadmap and stop pages.
- Weeks and dates use Asia/Kolkata.
- Commit messages start with the requirement ID.
- Before finishing a slice run lint, typecheck, tests and content:validate.
- If the PRD is ambiguous or two requirements conflict, stop and ask. Do not guess.

## Next.js version note
This repo uses Next.js 16 with Cache Components on. Its APIs differ from older versions, so read the matching guide in `node_modules/next/dist/docs/` before writing framework code. See @AGENTS.md.

## Commands
- `npm run dev` runs the site. `npm run check` runs lint, typecheck and unit tests. `npm run test:e2e` runs the Playwright flow (set `PW_CHROMIUM_PATH` if a browser is pre-installed).
- Fonts are self-hosted with the `geist` package, because `next/font/google` needs network access at build time.

<!-- web-skills:start -->
## Frontend, 3D & motion skills (in this repo's .claude/skills)

When building or changing UI in this project, use these skills:

- **Visual direction:** `design-taste-frontend` (Taste v2) for the premium, agency-grade look; `ui-ux-pro-max` to pick palette, type and style; `frontend-design` as the baseline. Use at most two taste skills at once — if they disagree, `design-taste-frontend` wins. `impeccable` for audit/polish passes; `unslop` to find and remove AI-looking tells (glows, gradient text, emoji labels, uneven spacing) screen by screen.
- **3D:** `threejs-*` skills (vanilla Three.js), `r3f-best-practices` / `r3f-fundamentals` (React Three Fiber), `webgpu-threejs-tsl` for WebGPU/TSL, `web-shaders` for GLSL/WGSL.
- **Motion & scroll:** `gsap-*` skills (timelines, ScrollTrigger, useGSAP); Lenis as the ONLY smooth-scroll engine; `emil-design-eng` for micro-interactions, `review-animations` to audit them; `vercel-react-view-transitions` for page transitions.
- **Award-style pages:** `build-awwwards-quality-sites` for heroes and scroll storytelling; `scroll-cinematic` for Apple-style frame-sequence scroll.
- **Components:** `shadcn` / `shadcn-ui` for UI primitives.
- **Before shipping:** run `web-design-guidelines` and `vercel-react-best-practices`; respect `prefers-reduced-motion`; lazy-load 3D so Core Web Vitals stay green.
<!-- web-skills:end -->
