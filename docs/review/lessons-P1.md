# Review: lessons-P1 (2026-10-26)

## Summary

- **Files checked:** 28 lessons in `content/stops/P1/` and their 81 check questions in `content/questions/checks/`. `evals-test-sets` has a project check, so it has no MCQ files.
- **Files changed:** 8. There are 7 lessons and 1 check question. The lessons are ai-compliance, data-pipelines-ai, guardrails, ml-interviews, multi-agent-systems (3 edits) and regression-tests. The question is online-evals-feedback-1.
- **Flagged for the owner:** 6 items.
- `npm run content:validate` prints `OK: no errors.` after the edits.
- `reviewed_by`, `reviewed_on` and `drafted_with_ai` were not changed.

Every MCQ has exactly one defensible answer, and its explanation agrees with that answer. I checked the arithmetic in the worked examples and exercises. All of it is consistent:
- GPU sizing: 8B at 16-bit is 16 GB. The KV cache is 30 × 4,000 × 0.13 MB ≈ 15.6 GB, and 0.13 MB per token matches an 8B model with 32 layers, 8 KV heads and head size 128. A 7/70B model at 4-bit needs about 35 to 40 GB.
- LLM judges: 74 of 80 is 92.5%.
- Evals: one miss in 7 escalation cases is 14 points. Escalations caught in the table match the text.
- Security questionnaires: 170 + 40 + 30 = 240.
- ML interviews: the time blocks add up to 40 minutes, and there are nine design steps.

## Fixed

| File | What was wrong | What it says now | Source |
| --- | --- | --- | --- |
| stops/P1/ai-compliance.mdx (regimes table) | Listed "US-region hosting" as a typical HIPAA design impact. HIPAA has no data-location requirement, so this teaches a common myth. | "BAA, minimum necessary data, HIPAA-eligible services and agreed hosting region" | HHS guidance on cloud computing (no HIPAA localisation rule); reviewer knowledge, not fetched this session |
| stops/P1/data-pipelines-ai.mdx | Made-up statistic: hash-skipping cuts embedding costs "often by more than 90%" | "sharply so on document libraries that change slowly" | Unverifiable number, softened as the brief asks |
| stops/P1/guardrails.mdx (check table) | "Regular expression with checksum" for Aadhaar **or PAN**. Aadhaar has a public Verhoeff checksum; PAN has no public checksum algorithm. | "Regular expression, plus the Aadhaar checksum" | UIDAI Aadhaar number uses the Verhoeff check digit (reviewer knowledge) |
| stops/P1/ml-interviews.mdx (worked example) | A model answer stated UPI merchant fraud prevalence as "about 0.1% to 0.3%", an unsourced number presented as fact | "fraud is a small fraction of one percent; state the rate you assume" | Could not find a source for the figure; softened |
| stops/P1/multi-agent-systems.mdx (worked example + table) | Inconsistent. Version one "could not be given refund permissions", and the table said refunds went to "the specialist that needs them", but none of the four specialists (front desk, cards, loans, complaints) issues refunds. | Version one could not safely be given **card-block** permissions. The table row is now "Card-block permissions … Only the cards agent, after identity checks", which matches check question 1. | Internal consistency |
| stops/P1/multi-agent-systems.mdx | "the regulator-mandated reference number" for bank complaints. This is an unverified regulatory claim. | "gives the customer a complaint reference number" | Softened; not verified against RBI circulars |
| questions/checks/online-evals-feedback-1.yaml | The explanation cited "frequent refusals", but the stem does not mention refusals | "Answers that stay faithful but are \"not what I asked\" point to missing content, not to the model inventing things." | Internal consistency |
| stops/P1/regression-tests.mdx | A stray blank line split the "Common mistakes" list into two lists | One continuous list | Formatting |

## Flagged for the owner

1. **stops/P1/deployment-models.mdx, exercise (B):** "Models through the insurer's Google Cloud tenancy in the Mumbai region … keeps data in India". Which Vertex AI models are served from asia-south1, and with data residency, changes often. I did not verify it. The answer is sound in principle, but the owner may want to add "check which models the region offers".
2. **stops/P1/ai-risk-frameworks.mdx:** It lists the India AI Governance Guidelines' principles as "people first, fairness, accountability and transparency".
   - I confirmed MeitY released the Guidelines on 5 November 2025. I also confirmed they set seven sutras and use existing laws and sector regulators rather than a new AI law. Sources: https://www.iasgyan.in/daily-current-affairs/meity-released-india-ai-governance-guidelines-roadmap and https://ssrana.in/articles/meity-unveils-indias-approach-towards-regulating-artificial-intelligence/
   - Secondary sources list "Understandable by design" rather than "transparency". They also disagree with each other, and I did not read the official PDF. The wording is close and is only given as examples ("such as"), so I left it. Please check it against the MeitY PDF.
3. **stops/P1/ai-compliance.mdx:** I verified that the DPDP Rules were notified on 14 November 2025 with an 18-month phase-in. Source: PIB, https://static.pib.gov.in/WriteReadData/specificdocs/documents/2025/nov/doc20251117695301.pdf, and https://en.wikipedia.org/wiki/Digital_Personal_Data_Protection_Rules,_2025. AZB Partners cites gazette notifications dated 13 November, so a lawyer may prefer "November 2025". I did **not** web-check these claims against the Act's text, though they match my reading of the DPDP Act, 2023:
   - the ₹250 crore maximum for security-safeguard failures
   - breach reporting to the Board and the affected people
   - verifiable parental consent, and no tracking, behavioural monitoring or targeted advertising of children
4. **stops/P1/ai-risk-frameworks.mdx and agent-accountability.mdx:** The EU AI Act claims are general and accurate ("phased in over several years"; human oversight, record-keeping and obligations for high-risk systems; credit scoring and hiring are high-risk). I believe the EU has proposed delaying some high-risk deadlines (the "Digital Omnibus", late 2025). I did not verify its current status. The lessons give no specific deadlines, so nothing is wrong now, but avoid adding dates without checking.
5. **stops/P1/gpus-quantization.mdx (diagram and worked example):** On a 48 GB card, a 14B model with 35 GB of cache serves "about 40 to 50 active requests" at 6,000 tokens. That implies about 130 KB of KV cache per token. Common 14B models (for example Qwen2.5-14B: 48 layers, 8 KV heads, head size 128) need about 190 to 200 KB per token at 16-bit, which gives about 30 requests. The text hedges with "in this model's configuration", so it is defensible. Still, the owner may want to say "about 30 to 45" or mention an FP8 cache.
6. **stops/P1/evals-test-sets.mdx (results table):** "Policy number kept 58 of 60" suggests all 60 emails contain a policy number, but the check applies only "when the email had one". This is minor, and I left it.

All named Indian companies in the worked examples are clearly fictional ("a Pune clinic" style). I found no invented facts about real firms or schemes. The OWASP references match the 2025 LLM Top 10: prompt injection is LLM01 ("the top item"), excessive agency is LLM06 and unbounded consumption is LLM10.

## Checked and fine

agent-accountability, agent-budgets-kill-switches, agent-permissions-sandboxing, agent-sdks-subagents, ai-incident-response, ai-risk-frameworks (apart from flag 2), computer-use-agents, context-engineering, deployment-models (apart from flag 1), evals-test-sets (apart from flag 6), evaluating-agents, gpus-quantization (apart from flag 5), graph-rag, kubernetes-helm-basics, llm-gateways, llm-judges, monitoring-drift, multimodal-rag, online-evals-feedback (lesson body), permission-aware-rag, prompt-injection, security-questionnaires. All check questions are fine apart from online-evals-feedback-1, which is fixed above.
