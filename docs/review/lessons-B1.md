# Review: lessons-B1 (2026-10-26)

## Summary

- Files checked: 19 lessons in `content/stops/B1/` and their 51 multiple-choice check questions in `content/questions/checks/`. Two lessons (`use-an-assistant`, `choosing-your-path`) use a project check, so they have no question files.
- Files changed: 11 (9 lessons, 2 question files).
- Items flagged for the owner: 7.
- `npm run content:validate`: my files raise no errors. The run reports 2 errors, both in another batch's files (`stops/I2/cnns-images.mdx` and `stops/I2/document-parsing-ocr.mdx`, each 993 words, below the 1,000-word minimum for a deep lesson). I did not touch those files.
- I did not change `reviewed_by`, `reviewed_on`, `drafted_with_ai`, `verified_by` or `last_verified`.

## Fixed

| File | What was wrong | What it says now | Source |
| --- | --- | --- | --- |
| questions/checks/history-of-ai-2.yaml | The answer key was `b` ("Rules, experts and books"). The explanation and the lesson both point to option a. | `correct: a` (data, computing power and better model designs) | The lesson text itself |
| questions/checks/ai-rules-india-abroad-3.yaml | The right option and the explanation limited the EU social-scoring ban to public authorities. The final Act has no such limit. | "Social scoring that leads to unfair treatment of people"; the explanation says the ban covers companies and public authorities | https://artificialintelligenceact.eu/article/5/ (Art. 5(1)(c)) |
| stops/B1/ai-rules-india-abroad.mdx (flashcard and EU risk table) | The same "by public authorities" limit | Social scoring that leads to unfair or harmful treatment, by companies or public authorities | Same as above |
| stops/B1/ai-rules-india-abroad.mdx (DPDP section) | It listed DPDP rights as if they apply now. Most duties and rights apply 18 months after the rules were notified on 13 Nov 2025. | Added: most duties and rights apply from May 2027; until then a company may not be legally bound, and RBI rules already require regulated lenders to have a grievance officer | https://www.azbpartners.com/bank/indias-digital-personal-data-protection-act-phased-rollout-and-key-compliance-milestones/ ; https://elplaw.in/wp-content/uploads/2025/11/Shaping-Indias-Data-Protection-Regime-DPDP-Rules-Published-1.pdf |
| stops/B1/use-ai-safely.mdx (body and DPDP flashcard) | "Use personal data only for the purposes people agreed to" is not exact. The Act also allows certain legitimate uses without consent. It also left out that the duties are phased in. | "only for a lawful purpose, usually one the person consented to … Most of these duties apply from May 2027"; "can break that law once it applies, and it can already break your company's contracts" | DPDP Act s.4 and s.7; the phasing sources above |
| stops/B1/deepfakes-misinformation.mdx | It said the government "has proposed" AI-content labelling rules. These were notified on 10 Feb 2026 and have been in force since 20 Feb 2026. | Labelling of AI-generated audio, images and video is required since 20 Feb 2026, with a 3-hour takedown after a government or court order | https://www.hoganlovells.com/en/publications/india-introduces-mandatory-labelling-for-ai-and-3hour-takedown-for-illegal-content ; https://www.businesstoday.in/amp/technology/story/govt-tightens-rules-on-ai-generated-content-mandates-labels-and-faster-takedowns-515505-2026-02-10 |
| stops/B1/history-of-ai.mdx | "hundreds of millions of people started using AI directly within months" of late 2022. This overstates the early figures, which were about 100 million in two months, and those were estimates. | "millions of people started using AI directly within weeks" | Softened to a durable claim |
| stops/B1/checking-ai-answers.mdx | The tea stall was named "Chai Point Saravanampatti". Chai Point is a real Indian tea chain, and the example says only "no shop nearby" uses the name. | "Saravanampatti Chai Corner"; he checks that no other shop or brand already uses the name | Brief rule 5 (real companies) |
| stops/B1/ai-for-writing.mdx | why_it_matters: "AI can halve that time" is a precise claim with no source | "AI can cut that time a lot" | Softened |
| stops/B1/ai-for-writing.mdx (worked example table) | Usual times of 60 + 45 minutes were totalled as "about 2 hours" | "about 1 hour 45 minutes" | Arithmetic |
| stops/B1/mapping-a-process.mdx | "About 18 minutes … roughly 180 hours a month" does not follow from the step table. That gives 4 + 3 + (15% × 20) + 3 + 1 = 14 minutes, plus 5 minutes only for paper invoices, so 18 minutes needs about 80% paper. | "About 15 minutes … once exceptions and paper invoices are counted, roughly 150 hours a month" | Arithmetic from the lesson's own table |
| stops/B1/choosing-your-path.mdx | "A weekly check-in with one person doubles the chance you keep going" is an invented statistic | "makes you much more likely to keep going" | Softened |
| stops/B1/ai-careers-india.mdx | "This is the fastest-growing AI title" cannot be checked as an absolute | "It is one of the fastest-growing AI titles" | Softened |

## Flagged for the owner

1. **ai-and-jobs.mdx, exercise.** The answer says "Invoice data entry and routine reminder emails" are the two most exposed tasks. Matching bank statements (20% of Meena's time) is also highly automatable with reconciliation tools, and some would rank it above the reminder emails. "About half of her time is exposed" is 55% by the lesson's own split, and 75% if matching counts. Please decide whether the answer should mention matching.
2. **history-of-ai.mdx, Deep Blue.** The lesson describes Deep Blue in the "learning era" section and puts 1997 in the learning era in its table (1990s to 2010s). The exercise answer puts system (B), the 1997 chess computer, in the rules era. The text does say Deep Blue "mostly used fast search and hand-tuned evaluation", so the answer is defensible, but a learner may be confused. Consider adding a line saying Deep Blue was rules-era technique in a learning-era decade.
3. **deepfakes-misinformation.mdx.** "Research projects such as Detect Fakes show that people are often not much better than chance at spotting good ones." This is broadly in line with the MIT Detect Fakes work (Groh et al.), but I did not open the paper to confirm the wording. The flashcard repeats it.
4. **ai-rules-india-abroad.mdx, Deepa example.** Deepa's DPDP rights (erasure, complaint to the Data Protection Board) are shown as working today. Under the phasing, most of them are not enforceable until May 2027, and in May 2026 the Board's members were still being appointed (per Mondaq). I added a note on phasing in the body, but the worked example and its table still read as current. You may want to frame it as "from May 2027".
5. **company-ai-policy.mdx.** "Putting customer personal data into an unapproved tool may break India's DPDP Act." The "may" makes this acceptable, but the same phasing point applies. I left it unchanged.
6. **ai-and-jobs.mdx.** "Demand for AI skills in Indian job postings has been growing fast" has no source. It is very likely true, but I did not verify a specific source.
7. **what-ai-cannot-do.mdx, worked example.** The table row "Whether to approve early payment" introduces a task that the text never mentions. This is minor; consider adding a sentence or dropping the row.

## Checked and fine

what-is-ai, what-ai-cannot-do, use-an-assistant, prompting-without-jargon, ai-for-research, images-voice-tools, company-ai-policy, bias-fairness, what-is-automation, and all check questions other than history-of-ai-2 and ai-rules-india-abroad-3.

Also checked:
- The worked-example numbers in what-is-ai (50 and 12 minutes), choosing-your-path (the weekly-hours table) and mapping-a-process (the 3,040-minute exercise), and the task shares in the ai-and-jobs tables (each adds up to 100%).
- India's AI Governance Guidelines were released by MeitY on 5 Nov 2025 (https://negd.gov.in/press_release/meity-unveils-india-ai-governance-guidelines-under-indiaai-mission-to-ensure-safe-inclusive-and-responsible-adoption-of-artificial-intelligence-across-sectors/).
- The ₹250 crore DPDP security-safeguard penalty, which is in the Act's Schedule.
- The ILO finding on clerical exposure and augmentation.
- Anthropic AI Fluency's four Ds (delegation, description, discernment, diligence).
- The 1930 helpline and the cybercrime portal.
- The nine paths and the Automation Specialist path's "about three months at 5 to 6 hours a week" (content/goals/ai-automation-specialist.yaml).
- The "Make this my path" button label (src/components/roadmap/roadmap-view.tsx).
