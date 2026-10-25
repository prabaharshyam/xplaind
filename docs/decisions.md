# Decisions and assumptions

Choices made while building that the PRD did not settle, or where the build forced a detail. Each one is easy to change. Review them and strike through any you disagree with.

## Slice S0 (scaffold)

- **Fonts are self-hosted** with the `geist` package instead of `next/font/google`, because the Google Fonts fetch fails when the build machine cannot reach Google. It also means visitors' browsers never call Google.
- **`@types/node` is 22**, to match Node 22 and satisfy Vitest's peer dependency.
- **Cache Components and Partial Prefetching stay on**, as `create-next-app` set them for Next 16.4. Content is read at build time, so pages are static.
- **CI** runs lint, typecheck, unit tests, content validation, build and the Playwright flow in Chromium at 360 px, plus a gitleaks secret scan. WebKit and Firefox come in slice S8 (QA-3).

## Slice S1 (content pipeline)

- **Schemas are strict.** A misspelled field in a YAML file (for example `affilate`) fails validation instead of being ignored.
- **Price cap is `PRICE_CAP_INR = 900`** (`src/lib/content/schema.ts`), my reading of "about 10 US dollars". Recheck against the current rate.
- **Stops carry the review fields** (`drafted_with_ai`, `reviewed_by`, `reviewed_on`). The PRD data model leaves them off `Stop`, but ED-9 says AI-drafted lessons need a human review, and a stop's MDX body is a lesson.
- **Check questions** (`questions/checks/`) have no schema in the PRD. I gave them the same shape as placement questions plus `stop_id`.
- **Human sign-off is checked by name.** `reviewed_by` and `verified_by` must name a person. Values such as "Claude", "UNREVIEWED" or "TBD" are rejected at launch (`isHumanName`, `src/lib/content/review.ts`).
- **Two modes.** `npm run content:validate` (development) lists missing coverage and missing human sign-off as a to-do list and passes. `npm run content:validate -- --launch`, or `CONTENT_LAUNCH=1`, turns them into errors. The production deploy should run in launch mode once content is ready. The PRD says the build fails if a level has fewer than 5 questions; launch mode is how that applies while content is still being written.
- **PL-4 (every gap tag maps to a stop)** is checked for each placement tag: some stop at the question's level or lower must list the tag. In development it is a to-do, at launch an error.
- **Unknown stop ids** return HTTP 200 on the first request, then 404. This is how Cache Components streams `notFound()`: the response has already started. The page carries `noindex`, so search engines skip it.

## Sample content is not verified

The six sample resources, three stops and six check questions exist to exercise the pipeline. They were written from memory. I could not open the providers' pages from the build environment, so none of them has been checked for price, access, hours or certificate. Each says so in `verified_by` / `reviewed_by`, and launch mode fails until a person replaces those with their name after opening the page. The hours and "certificate" values are guesses.
