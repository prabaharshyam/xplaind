# Review: lessons-B2-I3 (2026-10-26)

## Summary

- Files checked: 20 lessons (9 in `content/stops/B2/`, 11 in `content/stops/I3/`) and their 54 check questions in `content/questions/checks/`. Two lessons (`python-setup`, `agent-logs`) use a project check and have no MCQ files.
- Files changed: 12 lessons. No question files needed changes.
- Flagged for the owner: 5 items.
- `npm run content:validate` after the edits: `OK: no errors.`

## Fixed

| File | What was wrong | What it says now | Source |
| --- | --- | --- | --- |
| B2/automation-tools-compared.mdx | Pune example said the Teams approvals and desktop RPA run on "licences they already pay for". Running desktop flows from cloud flows needs a Premium or process licence, which Microsoft 365 does not include. | Says Microsoft 365 covers cloud flows with standard connectors, and desktop RPA run from a cloud flow needs a Power Automate Premium or process licence, so cost that too. | https://learn.microsoft.com/en-au/power-platform/admin/power-automate-licensing/types |
| B2/automation-tools-compared.mdx | Common mistake: "Many companies already pay for Power Automate through Microsoft 365" (too broad). | "Many Microsoft 365 plans already include Power Automate for flows with standard connectors." | same as above |
| B2/automation-tools-compared.mdx | Pricing table said only "Operations". Make moved its billing unit to credits on 27 Aug 2025. | "Operations or credits ... (Make now bills in credits)". | https://help.make.com/introducing-credits-new-billing-unit-live-in-make |
| B2/first-n8n-workflow.mdx | "Every workflow starts with exactly one trigger." n8n allows several trigger nodes, and each run starts from one of them. | "Every workflow starts with a trigger. A workflow can hold more than one, but each run starts from just one of them." | https://docs.n8n.io/integrations/creating-nodes/plan/node-types |
| B2/first-n8n-workflow.mdx | Manual trigger button called "Test workflow". Current docs call it "Execute workflow". | "Execute workflow". | https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.manualworkflowtrigger/ |
| B2/first-n8n-workflow.mdx | Said to "activate" the workflow with an active switch. In n8n 2.0 Publish/Unpublish replaced the Activate toggle. | Outcome, intro, flashcard, "Publishing" section, diagram, worked example, common mistake and practise step now say publish, with a note that it was an Active toggle before 2.0. | https://docs.n8n.io/changelog/v20-breaking-changes |
| B2/webhooks-basics.mdx | Production URL "works when the workflow is active". The n8n docs now say it registers when you publish. | "once the workflow is published" (flashcard) and "published (active)" (table). | https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/ |
| B2/webhooks-basics.mdx | In the exercise, pay_771 was only "delivered" before the restart, but the answer assumes its id was already in the sheet. | pay_771 "was processed and added to the sheet just before the restart, but the 200 OK reply never reached the gateway." | internal consistency |
| B2/python-files-errors.mdx | The exercise said a row with the amount column "missing entirely" raises KeyError. With `csv.DictReader`, a short row gives `None` for the missing field, so `float(None)` raises TypeError, which the script does not catch. If the header lacked the column, every row would fail. | The fifth row now has a blank amount. The answer says 'NA', '1,450' and the blank all raise ValueError. The total (2050.5) is unchanged. | Python `csv.DictReader` (restval defaults to None) |
| B2/shaping-json.mdx | The exercise setup was unclear about whether `payment` sat inside `event`, which would make the answer paths (`payment.customer.phone`) wrong. | States that `event` and `payment` are both top-level fields, and that `customer` and `notes` sit inside `payment`. | internal consistency |
| B2/python-setup.mdx | The Windows install said to use the python.org installer and tick "Add python.exe to PATH". Since 3.14, python.org recommends the Python install manager, which sets up `python` and `py`. The full installer is deprecated and will not be made for 3.16 or later. | The Windows row recommends the install manager, and the PATH tick is described as applying to the older full installer. The flashcard, Neha's exercise answer and the common mistake are adjusted to match. | https://docs.python.org/3/using/windows.html , https://www.python.org/downloads/windows/ |
| B2/python-setup.mdx | Example version `Python 3.13.1` was out of date. | `Python 3.15.2`, which python.org listed as the latest Python 3 release on 2026-10-26. | https://www.python.org/downloads/windows/ |
| B2/python-setup.mdx | "Where am I?" on Windows was `cd` (prints the folder). That is true only in Command Prompt. The VS Code default on Windows is PowerShell, where you use `pwd`. | "`pwd` in PowerShell (the VS Code default), `cd` in Command Prompt". The matching common mistake is updated. | PowerShell `pwd` is an alias of Get-Location |
| B2/python-setup.mdx | The sample error message was missing `[Errno 2]`. | `... hello.py': [Errno 2] No such file or directory` | Python's real error output |
| I3/agent-failures.mdx | "The security community calls the last two excessive agency." OWASP treats excessive agency (LLM06) as the weakness that lets manipulated outputs cause harm. Prompt injection is a separate entry (LLM01). | "OWASP's Top 10 for LLM applications names the weakness that lets these last two cause real harm excessive agency ... Prompt injection itself is a separate entry on the same list." | https://genai.owasp.org/llmrisk/llm062025-excessive-agency/ |
| I3/agent-loop.mdx | The sample loop raised `StopIteration` when it hit the step limit. That exception has special meaning in Python, and inside generators it turns into a RuntimeError. | `raise RuntimeError("Step limit reached; hand over to a person")` | Python docs (PEP 479) |
| I3/agent-tool-design.mdx | The exercise answer said `book` mixes "reading and acting". Booking and cancelling are both actions. | "Two different actions share one tool, so approval and logging cannot target cancellations alone." | internal consistency |
| I3/human-approval.mdx | The body gave a ₹2,000 refund threshold, while the risk table and worked example in the same lesson use ₹1,000. | "(such as refunds over ₹1,000)". | internal consistency |
| I3/vectorless-retrieval.mdx | The comparison table stated latencies ("Under 2 seconds typical", "Around 5 to 15 seconds") without a source. | "Usually fast: one lookup" against "Slower: grows with each call". The worked example's own timings are unchanged. | softened unsourced numbers |

## Flagged for the owner

1. **B2/first-n8n-workflow.mdx, why_it_matters:** "n8n is one of the most popular automation tools among Indian freelancers, startups and IT teams". I found no source for this India-specific popularity claim. It is plausible and soft, but consider "a popular automation tool".
2. **I3/langgraph-basics.mdx, why_it_matters:** "LangGraph is one of the most widely used agent frameworks in Indian and global job listings." I did not check job-listing data. Consider softening to "widely used".
3. **B2/automation-tools-compared.mdx:** The lesson names no prices, which is good for RM-6. Two things still need a person's check. Zapier's and n8n's billing units ("tasks", "executions") were not checked against today's price pages. The claim that all four tools "now offer AI steps" was also not checked page by page.
4. **B2/python-setup.mdx:** The new example version `Python 3.15.2` is right as of 2026-10-26 but will go stale. In the worked example Karthik still uses the older full installer, now marked as an alternative. If you would rather the example use the recommended install manager, Step 1 and the problem table need rewriting.
5. **B2/first-n8n-workflow.mdx and B2/webhooks-basics.mdx:** The n8n UI changes often. 2.x versions reportedly also added autosave and versioned publishing (I saw this only in a third-party article and did not verify it). A person should run through the lesson in the current n8n editor once.

## Checked and fine

B2/python-basics.mdx, B2/python-data-structures.mdx, B2/python-functions.mdx (EMI of 10,379 recomputed), I3/agent-logs.mdx, I3/agent-memory.mdx, I3/langgraph-basics.mdx (code API checked: StateGraph, add_messages, MemorySaver, add_conditional_edges), I3/mcp-servers-clients.mdx (FastMCP import path, stdio and HTTP transports, tools, resources and prompts), I3/planning-reflection.mdx, I3/tool-calling.mdx. All 54 check questions: each has one defensible answer and an explanation that agrees with it.
