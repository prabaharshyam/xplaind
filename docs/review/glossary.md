# Glossary review (2026-10-26)

Batch: glossary. Reviewer: AI agent (Claude). A person still has to sign off; no review fields were changed.

## Summary

- Files checked: 261 (all of `content/glossary/`).
- Files changed: 12.
- Items flagged for the owner: 4.
- All `related` ids resolve to existing terms, and every file's `id` matches its file name. I checked both with a script.
- `npm run content:validate` prints `OK: no errors.` after the edits. One run during the review failed with 1 error. A rerun passed with no change to my files, so the failure probably came from another batch editing at the same time.

## Fixed

| File | What was wrong | What it says now | Source |
|---|---|---|---|
| n8n.yaml | Called n8n "open-source". n8n is fair-code under its Sustainable Use License, which is not an OSI open-source licence. | "A source-available ("fair-code") workflow automation tool ..." | https://github.com/n8n-io/n8n (README: "fair-code distributed under the Sustainable Use License") |
| roc-auc.yaml | Said the score runs "from 0.5 (random) to 1". AUC can be anywhere from 0 to 1, so a score below 0.5 is possible. | "A score up to 1 (perfect) ... 0.5 means no better than random guessing." | Standard definition |
| precision-recall.yaml | Recall was "of the true positives, how many were flagged". True positives are by definition flagged, so the sentence did not make sense. | "Recall: of the actual positive cases, how many were flagged." | Standard definition |
| gdpr.yaml | Said GDPR "applies to anyone handling personal data of people in the EU". Article 3(2) is narrower. | "It also covers companies outside the EU, including Indian ones, that offer goods or services to people in the EU or monitor their behaviour." | GDPR Art. 3(2) |
| hipaa.yaml | Said HIPAA flatly "applies when Indian vendors handle US patients' data". Foreign vendors are usually bound by a business associate agreement, not directly. | "Indian vendors that handle US patients' data for US healthcare clients usually must follow its rules under a business associate agreement." | HIPAA business associate rules (45 CFR 164.502(e)) |
| misinformation.yaml | `also: disinformation` presented a different concept as a synonym. | Kept the alias and added: "Disinformation is the deliberate kind, spread to deceive." | Common usage |
| sub-agent.yaml | `also: multi-agent` is not another name for a sub-agent. | Removed the alias. Added `multi-agent-system` to `related`. | Internal consistency |
| reranking.yaml | `also: cross-encoder`. A cross-encoder is one kind of reranker and has its own entry. | Removed from `also` and added to `related`. | Internal consistency |
| ssh.yaml | `related: environment-variable` is not a related term. | `related: terminal` | Internal consistency |
| clustering.yaml | `also: k-means` (one algorithm), with no mention of it in the text. | Added "k-means is a common method." | Standard |
| data-versioning.yaml | `also: DVC` (a tool), with no mention of it in the text. | Added "DVC is a common tool for this." | Standard |
| async-await.yaml | `also: asyncio` (a library), with no mention of it in the text. | Added "Python's asyncio library runs this code." | Python docs |

## Flagged for the owner

1. **india-ai-governance-guidelines.yaml**: "Guidelines released by MeitY in November 2025 ... They create no new AI law and rely on existing laws". Several sources agree on the date (5 November 2025) and on the "use existing laws" approach, among them a copy of the PIB press release (PRID 2186639) at https://negd.gov.in/wp-content/uploads/2025/11/Press-Release_Press-Information-Bureau3.pdf. I did not open the guidelines PDF itself, so a person should confirm the wording "create no new AI law" against it.
2. **Aliases that are related terms rather than true synonyms.** The schema says `also` holds "other names and spellings people search for", and these help search, so I left them. They do show on the page as "(also: ...)", though:
   - agent-loop: "ReAct loop"
   - dimensionality-reduction: "PCA"
   - gradient-boosting: "XGBoost", "LightGBM"
   - dataframe: "pandas"
   - infrastructure-as-code: "Terraform"
   - keyword-search: "BM25"
   - encoding: "UTF-8"
   - deployment-environment: "staging", "production"
   - exception: "error handling"
   - golden-set: "test set"
   - p95-latency: "tail latency"
   - planning: "plan-and-execute"

   Please decide whether `also` should hold strict synonyms only.
3. **data-masking.yaml**: `also: pseudonymisation`, and the text says masked data "can be used without exposing people". Under GDPR, pseudonymised data is still personal data. Please decide whether to drop the alias or qualify the sentence.
4. **large-language-model.yaml**: "A model trained on huge amounts of text to predict the next token" and "It does not look facts up." Both simplify. Modern LLMs also go through instruction tuning and preference training after pre-training, and many can search when given tools. The text is acceptable for beginners, but the owner may want a qualifier.

## Checked and fine

acceptance-criteria, accountability, adoption, agent, agent-memory, agent-sdk, air-gapped, api, artificial-intelligence, attention, audit-log, automation, backpropagation, baseline, batch-api, batch-inference, batch-size, bias, budget-limit, caching, cdc, chain-of-thought, change-management, change-request, checkpoint, chunk-overlap, chunking, ci-cd, citation, classification-model, cnn, code-review, commit, computer-use-agent, concept-drift, confusion-matrix, connector, container, context-engineering, context-window, cosine-similarity, cost-per-request, cross-encoder, cross-validation, csv, data-exfiltration, data-fiduciary, data-leakage, data-processor, data-residency, database-index, decision-tree, deep-learning, deepfake, deployment-model, dictionary, discovery, docker-compose, docker-image, dockerfile, document-parsing, dpdp-act, drift, embedding, endpoint, environment-variable, epoch, escalation, etl, eu-ai-act, evals, experiment-tracking, faithfulness, fallback-model, feature, feature-engineering, few-shot-prompting, fine-tuning, fixture, function, generative-ai, git, git-branch, gpu, gradient-descent, graph-rag, grounding, guardrails, hallucination, handover, helm, http-method, http-status-code, human-in-the-loop, hybrid-search, hyde, iam, idempotency, incident-response, inference, iso-42001, json, json-schema, kill-switch, knowledge-graph, kpi, kubernetes, kv-cache, label, langgraph, latency, latency-budget, layout-analysis, least-privilege, llm-as-judge, llm-gateway, load-testing, logging, loop, loss-function, lost-in-the-middle, machine-learning, matrix, mcp, mcp-server, mean-median, merge-conflict, metadata-filter, model, model-registry, model-tiering, monitoring, multi-agent-system, multimodal-rag, neural-network, next-token-prediction, nist-ai-rmf, oauth, observability, ocr, oidc, online-evaluation, open-weight-model, overfitting, parent-child-chunking, permission-aware-rag, pii, pilot, pip, pod, probability-distribution, process-map, prompt, prompt-engineering, prompt-injection, prompt-registry, proof-of-concept, pull-request, pydantic, pytest, python, python-list, quantization, query-rewriting, rag, random-forest, rate-limit, rbac, react, reasoning-model, recall-at-k, reciprocal-rank-fusion, reflection, region, regression-model, regression-test, regularization, responsible-ai, rest-api, retrieval, retry-with-backoff, risk-log, roi, rpa, runbook, saml, sampling, sandbox, scope-creep, scope-of-work, secrets-management, security-questionnaire, self-hosting, semantic-search, soc-2, span, sql-join, sso, stage-gate, star-method, streaming, structured-output, supervised-learning, system-prompt, tco, temperature, tensor, terminal, token, tokenizer, tool-calling, tool-schema, tracing, training, trajectory, transfer-learning, transformer, trigger, type-hint, unit-test, unsupervised-learning, uvicorn, variable, vector, vector-database, vectorless-retrieval, virtual-environment, vision-language-model, vllm, webhook, weights, window-function, workflow, workflow-node. The files listed under Flagged (data-masking, large-language-model, india-ai-governance-guidelines and the alias list) are not repeated here.
