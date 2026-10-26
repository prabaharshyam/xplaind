# Content review brief (2026-10-26)

The owner asked for a final check of every piece of content before they review it themselves. The goal is to find and fix mistakes, hallucinations and claims that cannot be verified.

## What to check, in every file assigned to you

1. **Factual accuracy.** Check definitions, how a technique works, and what a tool, library or API does. Watch for wrong function and parameter names, invented features, and wrong comparisons.
2. **Hallucination patterns.**
   - Invented statistics, percentages or survey results.
   - Made-up studies, papers, quotes or people.
   - Fake or wrong URLs.
   - Wrong release dates or version numbers.
   - Products, models or companies that do not exist or are misnamed.
   - Legal or regulatory claims, such as India's DPDP Act, the EU AI Act or RBI rules, that are not exact.
3. **Time-sensitive claims.** Prices, free tiers, certificate availability, model names, context sizes, salaries and market numbers. Verify these on the web with WebSearch or WebFetch against an official page. If you cannot verify a claim, either soften it to something true and durable (for example "often" in place of a made-up number) or flag it.
4. **Internal consistency.**
   - Each multiple-choice check has exactly one defensible right answer, and its explanation agrees with that answer.
   - Flashcards, exercises and answers agree with the lesson body.
   - Worked examples add up: the numbers, rupee amounts and arithmetic are right.
5. **Indian examples.** They must be plausible and must not state invented facts about real Indian companies or government schemes as if they were true. A clearly fictional example ("a Pune clinic") is fine.

## How to fix

- **Edit the files directly** for clear errors. Keep the house style: plain, direct English and short sentences. Change only what is wrong, and do not rewrite good text.
- **Keep the files valid.** After editing, run `npm run content:validate` from the repo root. It must still print `OK: no errors.` The content rules are in `src/lib/content/schema.ts`: word counts, flashcard counts, option counts and so on.
- **Do not touch** `reviewed_by`, `reviewed_on`, `drafted_with_ai`, `verified_by` or `last_verified`. A human still has to sign off (ED-9).
  - Exception: for a resource whose price, URL or free status you checked on the live official page, you may set `last_verified` to `2026-10-26` and fix the price, cost or URL.
  - Even then, keep the `verified_by` text starting with `UNVERIFIED:` and change it to `UNVERIFIED: checked by an AI reviewer on 2026-10-26; a person must confirm`.
- Only edit the files assigned to you. Do not edit code, tests, other content folders or docs, except your own report.
- Do not run `npm run build`, `npm run dev`, Playwright or `git`. Other agents are working in the same checkout.

## Your report

Write `docs/review/<your batch name>.md` with these sections:

- **Summary:** files checked, files changed, and how many items are flagged for a human.
- **Fixed:** a table with the columns file, what was wrong, what it says now, and source. Give a URL for anything checked on the web.
- **Flagged for the owner:** claims you could not verify or that need judgement, each with file, quote and why.
- **Checked and fine:** a one-line list of files with no issues.

Be honest. Do not write that something is verified unless you checked it. "I could not verify X" is a useful result.
