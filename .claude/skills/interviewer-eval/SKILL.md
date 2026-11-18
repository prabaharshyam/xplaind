---
name: interviewer-eval
description: >
  Run and extend the red-team test set for Xplaind's AI voice interviewer (Zarina): English only, stays on
  the interview, never gives the answer, reveals her instructions or changes role. Use when changing any
  interviewer prompt or turn logic (src/lib/ai/voice-interview.ts, src/app/api/ai/voice/*), before a
  release that touches the interviewer, and whenever the owner reports Zarina saying something she
  should not (another language, small talk, a prompt injection that worked, leaking the answer).
---

# Interviewer eval (VI-15)

The interviewer is checked in three layers. Run all that apply.

1. **Unit tests** (free, in `npm run check`): `src/lib/ai/voice-interview.test.ts`, the
   "the interview stays in English and on the question (VI-15)" block. They cover the script check
   (`mostlyNotEnglish`, `languageRedirect`), the redirect limit (`MAX_REDIRECTS`) and `cleanTurn`.
2. **Browser tests** (free): `e2e/voice-interview.spec.ts`, the VI-15 test. Routes are mocked; it
   checks the page treats a redirect as not a follow-up and sends the flag back.
3. **Red-team set against the real model** (costs money, needs `ANTHROPIC_API_KEY`):

   ```bash
   npm run eval:interviewer
   ```

   One case: `npm run eval:interviewer -- --case tanglish`. Another model: `-- --model claude-sonnet-5-5`.
   It runs the same prompt, model and checks as `/api/ai/voice/turn` and prints PASS or FAIL per case,
   with the line Zarina would say. About 30 fast-model calls a run (under ₹5). Exit code 1 on any
   failure. It is not in CI: answers vary a little from run to run, so run it twice before trusting a
   single failure, and never weaken a case to make it pass.

## When the owner reports a new bad behaviour

1. Add a case to `scripts/evals/interviewer-cases.json` that reproduces it: `reply` (or `earlier`
   exchanges), `expect` (`language`, `topic`, `clarify`, `follow_up` or `move_on`) and `mustNot`
   patterns for what she must never say (`(?i)` at the start makes a pattern case-insensitive).
2. Run that case and see it fail.
3. Fix the rule: `INTERVIEW_RULES` or the turn prompt in `src/lib/ai/voice-interview.ts`, or the
   pre-check in `languageRedirect` when no model call is needed. Keep the report prompt in step.
4. Run the whole set (not just the new case), then `npm run check`.
5. Note the case and the fix in `docs/decisions.md`.

## Rules the set protects

- The interview is in English only. A reply mostly in another language, also romanised (Tanglish,
  Hinglish), is brought back to English; she never offers another language. A few Indian words inside
  an English answer are normal and get a normal follow-up.
- Off-topic talk, personal questions, asking for the answer or a score, asking for her instructions,
  role changes, instructions from the candidate and rude words are brought back to the question.
- Asking her to explain or repeat the question is help, not off topic (VI-14).
- At most 2 redirects per question, then she moves on. Redirects are not follow-ups.
- In the report, an answer mostly in another script is not scored, and each question shows how often
  the candidate was off track.
