# Review: resources-g-m (2026-10-26)

AI reviewer, following docs/review/BRIEF.md. Scope: the 87 files in `content/resources/` whose names start with g to m.

## Summary

- Files checked: 87. Every URL was requested live (curl, then WebFetch or an official API for pages that blocked curl).
- Files changed: 19.
- Items flagged for the owner: 9.
- All 87 resources still exist. None was removed or replaced. All 87 are `cost: free`, none has a price, and every one I could open is free to read or take.
- `npm run content:validate` prints `OK: no errors.`
- Where I changed a URL, title or provider after checking the live official page, I set `last_verified: 2026-10-26` and `verified_by: "UNVERIFIED: checked by an AI reviewer on 2026-10-26; a person must confirm"`. Where I only reworded `why_picked`, I left both fields alone.

## Fixed

| File | What was wrong | What it says now | Source |
|---|---|---|---|
| github-copilot-prompt-engineering | The URL redirects (301), and the page title no longer says "Chat" | URL `.../copilot/concepts/prompting-and-context/prompt-engineering`; title "Prompt engineering for GitHub Copilot" | https://docs.github.com/en/copilot/concepts/prompting-and-context/prompt-engineering |
| github-profile-readme | The URL redirects to a new docs path | `.../account-and-profile/how-tos/profile-customization/managing-your-profile-readme` | https://docs.github.com/en/account-and-profile/how-tos/profile-customization/managing-your-profile-readme |
| google-cloud-getting-started | cloudskillsboost.google now redirects (308) to skills.google, and the provider has been renamed | URL `https://www.skills.google/paths/8`; provider "Google Skills" | https://www.skills.google/paths/8 |
| google-deploy-genai-path | Provider name out of date (Cloud Skills Boost is now Google Skills) | provider "Google Skills" | https://www.skills.google/paths/1283 |
| google-genai-developers-path | Provider name out of date | provider "Google Skills" | https://www.skills.google/paths/183 |
| google-intro-genai-path | Provider name out of date | provider "Google Skills" | https://www.skills.google/paths/118 |
| google-genai-leader-path | Provider name out of date; the path is now titled "Generative AI Leader Certification" | provider "Google Skills"; title "Generative AI Leader Certification (learning path)" | https://www.skills.google/paths/1951 |
| langgraph-memory | The URL redirects (308) | `https://docs.langchain.com/oss/python/concepts/memory` | same URL |
| llamaindex-metadata | The docs moved to developers.llamaindex.ai (301) | `https://developers.llamaindex.ai/python/framework/module_guides/indexing/metadata_extraction/` | same URL |
| learn-prompting | The URL was the home page, which now sells paid courses and has a Pricing page. "Open... kept up to date" could not be verified | URL `https://learnprompting.org/docs/introduction` (the free guide); why_picked says the guide is free and the site also sells paid courses | https://learnprompting.org/ and https://learnprompting.org/docs/introduction |
| missing-semester-shipping-code | The page title is "Packaging and Shipping Code" | title "Packaging and Shipping Code" | https://missing.csail.mit.edu/2026/shipping-code/ |
| ms-develop-ai-agents-azure | The URL slug changed (301). "Prep for exam AI-103" was stronger than the page supports: the path page does not mention the exam | URL `.../training/paths/develop-ai-agents-azure/`; why_picked ends "Covers the agent part of exam AI-103." | https://learn.microsoft.com/en-us/training/paths/develop-ai-agents-azure/ and https://learn.microsoft.com/en-us/credentials/certifications/exams/ai-103/ |
| ms-ai-agents-for-beginners | "18 lessons with videos and code": the README table links videos only for lessons 1 to 13 | "18 lessons with code, most with a short video" | https://github.com/microsoft/ai-agents-for-beginners |
| kubernetes-basics | Called "interactive": the page no longer offers an in-browser environment (it uses Minikube) | "The official tutorial:" | https://kubernetes.io/docs/tutorials/kubernetes-basics/ |
| hamel-evals | "The most-shared" is an unverifiable superlative | "A widely shared practical guide" | https://hamel.dev/blog/posts/evals/ |
| illustrated-transformer | "The most-read" is an unverifiable superlative | "A widely read visual explanation" | https://jalammar.github.io/illustrated-transformer/ |
| microsoft-graph-overview | "where most enterprise documents in Indian companies live" is an invented claim | "where many companies keep their documents" | https://learn.microsoft.com/en-us/graph/overview |
| ms-power-automate-path | "the tool many Indian enterprises on Microsoft 365 already have" is unverified | "which comes with many Microsoft 365 business plans" | https://learn.microsoft.com/en-us/training/paths/automate-process-power-automate/ |

## Flagged for the owner

1. **langchain-academy-langgraph**, `certificate: true` and "free course". The course page says "Free" and "Enroll for free" (55 lessons, 6 hours of video). The page does not say the course gives a certificate of completion. The only certificate LangChain describes is the paid LangChain Certified Agent Engineer exam ($99 USD, https://academy.langchain.com/pages/certifications-lcae). I left the flag as true. Please confirm by enrolling.
2. **google-intro-genai-path, google-genai-developers-path, google-deploy-genai-path, google-genai-leader-path**, `certificate: true`. The skills.google pages ask you to sign in and do not say whether the paths award badges. Third-party sources say completion badges are free, while skill badges and some labs need credits or a subscription. Google Skills awards badges, not certificates. Please decide whether a badge counts as `certificate: true`.
3. **google-genai-developers-path**, "Some labs use credits; the videos are free." I could not verify this on the sign-in-gated page. The page lists 12 activities and titles the path "Advanced: Generative AI for Developers".
4. **google-intro-genai-path**, "generative AI, large language models and responsible AI, each a short video course". The page shows 4 activities but not their names, so I could not confirm the list.
5. **ms-develop-ai-agents-azure**, the link to exam AI-103. The exam exists ("Microsoft Certified: Azure AI Apps and Agents Developer Associate") and covers agentic solutions with Microsoft Foundry. Neither the exam page nor the path page links the two, so check the AI-103 study guide (https://aka.ms/AI103-StudyGuide).
6. **gemini-cookbook**, "function calling, file input and grounding". The README confirms grounding. `quickstarts/Function_calling.ipynb` and `quickstarts/File_API.ipynb` exist in the repo (fetched from raw.githubusercontent.com). This is fine, but github.com blocked direct access, so I only read the README summary.
7. **hf-llm-course**, `certificate: false`. Chapter 1 has a page called "Certification exam", but it is a chapter quiz, and the course FAQ says "Currently we do not have any certification for this course." I left false. Recheck if Hugging Face launches the certification it mentions.
8. **gdpr-eu-overview**, provider "GDPR.eu". The page is correct, but GDPR.eu is run by a private company (Proton). It is not an official EU site. Consider saying so, or linking to the EU's own page.
9. **langchain-multi-agent**, "supervisor with sub-agents as tools, hand-offs". The page now lists the patterns as Subagents, Handoffs, Skills, Router and Custom workflow. The why_picked is still broadly true. You may want to name the newer patterns.

## Checked and fine

gemini-image-help, gemini-prompt-strategies, github-actions-quickstart, github-copilot-prompt-files, github-environments, github-flow, google-ml-crash-course, google-mlcc-classification, google-mlcc-linear-regression, google-sre-incidents, google-sre-monitoring, google-tech-writing, gov-uk-alpha, gov-uk-beta, gov-uk-discovery, gov-uk-live, gov-uk-measuring-success, gov-uk-user-research, gov-uk-user-stories, graphrag-blog (Microsoft Research, 13 Feb 2024), graphrag-docs, great-expectations, hamel-field-guide, helm-quickstart, hf-4bit-quantization, hf-agents-course (free; the certificate is free with no deadline: Fundamentals for Unit 1, Completion for Unit 1 plus an assignment and the final challenge), hf-agents-react, hf-multimodal-rag, hf-quantization, hf-semantic-search-faiss, huyen-llm-production, huyen-ml-interviews-book, huyenchip-genai-platform, huyenchip-ml-systems-design, hyde-paper, ibm-data-strategy, ilo-genai-jobs (the ILO says "transformation of jobs is the most likely impact"), intro-to-llms-karpathy ("[1hr Talk] Intro to Large Language Models", Andrej Karpathy, confirmed via YouTube oEmbed), kaggle-feature-engineering, kaggle-intermediate-ml, kaggle-intro-ml, kaggle-learn-pandas, kaggle-learn-python (lesson lists and hours confirmed via Kaggle's API; free certificates confirmed by kaggle.com/learn/certification pages), langfuse-evaluation, langfuse-observability, langgraph-interrupts, lilianweng-agents, litellm-gateway, locust-quickstart, lost-in-the-middle, made-with-ml, matplotlib-pyplot, mcp-intro (redirects to the current versioned page; the unversioned URL is kept on purpose), mdn-http-overview, mdn-json, missing-semester-command-line, missing-semester-git, missing-semester-shell, mlflow-prompt-registry, mlflow-tracking, mml-book, ms-genai-for-beginners (21 lessons plus setup, Python and TypeScript, Microsoft Cloud Advocates), ms-hax-guidelines (18 guidelines in 4 phases), ms-learn-genai-fundamentals.
