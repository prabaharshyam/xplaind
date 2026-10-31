# Design skills

Third-party Claude Code skills used for Xplaind's visual design. Read before updating; both
were reviewed on 2026-10-31 (instruction text and scripts) before being added.

| Skill | Source | Commit | License |
| --- | --- | --- | --- |
| taste-skill (design-taste-frontend) | https://github.com/Leonxlnx/taste-skill | 12af471f627f866411b4bd785b19646d3672784c | MIT |
| frontend-design | https://github.com/anthropics/skills (skills/frontend-design) | ca45fc496a3436251f191354091d557da31c15b5 | see LICENSE.txt |

The taste-skill scripts need Node 22+ and Chromium; `scripts/assets.mjs` fetches public-domain
images from Openverse, Wikimedia Commons and museum APIs. They write working files to
`.taste-skill/`, which is git-ignored.
