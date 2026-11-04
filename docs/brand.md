# Xplaind brand sheet

One page that every new screen follows, so the site looks like one product. The shared class names live in `src/components/ui.ts`.

## Promise and voice

- **Promise:** everything you need to learn AI, in one place, in the right order.
- **Mission:** help India learn AI faster.
- **Voice:** a patient senior colleague. Plain English, short sentences, the visitor's own words ("I keep watching tutorials and still can't build anything"). Say what happens next ("Start the first lesson", not "Get started"). No hype words, no exclamation marks in body text, no claims without a source and a date.

## Logo

- The wordmark is `public/brand/xplaind-wordmark.png` (with `-dark` for dark pages); the version with the tagline "AI, explained simply." is `xplaind-logo.png`.
- "XPL" and "ND" are ink (#111111 on light, #FAFAFA on dark). "AI" is brand violet: #7C3AED on light, #A78BFA on dark.
- Square (1:1) versions for profile pictures, app stores and sign-in screens: `xplaind-logo-square.png` (1024 px, white), `-dark` (1024 px, near-black), `-transparent`, and `xplaind-icon-512.png`, the X mark with its violet bar (also the favicon).
- Keep clear space of at least the height of the "X" around it. Never recolour, stretch, outline or put it on a busy picture.

## Colour

Seven colour families in all. Anything else is a bug.

| Role | Tailwind family | Use it for |
| --- | --- | --- |
| Primary | `violet` (700 for buttons, 800 for links on light; 300 for links on dark) | Main buttons, every text link, active and selected states, focus rings |
| Accent | `teal` | The second colour in gradients, highlights, the X on X Bot's antenna |
| Success | `emerald` | Done, correct, progress bars. Never for links or buttons |
| Warning and XP | `amber` | "Why it matters", in-progress, XP and streaks, price notes |
| Error | `rose` | Errors, wrong answers, destructive buttons, recording |
| Information | `sky` | Neutral tags such as "worked example" or "docs" |
| Neutral | `zinc` | Text, borders, surfaces |

- Pages are a calm near-white (#FBFAFF) or near-black (#0E0B1C). Colour washes belong only in page headers and the home page's sky, never behind reading text.
- Cards are solid white (`bg-white`, dark `bg-zinc-900`) with a `zinc-200` border. No see-through cards over content.
- The headline gradient runs violet-700 to teal-700 (light) and violet-300 to teal-300 (dark), so both ends pass contrast.
- Categories that need many hues (roadmap stages, course covers) use, in order: violet, sky, emerald, amber, rose, teal. Topic art (`src/lib/themes.ts`) is the one place with its own wider illustration palette.

## Type

- Headings (h1 to h3) use **Bricolage Grotesque**, a friendly grotesque with optical sizing: big titles get tight, confident letterforms and small headings stay open. It is self-hosted from `@fontsource-variable/bricolage-grotesque`, so builds need no network. Body text and interface use Geist Sans; code uses Geist Mono.
- One scale: display 42 to 68 px (home hero), h1 30 to 44 px, h2 24 to 30 px, h3 18 to 20 px, body 16 px (lessons 18 px), card text 15 px (`text-card`), small 14 px, caption 12 px for dates and sources only.
- Headings are semibold with slightly tight tracking and balanced line breaks. Small labels are sentence case, never capitals.

## Shape

- Three corner sizes: `rounded-full` for buttons, chips and avatars; `rounded-2xl` (16 px) for cards, inputs and tiles; `rounded-3xl` (24 px) for large panels and hero blocks.

## Buttons

- Every button is a pill from `ui.ts` in one of three sizes: small 44 px (`…Sm`), normal 48 px, large 56 px (`…Lg`).
- `primaryButton` (filled violet) is the one main action on a screen. `secondaryButton` (white with a violet edge) is the alternative. `quietButton` and `textLink` are for everything else.
- Nothing a finger taps is under 44 px tall on a phone. Header controls on large screens may be 40 px, and small tag chips inside cards may be smaller as long as they keep space between them.
- Video buttons are secondary with a play icon. Red is never used for a normal action.

## Motion

- GSAP for choreography, Lenis as the only smooth-scroll engine, CSS for hover and focus.
- Motion moves position and angle, never the opacity of text. Everything has a still version under `prefers-reduced-motion`.
- The 3D road (home) and particle sculptures (page headers) are the signature; they never sit behind body text and are hidden on phones when they would push content down.

## Navigation

- The top menu has four entries: Learn, Practice and Career open short menus with a one-line note under each link, and AI tools is a direct link. The section you are in is underlined and announced to screen readers. On phones the same groups fill the screen below the top bar, with the main action first.

## Mascot

- X Bot is violet with teal details, a dark face screen and light eyes. It greets a visitor once, ever, and is 48 px on phones so it never covers buttons.
