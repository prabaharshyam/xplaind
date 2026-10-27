# Review: lessons-I2 (2026-10-26)

## Summary

- Files checked: 26 lessons in `content/stops/I2/` and their 75 check questions in `content/questions/checks/`. `rag-app` has a project check, so it has no MCQ files.
- Files changed: 25 lesson files and 1 question file (`data-quality-pii-1.yaml`). `retrieval-metadata.mdx` had no changes.
- Items flagged for the owner: 8.
- `npm run content:validate` prints `OK: no errors.` after the edits.
- I did not touch `reviewed_by`, `reviewed_on` or `drafted_with_ai`, and I changed no resource files.

## Fixed

| File | What was wrong | What it says now | Source |
| --- | --- | --- | --- |
| advanced-retrieval.mdx | Results table said "9 of 11 failing" before the fix, but the text says the fix solved 9 of 11 cases (2 still fail) | "11 of 11 failing" before, "2 of 11 failing" after | Internal arithmetic |
| audit-logs.mdx | The sample log line had the agent's propose event with actor `agent` only. The lesson itself calls that a mistake | `agent(on behalf of emp-2213)  action=propose` | Internal consistency |
| audit-logs.mdx | Stray blank line splitting the Common mistakes list | One list | Formatting |
| check-retrieval.mdx | "Only measuring final answers" repeated "Judging only final answers" in Common mistakes; stray blank lines | Duplicate removed, one list | Internal consistency |
| check-retrieval.mdx | The recall at k definition ("at least one correct passage") is really hit rate, with no note; context precision was described as plain precision | Adds that this version is also called hit rate, and that RAGAS context precision also rewards ranking relevant passages higher | https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/context_precision/ (from knowledge of the RAGAS docs, not fetched) |
| chunking.mdx | why_it_matters: "Bad chunking is the most common reason..." is unverifiable | "one of the most common reasons" | Softened |
| chunking.mdx | Stray blank line in Common mistakes | One list | Formatting |
| cnns-images.mdx | "No human route for low confidence" duplicated "No confidence threshold in production" | Merged into one item. Augmentation item lengthened slightly to keep the 1,000-word minimum | Internal consistency |
| data-quality-pii-1.yaml | Stem said "Your name detector finds 97% of phone numbers" | "Your personal-data detector finds 97% of phone numbers" | Internal consistency |
| data-versioning.mdx | "Overwriting a dataset in place" was listed twice in Common mistakes | Merged into one item | Internal consistency |
| document-parsing-ocr.mdx | why_it_matters: "In most RAG failures the retrieval works and the parsing does not" is unverifiable, and it contradicts check-retrieval and rag-app, which say most failures start with retrieval | "Many RAG failures start with parsing, not retrieval ... often the cheapest big improvement" | Softened, internal consistency |
| document-parsing-ocr.mdx | Results table had an empty third column (`\| Problem found \| Fix \| \|`) | Two-column table | Formatting |
| document-parsing-ocr.mdx | "Never looking at the parsed text" duplicated "Never comparing output with the page" | Merged. OCR item lengthened slightly to keep the word minimum | Internal consistency |
| embeddings.mdx | Stated exact ranking output of the MiniLM example ("The buffering ticket comes last") without running it | Says what *should* happen and tells the learner to run it and check | Could not run the model offline |
| enterprise-connectors.mdx | "Connector work is often half of an FDE project's engineering time" is an invented figure | "often takes a large share of" | Softened |
| enterprise-connectors.mdx | Stray blank line in Common mistakes | One list | Formatting |
| environments-secrets-terraform.mdx | The `azurerm_postgresql_flexible_server` snippet left out `resource_group_name`, which is required, so `terraform plan` would fail | Adds `resource_group_name` and `version = "16"`, and aligns the arguments. `sku_name` values and `public_network_access_enabled` checked against the docs | https://github.com/hashicorp/terraform-provider-azurerm/blob/main/website/docs/r/postgresql_flexible_server.html.markdown |
| experiment-tracking.mdx | The model registry was described with "a stage (staging or production)". MLflow has deprecated stages in favour of aliases | Says the registry uses a label such as an alias, and that MLflow's older fixed stages are deprecated | https://mlflow.org/docs/latest/model-registry (from knowledge, not fetched this session) |
| experiment-tracking.mdx | Stray blank lines in Common mistakes | One list | Formatting |
| grounding-citations.mdx | Flashcard gave "at least a fifth" unanswerable questions as if it were a standard | "There is no fixed standard. A useful rule of thumb is at least a fifth" | Softened |
| hybrid-search-reranking.mdx | Said PostgreSQL full-text search offers BM25. Built-in Postgres ranks with `ts_rank` or `ts_rank_cd`, not BM25 | Elasticsearch, OpenSearch and many vector databases offer BM25. Postgres built-in uses `ts_rank`, and extensions add BM25 | https://www.postgresql.org/docs/current/textsearch-controls.html (from knowledge) |
| hybrid-search-reranking.mdx | "a 14-point gain in recall" for the reranker. The table shows 79% to 88%, which is 9 points | "a 9-point gain" | Internal arithmetic |
| neural-networks.mdx | Said "in the next lesson they move to a CNN", but the CNN lesson follows a different company (a Pune fabric project) | "Their next step is a convolutional network... The CNN lesson covers how." Table row reworded | Internal consistency |
| pytorch-basics.mdx | "Forgetting either [eval() or no_grad()] gives wrong validation numbers". Forgetting `no_grad()` only wastes memory | Separates the two effects | PyTorch semantics |
| pytorch-basics.mdx | "Most PyTorch errors are shape errors" | "Many" | Softened |
| pytorch-basics.mdx | Stray blank line in Common mistakes | One list | Formatting |
| rag-app.mdx | Worked example said "42 correct" out of 42 answerable questions, then said two failures were fixed. Those two statements cannot both be true | "40 of the 42 answerable questions correct". The table still shows 42 of 42 after the OCR fix | Internal arithmetic |
| rag-app.mdx | "RAG is the most common GenAI feature" (twice) and "This one check halves the time spent guessing" are unverifiable | "one of the most common", "saves a lot of guessing" | Softened |
| rag-app.mdx | The README content asked for in Practise did not match the project brief (the brief asks for the source of each answer) | Practise now matches the brief. The fixed failure is presented as optional | Internal consistency |
| serving-ai-apps.mdx | Streaming snippet used `Question` and `model_stream` with no hint they are placeholders | Adds a comment saying both are your own request model and model client | Code clarity |
| serving-ai-apps.mdx | Stray blank line in Common mistakes | One list | Formatting |
| serving-ml-models.mdx | Two weeks of shadow mode was said to show that v7 "ranked later defaults better". Loan defaults take months to appear, so this is not possible | Shadow checks stability. The claim of better ranking now comes from a back-test on older loans with known outcomes. Table updated | Domain logic |
| single-sign-on.mdx | Contractors "could not sign in" yet "the token shows the contractors group is missing". If a user is not assigned to the app, no token is issued | The provider's sign-in error says the users are not assigned to the app | Entra ID or Okta app assignment behaviour |
| tracing-llm-apps.mdx | Worked example named the real PM-KISAN scheme and an invented "2019 press note about a proposal to double the instalment", an invented fact about a real government scheme (brief, item 5) | Uses a generic state crop-support scheme, labelled as made up. The stale document is "a 2019 note about an earlier version of the scheme" | Brief, Indian examples rule |
| transformers-explained.mdx | Attention arithmetic left out the scaling step | Adds the division by the square root of the vector size before softmax | Vaswani et al. 2017 |
| transformers-explained.mdx | Said embedding models are encoder-only, but several current embedding models are adapted from decoder-only models | "many embedding models", plus a note that some recent ones are adapted from decoder-only models. MCQ 1 ("typically") stays defensible | General knowledge |
| vector-search.mdx | "the exercise above". The exercise is in front matter, so it may not render above this text | "this lesson's exercise" | Internal consistency |
| versioning-prompts-models.mdx | Stray blank line in Common mistakes | One list | Formatting |

## Flagged for the owner

1. **audit-logs.mdx**: "audit events for eight years to match financial record rules". This is given as an example, but the right period depends on the regulation. PMLA record-keeping is 5 years, and books of account under the Companies Act are 8 years. A person should confirm that the example fits a cooperative bank, or make it more general.
2. **audit-logs.mdx**: a cooperative bank's "ombudsman". The RBI Integrated Ombudsman Scheme covers only some urban cooperative banks, by deposit size. The text is vague enough to be safe, but a person may want to say "the banking ombudsman" or "its regulator".
3. **data-quality-pii.mdx**: pseudonymisation is defined as "replacing real personal data with realistic fakes or tokens". Strictly, pseudonymisation keeps a separately held mapping, and synthetic fakes are closer to anonymisation. Left as is; needs judgement on how precise to be.
4. **embeddings.mdx**: I could not run the MiniLM example offline. The softened text tells the learner what should happen. Someone should run it once to confirm the top two results.
5. **long-context-vs-rag.mdx**: "with caching ... the total can drop to around a quarter" for 12 questions on a 40,000-token contract. With Anthropic's prices (cache write 1.25x, cache read 0.1x) it comes to about a fifth. Other providers' discounts differ. Approximate and hedged; left as is.
6. **serving-ai-apps.mdx**: the snippet streams server-sent events by hand with `StreamingResponse`, which is valid. Recent FastAPI releases may have added a built-in SSE response class. I did not check this. The code is correct either way.
7. **single-sign-on.mdx**: the exercise has an Okta-based app reading Box "with user-delegated access". Box uses its own OAuth, and an Okta token cannot simply be exchanged for a Box token. The answer stays correct in principle (do not use a shared service account), but a person may want to reword it as "Box OAuth as the signed-in user".
8. **General**: many worked examples use invented percentages (recall, accuracy, latency) for fictional Indian companies. These are clearly illustrative and the arithmetic is consistent, but they are not real measurements.

## Checked and fine

retrieval-metadata.mdx (no changes). All MCQ check questions except data-quality-pii-1 were fine: each has one defensible answer and an explanation that agrees with it. Identifier formats in data-quality-pii (PAN, Aadhaar Verhoeff checksum, IFSC, GSTIN, mobile prefixes 6 to 9) are correct. The KYC periodic-update intervals quoted in advanced-retrieval (2, 8 and 10 years) match RBI's KYC Master Direction. The neural-networks weight count (16,901) and the check-retrieval MRR (about 0.46) add up. The PyTorch, sentence-transformers and FastAPI code uses current APIs.
