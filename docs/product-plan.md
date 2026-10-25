# Product plan v2: nine paths, one lesson library

Written 2026-10-25 from the owner's direction of the same day. It extends `docs/PRD.md` (release 1 was one path, GenAI Engineer). Where the two differ, this plan wins for paths and content; the PRD still governs data, privacy, security and quality rules.

## The idea in one paragraph

Xplaind is where someone in India goes to learn AI for a specific job. They pick a path, a short test skips what they already know, and every topic on the path has an original lesson written by us, the best free courses for it, a check, and a project at the end of each stage. Lessons live in one shared library, so finishing RAG on one path counts on every path.

## Owner decisions (2026-10-25)

- Nine paths: the owner's six (GenAI Engineer, Forward Deployed Engineer, AI for Beginners, Agentic AI Expert, RAG Expert, AI Automation Specialist) plus LLMOps / AI Platform Engineer, AI Product Manager and ML Engineer. Specialist domains that need prior expertise elsewhere, such as AI security, are out.
- Every topic gets an original explainer lesson (about 600 to 1,000 words: what it is, why it matters, how it works, a worked example, common mistakes, key terms), then free courses, then a check.
- One shared lesson library. A path is an ordered route through it, with its own stage projects.
- AI governance is covered where it belongs: basics for beginners, compliance for FDE and LLMOps, responsible AI and regulation for product managers, approvals and accountability for agents and automation.
- The FDE path covers every topic in the 6-month roadmap the owner shared. We write our own explanations and our own case study; we do not copy that deck's text, examples or branding.

## Evidence for the path list

Secondary sources agree that AI Engineer / GenAI Engineer is the fastest-growing AI title in India and the US, that MLOps / LLMOps and AI product management are the other recurring roles, that agentic AI skills are small but roughly quadrupled in a year, and that "prompt engineer" as a standalone title is fading. Sources: CareerIndia, Skillcept, Open Data Science, AI Talent Report, HeroHunt (October 2026 search). Treat figures as signals, not facts.

## The paths

Each path is a list of stages. Each stage lists topics (each topic is one lesson) and ends in a project. Topics shared with other paths are written once.

### 1. GenAI Engineer (existing)
The nine levels B1 to P3, as built in release 1.

### 2. Forward Deployed Engineer (6 stages, about 6 months at 15 to 20 hours a week)
1. **Foundations.** Python for production (types, dataclasses, Pydantic, async); project tooling (environments, packaging, pytest, logging, structure); SQL for engineers (joins, window functions, indexes); REST APIs with FastAPI and HTTP; working with JSON, tables, files and PDFs; Git collaboration (branches, pull requests, review); the Linux command line, shell scripts and SSH; Docker (images, volumes, Compose); how LLMs work (tokens, context, sampling, transformers at a concept level); calling hosted and open-weight model APIs. *Project: a document question-answering API.*
2. **LLM engineering.** Prompting (system prompts, few-shot, step-by-step reasoning); structured output and JSON schema; tool calling basics; embeddings; chunking; vector databases (pgvector, Qdrant, Pinecone); hybrid search, reranking and metadata filters; advanced retrieval (query rewriting, HyDE, parent-child chunks); grounding, citations and hallucination control; retrieval for long documents without vectors (page-index style); evals (golden sets, LLM judges, RAGAS); regression tests for prompts; cost, latency and quality trade-offs. *Project: an enterprise RAG assistant with an eval report.*
3. **Agentic AI.** The agent loop (ReAct, planning, reflection); tool design and schemas; agent memory; LangGraph (state, nodes, edges, checkpoints); sub-agent patterns; agent SDKs; MCP servers and clients; context engineering; human approvals; guardrails; permissions and sandboxing; loop limits, budgets and kill switches. *Project: an operations agent with approval gates and traces.*
4. **Production and deployment.** Serving (FastAPI with Uvicorn or Gunicorn, streaming); Kubernetes and Helm basics; one cloud in depth; CI/CD with GitHub Actions; dev, staging and production environments; secrets and infrastructure as code with Terraform; LLM observability and tracing; token and cost dashboards and alerts; online evals and feedback loops; LLM gateways (routing, fallbacks, rate limits); caching, batching and model tiering; latency budgets and load testing. *Project: the stage-3 agent deployed on a cloud with CI/CD, tracing and a gateway.*
5. **Enterprise integration.** Single sign-on (OAuth 2, OIDC, SAML basics); role-based access for RAG; audit logging; enterprise connectors (SharePoint, Salesforce, SAP, Jira, S3); data pipelines (ETL, ELT, change data capture, incremental indexing); data quality and personal data handling; prompt injection and data exfiltration; compliance (SOC 2, GDPR, India's DPDP Act, HIPAA awareness); vendor security questionnaires; deployment models (private cloud, on-premise, air-gapped); serving open-weight models with vLLM; cost modelling and total cost of ownership. *Project: a secure enterprise copilot with sign-on, per-user permissions and an audit trail.*
6. **FDE craft and capstone.** Discovery (stakeholder interviews, process mapping); finding the KPI that matters; writing a scope of work; delivery stage gates (proof of concept, pilot, production); change management and user training; weekly demos, risk logs and escalation; executive updates and demo storytelling; managing scope and saying no; documentation and handover; an end-to-end case study (our own, set in India); FDE interview loops; portfolio and job search. *Project: an end-to-end client capstone with scope, architecture, demo and results deck.*

### 3. AI for Beginners (5 stages, no coding)
What AI is; using AI assistants for real work; using AI well (checking answers, privacy, safety at work); AI and society (bias, deepfakes, governance basics including India's DPDP Act and the EU AI Act at a high level); your next step (AI careers and choosing a path). *Project: a personal AI workflow for one weekly task.*

### 4. Agentic AI Expert
Foundations (model APIs, structured output, tool calling); agent design (loop, tools, memory, planning and reflection, context engineering); frameworks (LangGraph, agent SDKs, multi-agent systems); interoperability (MCP, browser and computer-use agents); reliability (agent evals, tracing, failure modes, guardrails, human approvals, permissions, budgets); production and governance (deployment, cost, accountability for agent actions).

### 5. RAG Expert
Foundations (embeddings, context windows); ingestion (document parsing and OCR, chunking, metadata, incremental indexing); retrieval (vector databases, hybrid search, reranking, query rewriting and HyDE, parent-child chunks, graph RAG, long documents without vectors); generation (grounding and citations, hallucination control, long context versus RAG); evaluation (retrieval metrics, faithfulness, golden sets, regression); production (access control, caching, monitoring, cost); multimodal RAG.

### 6. AI Automation Specialist (low-code)
Foundations (what automation is, mapping a process, AI basics, prompting); tools (n8n in depth, with Make, Zapier and Power Automate compared); APIs, webhooks and JSON without heavy code; AI steps in workflows (extraction to structured data, document processing, email and ticket triage, chat assistants for websites and WhatsApp Business); RPA basics; reliability and governance (error handling, human approval, data privacy, logging); delivering automation projects (scoping, measuring return on investment, handover).

### 7. LLMOps / AI Platform Engineer
Foundations (Python for production, Linux, Docker, one cloud, Kubernetes); serving (APIs, vLLM, GPU and quantization basics, gateways); delivery (CI/CD, infrastructure as code, environments, secrets); observability (tracing, cost, online evals, feedback and drift); scale (caching, batching, autoscaling, load testing, rate limits); governance (model and prompt versioning, audit logs, compliance, incident response).

### 8. AI Product Manager (no coding required)
AI basics for PMs; finding use cases (problem selection, feasibility, build versus buy); designing AI products (UX for uncertain output, defensive design, human in the loop); evals and metrics for PMs; prompting, RAG or fine-tuning decisions and data strategy; responsible AI and governance (bias, privacy, DPDP, EU AI Act, internal AI policies); pricing AI features and unit economics; launch, adoption and iteration; AI PM interviews.

### 9. ML Engineer (classical ML and deep learning)
Maths and statistics intuition; Python data stack (NumPy, pandas, plotting); supervised learning (regression, classification); trees and gradient boosting; unsupervised learning; feature engineering; model evaluation and cross-validation; neural networks and PyTorch; CNNs and transformers; MLOps for ML (experiment tracking, model registry, serving, monitoring and drift, data versioning); ML interviews.

## The owner's final-stage feature list, by phase

| Phase | Features |
| --- | --- |
| **Now (content and structure)** | Nine learning roadmaps; AI glossary and simple lessons; free courses and certification directory (the course list, with a certificate filter); personalised paths (path choice plus placement test) |
| **Next (needs the owner's manual steps first)** | Saved progress across devices (built, waiting on Supabase); bookmarks; guided projects with steps and rubrics; GitHub repositories as resources; books (waiting on an Amazon Associates tag); interview questions for every path; weekly newsletter and learning reminders (needs an email service) |
| **Later** | Curated AI news (an editor picks items weekly; no automated scraping); project portfolios and skill records (public learner profiles built on accounts); practical skill assessments (graded projects and code tasks) |
| **Needs model calls (release 2 rules: daily caps, spend cap, kill switch)** | Adaptive AI tutoring; mock interviews with a strengths-and-gaps report; feedback on typed answers |
| **Business and community** | Premium interview preparation (needs a pricing decision); college and company programmes (cohorts and dashboards); community-contributed lessons and projects (contributions by pull request, reviewed before publishing) |
| **Language** | English and Tamil (Tamil needs a fluent reviewer for every lesson; machine translation alone is not enough) |

## Build order

1. Plan (this document).
2. Structure: a shared topic library; paths as content files with stages and projects; a path chooser; a roadmap page per path; next steps per path.
3. Lesson format: original explainers and a glossary.
4. FDE lessons, every roadmap topic.
5. AI for Beginners, Agentic AI, RAG, Automation, LLMOps, AI PM, ML Engineer; rewrite the 38 GenAI lessons as explainers.
6. Home page and navigation for nine paths.

Every lesson is drafted with AI help and flagged for review. Launch mode still fails until a person signs each one off. Every resource link is opened before it is used.
