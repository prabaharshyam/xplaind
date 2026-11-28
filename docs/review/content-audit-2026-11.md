# Content audit, November 2026 (CQ-1)

27 to 28 Nov 2026. Owner: "act as a top 1% AI educational content writer, audit the entire platform content and improve it; the reader should feel it is very useful, informative, world class. Then make sure the translations match the English."

Ten read-only reviewers scored every lesson (with its three check questions) against one rubric, and read every interview question, pattern, design, project, blog post, glossary term, placement question, roadmap, book and certification, plus a spread of 130 resources. Raw findings with exact quotes and suggested fixes were kept outside the repo during the work; this file is the summary.

## Lessons (231)

| Dimension | Average (1 to 5) |
|---|---|
| accuracy | 3.92 |
| depth | 3.50 |
| example | 3.89 |
| clarity | 4.26 |
| practical | 4.04 |
| assessment | 2.58 |
| no filler | 3.62 |
| **overall** | **3.68** |

Factual or code errors: 87 in 64 lessons. Lessons below 3.5: 50.

By level: B1 3.58, B2 3.79, B3 3.68, I1 3.72, I2 3.75, I3 3.69, P1 3.74, P2 3.52, P3 3.42.

### What holds lessons back

1. **Check questions (assessment 2.58, the weakest everywhere).** Most test recall of the lesson's own wording, the right answer is usually the longest option and often b, and wrong options are jokes ("Nothing", "The colour of the user interface"), so a learner passes by elimination. The exercises are often good scenarios that never reach the scored checks.
2. **Worked examples, code and numbers that contradict the text.** Code that does not run or does not do what the text says, arithmetic that does not add up, a cache example that could show one patient's answer to another, results presented as measured that are invented.
3. **Repetition and filler.** Duplicate bullets in Common mistakes (often split by a stray blank line), tables that restate the paragraph, near-duplicate lessons (company-ai-policy and use-ai-safely; tracing-llm-apps and agent-logs).
4. **Depth missing for 2026 and for India.** Reasoning-token cost, mixture-of-experts serving, semantic caching; DPDP duties, CERT-In reporting, GST (still the old slabs in places), Indian-language handling.
5. **Stale or unsourced facts.** Old GST slabs, ₹84 to the dollar, n8n called open source and a Google Forms trigger it does not have, Helm 4 and MLflow 3 changes, unlabelled AI-tool claims.

### Lowest-scoring lessons

| Lesson | Level | Overall | Errors | Main fix |
|---|---|---|---|---|
| latency-load-testing | P2 | 3.0 | 0 | Fix the internal number contradictions (1.5 s vs 2 s budget, 1 s vs 1.3 s result) and the ambiguous check question 2, then add open-workload testing so the method matches results-day traffic. |
| executive-communication | P3 | 3.0 | 1 | Fix the model memo's business case (₹9 lakh a month cost against ₹50 lakh a year value), because the lesson currently presents a loss-making recommendation as the example to copy. |
| ai-careers-india | B1 | 3.1 | 0 | Add a worked job-description breakdown and dated salary bands per role, and rewrite the three checks as role-classification scenarios with realistic distractors. |
| history-of-ai | B1 | 3.1 | 0 | Fix the 2017 era contradiction and extend the story past 2022 to the reasoning and agent tools learners use today. |
| images-voice-tools | B1 | 3.1 | 0 | Update the tool capability claims to November 2026 (text, hands and video) and add a dated tools box plus India's 2026 AI-content labelling rule. |
| rpa-basics | B3 | 3.1 | 0 | Rewrite the three check questions as realistic design scenarios and add the missing idempotency and exception-handling section that the key terms promise. |
| cloud-fundamentals | I1 | 3.1 | 0 | Make it actually one cloud end to end (Azure, matching the worked example), with the cross-region inference residency warning, instead of mixing commands from three providers. |
| mcp-servers-clients | I3 | 3.1 | 0 | Replace the asserted SSO claim in the worked example with real code that maps the signed-in user's OAuth identity to a permission-filtered query, and remove the duplicated sections. |
| model-merging | P2 | 3.1 | 1 | Fix the worked example's motive (merging LoRA adapters does not save meaningful memory) and make multi-adapter serving the first alternative, so readers learn when merging is really worth it. |
| security-privacy | P2 | 3.1 | 0 | Replace the three trivial check questions with scenario questions and add a real section on indirect prompt injection, the risk the lesson's answer promises to cover. |
| statistics-for-ml | B3 | 3.2 | 1 | Correct the confidence-interval definition and replace the "do the intervals overlap" rule with a paired bootstrap of the difference between two models on the same test set. |
| ai-and-jobs | B1 | 3.3 | 0 | Fix the Meena exercise arithmetic and ambiguous key, and replace the three recall checks with scenario questions that make the learner apply task analysis to a new job. |
| n8n-automation | B2 | 3.3 | 2 | Fix the non-existent Google Forms trigger and the outdated 'activate' wording, and refocus the lesson on safe AI Agent design (tool limits, prompt injection, structured output) instead of repeating first-n8n-workflow. |
| writing-ai-policy | B3 | 3.3 | 0 | Add the external legal duties (CERT-In 6-hour reporting and DPDP breach notification) and a vendor approval checklist, so the policy a learner writes is actually defensible in a client security review. |
| ai-pm-interviews | I1 | 3.3 | 0 | Teach cost-per-request and a concrete launch bar inside the worked answer, and rewrite the three giveaway checks as metric and trade-off judgement items. |
| cicd-github-actions | I1 | 3.3 | 1 | Make the "complete workflow" actually match the lesson (staging, smoke test, approval, timeouts, SHA-pinned actions) and fix the impossible eval scores, so the code learners copy is the pipeline the lesson describes. |
| ml-feature-engineering | I1 | 3.3 | 0 | Replace the three trivial check questions with scenario items whose distractors are plausible, including one on preprocessing fitted before the split. |
| long-context-vs-rag | I2 | 3.3 | 0 | Add agentic search as a third option and deepen the accuracy section with what context-rot research shows, replacing the single planted-fact test with multi-fact and distractor tests. |
| transformers-explained | I2 | 3.3 | 2 | Fix the attention table to respect the causal mask and update position encoding to rotary embeddings, then add a short section on current variations (KV cache, GQA, MoE) so learners can read a 2026 model card. |
| ml-interviews | P1 | 3.3 | 0 | Turn the syllabus into teaching: add short model answers for the top fundamentals questions and a GenAI system design section, since that is what 2026 interview loops test. |
| batching-model-tiering | P2 | 3.3 | 0 | Show the worked example's cost arithmetic lever by lever, so readers learn to predict savings rather than accept a ₹14 lakh to ₹5 lakh headline. |
| cost-control | P2 | 3.3 | 0 | Add reasoning-token cost and show the worked example's arithmetic line by line, so the reader can reproduce the ₹6 lakh to ₹2.7 lakh drop. |
| running-models-on-many-gpus | P2 | 3.3 | 1 | Correct the pipeline-parallelism explanation (it does not add stage delay; it just does not reduce latency) and add expert parallelism for mixture-of-experts models, which is how many 2026 open models are served. |
| design-interview | P3 | 3.3 | 0 | Put real back-of-envelope numbers into the electricity-board model answer, because the lesson tells candidates to use numbers and then shows a strong answer with none. |
| fde-case-study | P3 | 3.3 | 1 | Fix the cost-versus-value contradiction and make the Chennai lender's timeline and numbers identical across all P3 lessons, since this capstone is the model learners will copy. |
| fde-interview-loop | P3 | 3.3 | 0 | Ground the lesson in sourced, real FDE interview loops and add a scripted role-play dialogue, since the current content is generic and the example only lists what Arjun practised. |
| kpi-that-matters | P3 | 3.3 | 0 | Make the KPI numbers consistent (41 to 22 in ten weeks) and measure the baseline on the pilot group itself, so the lesson about precise KPIs practises what it teaches. |
| prompt-rag-or-finetune | P3 | 3.3 | 0 | Add long context with caching as a fourth option and put real break-even numbers into the fine-tuning case, so the lesson reflects 2026 choices and shows the trade-off it claims to teach. |
| ai-for-research | B1 | 3.4 | 0 | Make the worked example concrete with the real prompts, the wrong figure and the sourced correct figure, and replace the common-sense checks with scenarios where a citation does not support the claim. |
| bias-fairness | B1 | 3.4 | 0 | Add a practical 'how to test by group in India' section covering the missing-group-data problem and a simple gap threshold, with the loan exercise worked through numerically. |
| use-an-assistant | B1 | 3.4 | 0 | Replace the sections duplicated from other B1 lessons with a dated 'getting set up' guide and a sample project write-up with pass criteria. |
| automation-tools-compared | B2 | 3.4 | 1 | Correct the 'open source' claim for n8n and add one fully worked, dated cost comparison so learners can actually do the costing the lesson asks for. |
| build-vs-buy | B3 | 3.4 | 0 | Add a real (illustrative) two-year TCO table to the worked example and correct the differentiation reasoning, so the lesson actually teaches how to make the build-or-buy call with numbers. |
| web-apis-json | B3 | 3.4 | 2 | Fix the two wrong error claims (TypeError not KeyError; KeyError not 401 when the env var is missing) and make the retry loop catch timeouts and check the final status. |
| writing-tests | B3 | 3.4 | 2 | Fix the floating-point story and money handling (Decimal or pytest.approx from the start) and update the GST slabs, since the lesson's central example currently teaches both a wrong float claim and stale tax rates. |
| chat-assistants-whatsapp | I1 | 3.4 | 0 | Move emergency detection into code that runs before anything else and works in Tamil and Hinglish, because the current keyword list would let a chest-pain message reach the FAQ bot. |
| pricing-ai-features | I1 | 3.4 | 0 | Add a step-by-step calculation of cost per request from tokens and a dated model price, and make the checks require computing a margin. |
| experiment-tracking | I2 | 3.4 | 2 | Rewrite promote_if_better to score champion and candidate on the same fresh holdout, matching the metric and threshold described in the worked example. |
| langgraph-basics | I3 | 3.4 | 1 | Rebuild the code around the single Chennai broadband credit example so the state, flow diagram, interrupt and resume all match, and update the prebuilt-agent API to the current LangGraph 1.x one. |
| agent-budgets-kill-switches | P1 | 3.4 | 1 | Fix the budget code so the check and the reservation are one atomic statement, since the lesson claims race-safety the code does not provide. |
| ai-risk-frameworks | P1 | 3.4 | 0 | Add a dated EU AI Act timeline and a provider-versus-deployer breakdown for the resume-screening example, since those decide what the company must actually deliver. |
| llm-gateways | P1 | 3.4 | 0 | Remove the duplicated mistakes and add the missing rate-limit and fallback-edge-case material, since the outcome promises rate limits and fallbacks are where gateways fail in production. |
| security-questionnaires | P1 | 3.4 | 0 | Replace the duplicated AI and library sections with a sourced table of the Indian regulatory questions banks ask vendors and the evidence to prepare for each. |
| ai-cost-of-ownership | P2 | 3.4 | 2 | Recompute the crossover from the lesson's own numbers (adding a GPU utilisation input) and fix the 'checked' price block, because the recommendation and its review trigger currently rest on figures that do not add up. |
| caching-and-speed | P2 | 3.4 | 0 | Rewrite the three check questions as debugging and design scenarios (why is cache read zero, which answer is safe to share) instead of recall of the lesson's own sentences. |
| vllm-open-weights | P2 | 3.4 | 1 | Update the pinned vLLM version and example model to current releases, and add the GPU choice and cost comparison the outcome promises. |
| ai-system-design | P3 | 3.4 | 0 | Run the lesson's own estimate() in the worked example and show cost per user and the rate-limit result, since the project check requires cost per user and the example never computes it. |
| portfolio-job-search | P3 | 3.4 | 0 | Add the India-specific job search content the outcome promises (platforms, notice periods, salary research, remote roles) and label the worked example's results as illustrative with realistic expectations. |
| quality-cost-speed | P3 | 3.4 | 0 | Add a short section on whether a quality difference is real for the test-set size used, since the worked example's 86% vs 88% vs 89% choice on 150 questions is within noise. |
| scope-of-work | P3 | 3.4 | 0 | Add the commercial and legal sections an AI SOW needs (pricing, IP, data protection, model-cost ownership, liability), since a scope of work without them is the part clients will push back on first. |

## Other content

| Kind | Items | Average |
|---|---|---|
| blog | 7 | 3.66 |
| design | 10 | 3.99 |
| interview-pattern | 28 | 3.66 |
| project | 26 | 3.92 |
| interview-question | 500 | 4.36 |

Problems found in glossary, placement, roadmaps, levels, jobs, certifications, books and resources (error / weak / minor): book 0/2/5; certification 0/1/4; glossary 2/4/20; goal 0/9/5; job 0/0/4; level 0/0/3; placement 1/6/5; resource 0/4/9.

Notable: interview questions are the strongest content (4.36). A blog post says speech-to-text happens in the browser, which is false for the AI voice interviewer (privacy wording). In the placement test the right answer is the longest option in 44 of 54 questions. 342 of 904 resources carry a template blurb and 759 share the same editor score. The ML Engineer roadmap has almost no engineering (no Git, SQL, Docker, ranking or forecasting lessons); most roadmaps have no portfolio or interview stage.

## Translations

No drift: since the translations were made, the English lessons only gained the interview explanation, which LS-4 translated. 25 lessons (the AI Security path and the two harness lessons) have no translations.

## Plan (owner decisions 28 Nov: re-check each batch on the preview; include the roadmap gaps)

CQ-2 fix every error; CQ-3 rewrite check questions to scenario questions with real-mistake distractors; CQ-4 lift the weakest lessons; CQ-5 keep translations matching and translate the 25 missing lessons; CQ-6 roadmap gaps; CQ-7 non-lesson content. A 3-lesson pilot first.
