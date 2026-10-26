# Review: interview-m-z (2026-10-26)

## Summary

- Files checked: 79 (every file in `content/questions/interview/` from `manage-secrets.yaml` to `write-scope-of-work.yaml`).
- Files changed: 3.
- Items flagged for the owner: 4.
- `npm run content:validate` prints `OK: no errors.` after the edits. Every short_answer in the batch is still 60 words or fewer.

## Fixed

| File | What was wrong | What it says now | Source |
|---|---|---|---|
| `measure-automation-roi.yaml` (deeper_answer) | The arithmetic did not add up. 1,200 invoices at 6 minutes is 120 hours. If 80% are automated and each automated invoice takes 1 minute to check, the remaining work is 24 h + 16 h = 40 h, so 80 hours are saved, not "about 77". The rupee figure (₹38,500) was wrong for the same reason. | "...one minute checking each automated invoice, the work drops to 40 hours (24 hours for the remaining 240 invoices plus 16 hours of checks), so you save 80 hours a month. At ₹500 an hour that is ₹40,000 a month..." | Arithmetic |
| `map-json-fields.yaml` (example) | The example said "Set node" but the deeper_answer said "Edit Fields node". In current n8n the Set node is called "Edit Fields (Set)". | "an Edit Fields (Set) node" | n8n node naming |
| `spot-a-deepfake.yaml` (deeper_answer) | Out of date. It said India "has proposed rules requiring labelling of AI-generated content". MeitY notified the IT (Intermediary Guidelines and Digital Media Ethics Code) Amendment Rules, 2026 on 10 Feb 2026, in force from 20 Feb 2026. They require prominent labels and metadata on synthetically generated content. | "India amended its IT Rules in February 2026 to require prominent labels on AI-generated content shared through online platforms, but labels will never catch everything." | https://www.hoganlovells.com/en/publications/india-introduces-mandatory-labelling-for-ai-and-3hour-takedown-for-illegal-content ; https://www.businesstoday.in/amp/technology/story/govt-tightens-rules-on-ai-generated-content-mandates-labels-and-faster-takedowns-515505-2026-02-10 (a further draft from April 2026 on continuous labels is still a proposal, so the text does not describe it) |

## Flagged for the owner

1. **`whatsapp-bot-handoff.yaml`**, short_answer: "Use the WhatsApp Business Platform through an approved provider". Businesses can also use Meta's Cloud API directly, without a Business Solution Provider. The sentence is not wrong as a recommendation, but it could be read as "a provider is required". I left it alone to keep the short answer within the word limit.
2. **`n8n-vs-zapier.yaml`**, short_answer: "Make handles complex visual flows at lower cost". This is a general comparison and is broadly accepted. I did not check current pricing pages, and the deeper answer already tells readers to check prices at the time.
3. **`prompt-rag-finetune.yaml`**, example: "classify complaints into 40 categories the regulator required". No regulator is named, so this is an illustrative story. A reader could still take it as a real RBI requirement. Consider "40 internal categories" if that is a concern.
4. **`query-rewriting-hyde.yaml`**, example: "26 weeks of paid maternity leave". This matches the Maternity Benefit Act as amended in 2017, but I checked it from memory, not on the web. It is shown as a hypothetical HyDE draft, so the risk is low.

Checked on the web and correct as written: `when-multi-agent.yaml`. Its claim that Anthropic's multi-agent research system beat a single agent while using many times more tokens matches https://www.anthropic.com/engineering/multi-agent-research-system (90.2% better on an internal eval, about 15 times the tokens of chat).

## Checked and fine

manage-secrets, metadata-filtering, missing-values, ml-project-end-to-end, model-drift-monitoring, model-size-choice, monitor-llm-app, multimodal-rag-question, n8n-vs-zapier (see flag), on-prem-deployment, overfitting, parse-messy-pdfs, pass-security-review, permission-aware-retrieval, pick-ai-use-case, planning-and-reflection, pm-evals-with-engineers, poc-to-production-gates, precision-recall (80/100 = 80% precision, 80/200 = 40% recall), prevent-overfitting-neural-net, prevent-regressions, price-ai-feature, production-incident-story, prompt-caching-explained, prompt-injection-defence (OWASP LLM01), prompt-rag-finetune (see flag), protect-user-data, quantization-tradeoffs (memory maths checked), query-rewriting-hyde (see flag), rag-outdated-policy, rag-project-story (counts consistent), reduce-latency (1 + 1.5 + 6 is about 9 s), regularisation-l1-l2, responsible-ai-launch (NIST AI RMF functions correct), retrieval-without-vectors, rpa-vs-api, run-discovery, scope-automation-project, serve-llm-streaming-api, sso-for-enterprise-copilot, staff-fear-automation, supervised-vs-unsupervised, tell-me-about-project, temperature, three-month-ai-plan, tokens-explained, train-test-split, training-vs-inference, transfer-learning, trigger-action-workflow, used-ai-at-work, vanishing-gradients (0.5^20 and 2^20 checked), version-rollback-models, webhook-vs-polling, what-is-an-llm, what-is-mcp (Anthropic, 2024; stdio and HTTP transports), what-is-rag, what-not-to-share-with-ai, what-to-automate-first, what-to-trace, whatsapp-bot-handoff (see flag), when-finetune, when-graph-rag, when-human-in-the-loop, when-multi-agent, why-ai-non-technical, why-convolutions (224 x 224 x 3 is about 150,000), why-docker, why-fde-role, why-hallucinate, why-llm-gateway, why-vllm, will-ai-take-jobs (matches the ILO 2023 generative AI study's finding, from memory), workflow-fails-midway, write-a-good-prompt, write-scope-of-work. Also measure-automation-roi's example (600 x 4 min = 40 h, ₹16,000 − ₹2,500 = ₹13,500, ₹60,000 / ₹13,500 is about 4.4 months) is correct.
