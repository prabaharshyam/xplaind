# Review: interview-a-l (2026-10-26)

Scope: the 91 files in `content/questions/interview/` whose names start with a to l.

## Summary

- Files checked: 91. I read every field, including the examples.
- Files changed: 5.
- Items flagged for a human: 4.
- `npm run content:validate` prints `OK: no errors.` after the edits.
- I did not change `id`, `kind`, `stop_id`, `level`, `topic`, or the review fields. All short answers are still 60 words or fewer.

## Fixed

| File | What was wrong | What it says now | Source |
|---|---|---|---|
| dpdp-act-basics.yaml (deeper_answer) | It said "notified in November 2025 with an 18-month phase-in". That is right as notified, but it was not exact. Some parts started at once and Consent Manager registration starts at 12 months. MeitY has also consulted on shortening the 18-month window to 12 months. | "Its Rules were notified on 13 November 2025, with most duties phased in over 18 months (MeitY has consulted on shortening this, so check the current dates)…" The ₹250 crore maximum penalty is kept, because it is correct. | https://www.deccanherald.com/india/centre-notifies-dpdp-rules-implementation-planned-in-phases-spread-over-12-18-months-3798465 ; https://ssrana.in/articles/meity-plans-to-cut-short-dpdp-compliance-timeline-and-notify-cross-border-restrictions-for-sdfs/ ; https://www.storyboard18.com/digital/meity-seeks-industry-views-on-fast-tracking-dpdp-act-rollout-proposes-12-month-compliance-timeline-88332.htm |
| ai-images-campaign-check.yaml (deeper_answer) | It said "India's IT rules now require labels on synthetic media." This was vague about what the law is and who carries the duty. | "India's IT rules, amended in February 2026, require platforms to label synthetically generated content." These are the IT (Intermediary Guidelines and Digital Media Ethics Code) Amendment Rules, 2026: notified 10 Feb 2026, in force from 20 Feb 2026. | https://www.hoganlovells.com/en/publications/india-introduces-mandatory-labelling-for-ai-and-3hour-takedown-for-illegal-content ; https://www.businesstoday.in/technology/story/govt-tightens-rules-on-ai-generated-content-mandates-labels-and-faster-takedowns-515505-2026-02-10 |
| backpropagation-explained.yaml (deeper_answer) | It said the cost of backpropagation is "about the same as one forward pass". The backward pass usually costs about 2 to 3 times the forward pass. The real point is that it is a small constant multiple, not one pass per weight. | "…so getting every gradient costs only a small multiple of one forward pass, not one pass per weight" | Standard reverse-mode autodiff result (no web check needed) |
| invoice-amount-validation.yaml (example) | "the total must equal both" was unclear and did not match the arithmetic in the short answer. | "the total must equal the subtotal plus GST." | Internal consistency with short_answer |
| ab-test-significance.yaml (short_answer) | "the interval excludes no difference" reads like a double negative and could be misread. | "the interval excludes zero" (same word count) | Clarity; the meaning is unchanged |

## Flagged for the owner

1. **dpdp-act-basics.yaml.** The DPDP compliance timeline may change. MeitY consulted in Jan–Feb 2026 on cutting the main 18-month window to 12 months, which would move the deadline from 13 May 2027 to about 13 November 2026. I found no official notice that this amendment was made. The sources I found are law-firm and vendor blogs, not the Gazette. Please check MeitY's site or the Gazette before publishing. The file now tells readers to check the current dates.
2. **email-agent-injection-fix.yaml.** The deeper answer says to "treat any data leak as an incident with notification duties under the law." This is true in general: CERT-In's 2022 directions require reporting cyber incidents within 6 hours. But the breach-notification duties under the DPDP Rules only start with the main phase-in. I left the wording because it is not wrong, but a person may want to name the specific duty.
3. **ai-images-campaign-check.yaml.** In April 2026 MeitY released a further draft that would require labels to stay visible for the whole duration of synthetic content. I could not confirm whether it was notified. The file does not mention it.
4. **evaluate-agent-trajectory.yaml.** It cites "Anthropic's guide on evals for agents and DeepLearning.AI's course on evaluating agents". I believe both exist, but I did not check them on the web in this pass. Please confirm the titles if you want them linked.

## Checked and fine

agent-accountability-question, agent-failure-modes, agent-memory-types, agent-project-story, agent-runaway-cost, agent-sandboxing, agent-vs-workflow, ai-bias-example, ai-build-vs-buy, ai-confidential-meeting-notes, ai-data-strategy-question, ai-difficult-customer-email, ai-feature-failed, ai-feature-satisfaction-drop, ai-feature-success-metrics, ai-for-research-tips, ai-incident-handling, ai-invoice-extraction, ai-limits-example, ai-ml-genai-difference, ai-pm-decision-story, ai-pm-vs-pm, ai-report-wrong-figure, api-rate-limit-429, attention-high-level, automation-duplicate-orders, automation-personal-data, automation-time-saved-story, batch-vs-online-serving, bias-variance-tradeoff, biased-applicant-ranking, boosting-vs-random-forest, check-ai-answer, choose-chunk-size, choose-k-means, ci-for-prompts, company-ai-policy-basics, computer-use-agent-risks, connect-enterprise-data, context-engineering-explained, context-window, control-llm-cost, data-leakage, debug-agent, debug-rag, demo-went-wrong, design-agent-tools, design-contract-rag, design-for-wrong-answers, design-recommendation-system, design-refund-agent, design-support-bot, disagree-on-ai-use, drive-ai-adoption, email-agent-injection-fix (see flag 2), email-triage-design, evaluate-agent-trajectory (see flag 4), evaluate-llm-app, evaluate-rag, executive-update, experiment-tracking-why, explain-embeddings, explain-to-manager, fake-boss-voice-call, feature-engineering-example, first-ai-use-case-team, golden-test-set, good-offline-bad-online, grounding-and-citations, handle-scope-creep, handover-to-client, how-tool-calling-works, human-approval, hybrid-search-reranking, imbalanced-classes, incremental-indexing, keep-up-with-ai, kubernetes-basics-question, langgraph-state-checkpoints, latency-budget-load-test, legacy-app-no-api, linear-vs-logistic, llm-as-judge, llm-bill-doubled, llm-provider-outage, long-context-vs-rag.

Notes on the arithmetic and plausibility checks I did:

- automation-time-saved-story: 6 min × 300 enquiries = 30 hours a month. Correct.
- latency-budget-load-test: 300 ms + under 1 s fits inside the 1.5 s first-token budget.
- llm-bill-doubled: ₹1.6 lakh to ₹3.4 lakh fits with top-k going from 5 to 15 plus lost prompt caching.
- ab-test-significance: about 40,000 users per group is plausible for detecting a 1-point lift at a baseline of about 20–30%.
- ai-invoice-extraction: a GSTIN is 15 characters. Correct.
- fake-boss-voice-call: the 1930 helpline and the national cybercrime portal are correct.
- From memory, not checked on the web: the named references (Anthropic's "Building effective agents" workflow patterns, OWASP "excessive agency", Hamel Husain's three eval levels, Ragas metric names, ADKAR, Diátaxis, Google PAIR and Microsoft HAI guidelines, Anthropic contextual retrieval, LangGraph checkpointer and store).
- Examples use fictional or unnamed organisations. None states invented facts about a named real company or government body.
