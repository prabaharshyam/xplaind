# SEO keyword map (SE-8)

Researched 10 Nov 2026. Owner request: rank xplaind.in for AI learning searches in India and stop Google confusing the brand with xplaind.com.

## How the research was done, and its limits

- **Demand signals:** Google India autocomplete (`gl=in`) for about 30 seed phrases. Autocomplete lists what people in India actually type, most-searched first. It does not give monthly volumes.
- **Volumes:** no keyword tool with volumes was connected (Ahrefs and Semrush need sign-in). One public figure: "AI courses" has about 33,100 searches a month in India, the largest market for that phrase (Semrush, quoted in a third-party blog, not verified by us). Before the next round, get real volumes from Google Search Console (free, after verification) and Google Keyword Planner (free with a Google Ads account).
- **Competition:** the first page for most of these phrases is course sellers (Scaler, Simplilearn, Great Learning, Logicmojo), news sites and roadmap.sh. Xplaind's edge is that it is in order, outcome-led (job-ready, portfolio, interviews) and India-specific, so titles lead with "step by step", "job-ready" and "India". By the owner's decision (10 Nov 2026) Xplaind is never called free; searches containing "free" are reached through pages about outside free courses, such as the free-courses guide.

## Keyword clusters and the page that targets each

| Cluster | What India types (autocomplete) | Target page |
| --- | --- | --- |
| Brand | xplaind, xplaind.in | `/`: WebSite and Organization structured data, "What is Xplaind?" FAQ |
| Learn AI free | learn ai for free, learn ai from scratch, ai for beginners, ai courses online free, ai learning platform free | `/` (title, description, FAQ), `/paths`, `/blog/how-to-learn-ai` |
| Free courses with certificate | free ai course with certificate, by govt of india, by google, for beginners | `/blog/free-ai-courses-with-certificate-india` (new), `/resources` |
| Certifications | ai certification free, ai certification microsoft | `/certifications`, `/blog/free-ai-certifications-big-tech` |
| AI engineer career | how to become ai engineer, in india, after 12th, without a degree | `/blog/how-to-become-an-ai-engineer-in-india` (new) |
| Role roadmaps | ai engineer roadmap 2026, for beginners, pdf; generative ai roadmap 2026; machine learning roadmap 2026; mlops roadmap 2026 | `/roadmap/<role>`: "<Role> Roadmap 2026: Free, Step by Step" |
| Salary and jobs | ai engineer salary in india for freshers, per month; ai jobs for freshers | `/jobs` |
| Interview | ai interview questions and answers, for freshers, for experienced, pdf | `/interview`, `/interview/for/<role>`, `/interview/top/<role>` |
| Agentic and generative AI | agentic ai course free, generative ai course free, prompt engineering course free | `/roadmap/agentic-ai-expert`, `/roadmap/genai-engineer`, `/topics/agents`, `/topics/llm` |
| Tutorials | rag tutorial for beginners, rag tutorial from scratch | `/topics/retrieval`, `/stop/rag-app` |
| Tools | online python compiler, ai resume checker | `/playground`, `/ai/resume` |

## Not targeted, and why

- "AI course in Delhi/Bangalore/Hyderabad", "near me", "fees": searches for classroom courses we do not sell.
- "LLM course": in India this mostly means the law degree (Master of Laws).
- Hindi-language queries ("learn ai in hindi", "ai skills kaise sikhe"): the site is in English. Worth a Hindi guide later.

## Rules for titles and descriptions (SE-8)

- Titles: at most 60 characters with the most-searched words first. " | Xplaind" is added only when it still fits (`fitTitle` in `src/lib/seo.ts`).
- Descriptions: at most 155 characters. Say what the page helps the reader do: the outcome, not the price.
- Never call Xplaind or its features free. "Free" appears only as a fact about an outside course or book.
- Never claim "best" or "#1" for Xplaind itself. Never show a price without its check date (RM-6).

## Owner actions that code cannot do

1. Verify xplaind.in in Google Search Console with a DNS TXT record, or set `GOOGLE_SITE_VERIFICATION` in Vercel to the code from the HTML-tag method. Submit `https://xplaind.in/sitemap.xml`. Use URL Inspection, then "Request indexing", for `/`, `/paths`, the role roadmaps and the two new guides.
2. Do the same in Bing Webmaster Tools (`BING_SITE_VERIFICATION`). Bing also feeds ChatGPT search and DuckDuckGo.
3. Brand signals: create a LinkedIn company page and an X or Instagram account named Xplaind that link to xplaind.in. Once they exist, add their links to `sameAs` in `siteGraph` (`src/lib/content/structured.ts`).
4. Links from other sites: launch on Product Hunt, answer questions on r/developersIndia and r/learnmachinelearning with a link where it truly helps, and ask college placement cells and coding clubs to list the roadmaps.
5. After 4 to 6 weeks, read Search Console's Performance report. Rewrite the titles of pages with many impressions but a low click rate, and send the real query list for the next round.
