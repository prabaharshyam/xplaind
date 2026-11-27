# Xplaind brand sheet

One page that every new screen follows, so the site looks like one product. The shared class names live in `src/components/ui.ts`.

## Promise and voice

- **Promise:** the AI career path, mapped, from first lesson to first offer.
- **Mission:** help India learn AI faster.
- **Voice (BR-10, 2026-11-14): calm authority.** A senior mentor who has hired AI engineers, not a marketer. Specific over superlative ("22 guided projects reviewed against a rubric", not "tons of projects"). Outcomes before features: what the learner can do or show afterwards. Confident, not loud: no hype words, no countdowns, no "Hurry", no exclamation marks anywhere in the interface, no "Hi!". Plain English and short sentences stay; premium means precise, not complicated. Say what happens next ("Take the 2-minute level check", not "Get started"). No claims without a source and a date.

## Logo

- The wordmark is `public/brand/xplaind-wordmark.png` (with `-dark` for dark pages); the version with the tagline "AI, explained simply." is `xplaind-logo.png`.
- "XPL" and "ND" are ink (#111111 on light, #FAFAFA on dark). "AI" is brand teal: #0E4A50 on light, sea glass #7FD1C7 on dark.
- Square (1:1) versions for profile pictures, app stores and sign-in screens: `xplaind-logo-square.png` (1024 px, white), `-dark` (1024 px, near-black), `-transparent`, and `xplaind-icon-512.png`, the X mark with its teal bar on a dark tile. The browser-tab favicon is separate (FA-1): `src/app/icon.svg`, the bare mark with no tile, which changes colour for light and dark tabs. The dark square sits on deep teal ink (#0A2E33).
- Keep clear space of at least the height of the "X" around it. Never recolour, stretch, outline or put it on a busy picture.

## Colour

Deep teal and brass (BR-10, owner decision 2026-11-14, replacing violet). Low-saturation colour reads as established and premium, and no Indian AI ed-tech brand owns deep teal. One accent does the work; everything else is neutral.

| Role | Tailwind family | Use it for |
| --- | --- | --- |
| Primary | `brand` (deep teal: 700 #0E4A50 for buttons, 800 for links on light; 300 #7FD1C7 "sea glass" for links on dark) | Main buttons, every text link, active and selected states, focus rings |
| Achievement | `brass` (300 #D9B26A on dark or as a fill; 700 for text on light) | Only what a learner earns: readiness scores, certificates, finished roles. Never for buttons or links, never small brass text on white |
| Success | `emerald` | Done, correct. Never for links or buttons |
| Warning | `amber` | In progress, price notes |
| Error | `rose` | Errors, wrong answers, destructive buttons, recording |
| Information | `sky` | Neutral tags such as "worked example" or "docs" |
| Neutral | `zinc` | Text, borders, surfaces |

- Ink (body text and headings) is #0A2E33 on light and #E6EFED on dark. Pages are a warm off-white (#FAF8F4, since UX-19 on 2026-11-27; page banners #F3F0E8) or deep teal-black (#071A1D); cards and product frames stay white, so they stand on the page without lines. The hero sky is a soft mist (#E8F1EF to white). Colour washes never sit behind reading text.
- Lesson headers are one deep teal gradient (#0A2E33 to #0E4A50) for every topic.
- Cards are solid white (`bg-white`, dark `bg-zinc-900`) with a `zinc-200` border. No see-through cards over content.
- Every tool has one soft colour of its own (UX-13, 2026-11-27): teal, sky, emerald, amber or rose, set on its menu item in `src/lib/nav.ts` and drawn from `src/lib/tones.ts`. It colours the icon tile, the product frame and the Explore more tools tile, never the background behind reading text. Topic art (`src/lib/themes.ts`) keeps a hue per topic, but every hue is muted to low saturation so the family sits quietly beside the teal.
- Contrast: teal on white 9.9:1, link teal on white 11.6:1, sea glass on the dark page 10.1:1, brass-700 on white 7.0:1.

## Blog covers

- Every guide's cover is typographic (BL-2): deep teal ground, a two-line cover line (white, then sea glass) in Bricolage Grotesque, "Xplaind guide" small at the bottom left, and one simple line drawing for the topic on the right, with exactly one brass element. No AI-generated illustrations, stock people or gradients.
- Add a row to `scripts/blog-covers.ts` and run `npm run covers` (set `PW_CHROMIUM_PATH` if a browser is pre-installed). Keep the cover line short: cards crop the top and bottom.

## Type

- Headings (h1 to h3) use **Bricolage Grotesque**, a friendly grotesque with optical sizing: big titles get tight, confident letterforms and small headings stay open. It is self-hosted from `@fontsource-variable/bricolage-grotesque`, so builds need no network. Body text and interface use Geist Sans; code uses Geist Mono.
- One scale: display 42 to 68 px (home hero), h1 30 to 44 px, h2 24 to 30 px, h3 18 to 20 px, body 16 px (lessons 18 px), card text 15 px (`text-card`), small 14 px, caption 12 px for dates and sources only.
- Headings are semibold with slightly tight tracking and balanced line breaks. Small labels are sentence case, never capitals.

## Shape

- Three corner sizes: `rounded-full` for buttons, chips and avatars; `rounded-2xl` (16 px) for cards, inputs and tiles; `rounded-3xl` (24 px) for large panels and hero blocks.

## Buttons

- Every button is a pill from `ui.ts` in one of three sizes: small 44 px (`…Sm`), normal 48 px, large 56 px (`…Lg`).
- `primaryButton` (filled deep teal) is the one main action on a screen. `secondaryButton` (white with a neutral edge) is the alternative. `quietButton` and `textLink` are for everything else.
- Nothing a finger taps is under 44 px tall on a phone. Header controls on large screens may be 40 px, and small tag chips inside cards may be smaller as long as they keep space between them.
- Video buttons are secondary with a play icon. Red is never used for a normal action.

## Motion

- GSAP for choreography, Lenis as the only smooth-scroll engine, CSS for hover and focus.
- Motion moves position and angle, never the opacity of text. Everything has a still version under `prefers-reduced-motion`.
- The 3D road (home) and particle sculptures (page headers) are the signature; they never sit behind body text and are hidden on phones when they would push content down.

## Navigation

- The top menu has four entries: Learn, Practice and Career open short menus with a one-line note under each link, and AI tools is a direct link. The section you are in is underlined and announced to screen readers. On phones the same groups fill the screen below the top bar, with the main action first.

## Mascot

- X Bot is deep teal with sea-glass details, a dark face screen and light eyes. It greets a visitor once, ever, and is 48 px on phones so it never covers buttons.
