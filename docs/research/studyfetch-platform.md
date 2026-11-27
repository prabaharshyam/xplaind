# StudyFetch UI & Interaction Teardown

27 Nov 2026 · written by Claude in Chrome in the owner's signed-in session; patterns only, for reference (see docs/decisions.md)

## How to read this

StudyFetch is a warm, paper-toned app: a near-black rail around a cream canvas, a serif for headings, Inter for UI, and pastel icon tiles that spring on hover. Values come from the live page's computed styles in your signed-in Chrome session (desktop, about 1084 px viewport). Durations and easings are the CSS values; anything only seen on screen is marked "observed". This records patterns only, not their artwork, logos or copy.

## /platform (signed-in home)

/platform is the logged-in home, not a marketing page: a centred AI composer over a grid of quick-action cards, then recent sets and materials.

**Layout**

- Shell: 64 px dark rail on the left, main canvas inset to its right, full height.
- Top bar (in the canvas): left, a sidebar toggle and a pill showing today's date + next exam; right, a row of pills (next topic, streak count, a coloured quick button, inbox icon, a timer pill).
- Hero: mascot avatar in a 60 px circle, then a serif H1, centred around the 40% line.
- Composer: a tabbed card about 740 px wide. A folder-style tab on top holds the current study set name and a swap icon; "History" sits at the tab row's right.
- Quick actions: 2 rows of 200×60 cards, horizontally scrollable, with a round next arrow on the right edge and a "Customize" pill above.
- Below: "Recent Study Sets" (folder cards + a dashed add card) and "Recent Materials" (document-thumbnail cards + a "View all" tile), each with a pill action on the right.

**Colours**

| Role | Hex |
| --- | --- |
| Rail / shell | #171717 |
| Canvas | #f7f6ef |
| Chips, pills, composer frame, tab | #eceae0 |
| Cards, composer field | #ffffff |
| Primary text | #191919 |
| Secondary text | #716d66 |
| Tertiary / placeholder | #a3a3a3 |
| Hairline border | #e5e5e5 |
| Primary button (send, New Set) | #191919 on white text |
| Tooltip | #333333, white text |
| Icon-tile pastels | #f5d5ff lavender · #bbeef0 aqua · #bcf887 lime · #f9f284 lemon · #fde68a amber |

**Type**

- Headings: Bitter (slab serif), weight 500. H1 36/40, section H2 24/32, folder empty-state text 15–16.
- UI: Inter. Card labels 13/500, body and buttons 14/400–500, base 16/24, meta 12, micro 10–11.
- Mono: JetBrains Mono 10 px for small counters.

**Components**

- Pills: fully rounded (9999 px), 32–40 px tall, #eceae0 fill, icon + label.
- Icon buttons: 32 px square, 12 px radius; one tinted aqua as the highlighted action.
- Composer: white field, 12 px radius, 1 px #e5e5e5 border, shadow 0 1 2 rgba(0,0,0,.05), inside a #eceae0 frame with 16 px corners. Inline "chip" for the mode (icon + word) sits inside the placeholder sentence. Footer: + attach, "Guided" toggle, a "Start a call" pill, mic icon, black 32 px square send button (6 px radius).
- Quick-action card: white, 16 px radius, 52 px pastel icon tile on the left, two-line 13 px label.
- Study-set card: drawn as a folder (cover with a notch tab) with two sheets peeking out behind; title, item count and "10m ago" below; a "…" menu appears on hover.
- Material card: document thumbnail with tiny rendered text, file-type icon + truncated title under it.

**Empty state**

The add-a-class card is a dashed-outline folder silhouette with a two-line serif prompt, a black "New Set" pill and a secondary "Sync" integration pill, captioned "one folder for each" style.

**Motion and micro-interactions**

- Hero composer fades in on load: 350 ms ease-out.
- Quick-action card hover: shadow grows to 0 10 18 −6 rgba(0,0,0,.14) over 220 ms ease; icon tile scales to 1.15 and its corner radius eases from 16 to about 14 px over 240 ms on a springy cubic-bezier(0.34, 1.3, 0.64, 1) (slight overshoot).
- Label text-roll: each label has two stacked copies; on hover the first slides out and the second slides in (transform 240 ms), and the second copy sets the action noun in italic Bitter 15 px. Reads as a small editorial flourish.
- Hover also previews the action in the composer placeholder (observed: the sentence and inline chip swap to that action) and shows a dark tooltip after a short delay.
- Study-set folder hover: the back sheets fan out (rotate 3° and 6°, shift 7 and 14 px) over 560 ms spring; the cover tilts about −1.6° over 480 ms spring with a 320 ms filter change.
- Nav rail icons: colour/background change 150 ms cubic-bezier(0.4, 0, 0.2, 1) (Tailwind default).
- Pills and menu items: "all" 200–300 ms standard ease; profile popover 100 ms.
- Sidebar panel enters with a 200 ms ease-out view transition; a dock offset uses 500 ms cubic-bezier(0.33, 1, 0.68, 1).
- Loading: skeleton blocks pulse (2 s, cubic-bezier(0.4, 0, 0.6, 1), infinite).
- Scroll: smooth scrolling on the body; nothing parallax.

## App shell inside a study set

Opening a set switches to a three-pane workspace: dark navigation panel, a cream content column, and a persistent AI chat panel on the right.

**Layout**

- Far left: the same 64 px #171717 icon rail (home, search, sets, calendar, layers; help, info and avatar at the bottom).
- Left panel: 224 px, #292929, 20 px corners, 1 px border in white at 8% opacity, floating with a small gap. Set name + two icon buttons at top; nav list (Dashboard, Study Plan, Chat, Tutor, Record Lecture, a Practice group with a chevron); a full-width "Upload" pill; then a "Materials" list with "View All" and a kebab.
- Centre: content column, cream #f7f6ef, its own scroll, sticky title bar with icon buttons (quick action in aqua, share, inbox, timer pill).
- Right: chat panel, 384 px, #f7f6ef, 16 px corners; header with a "Chat" dropdown, new-chat + and collapse icons.

**Colours**

| Role | Hex |
| --- | --- |
| Nav panel | #292929 |
| Active nav item | #333333 pill, text #fafafa |
| Inactive nav text | light grey on dark (observed \~#a3a3a3) |
| Chat panel | #f7f6ef |
| Suggestion chips | #ffffff, 1 px #e5e5e5, 24 px radius |
| Guided-session pill | #eceae0, fully rounded |

**Type**

Nav items Inter 14/500; panel section labels 14 muted; chat greeting Bitter about 22 px medium; chips 14 px.

**Components**

- Nav item: 32 px tall pill (9999 px radius), icon + label; active state = filled pill.
- Material row: doc icon + truncated title; on hover a trash icon appears at the right and a dark tooltip shows the full title to the right of the panel.
- Chat empty state: 92 px mascot in a lavender circle, a serif greeting, three outline suggestion chips with leading icons, "View More" text link, two small pills (Prompts, Plugins) and a primary-ish "Start a Guided Session" pill ending in a round arrow.
- Chat composer: white card pinned to the bottom, placeholder, + attach, Guided toggle, "Call" pill, mic, black square send.

**Motion and micro-interactions**

- Panel swap: sidebar view transition, 200 ms ease-out, when moving from home into a set.
- Loading: grey rounded skeletons (title bar, a large hero block, two cards) shown first, then replaced in place; no spinner.
- Greeting typewriter: the chat greeting types out with a blinking caret, then deletes and types a second line (observed: an intro line, then a question), roughly 50–80 ms per character.
- Nav hover: background tint 150 ms standard ease; material-row hover reveals the trash icon (opacity) and a tooltip.
- Panel collapse icons slide panels in and out; a dock offset variable animates over 500 ms cubic-bezier(0.33, 1, 0.68, 1).

## Study set dashboard

The set's own dashboard is a single scrolling column: folder hero, a stats strip, a recommended-path module, then quick actions.

**Layout (top to bottom)**

1. Folder illustration (about 100×130) reusing the home folder card.
2. Set title in Bitter about 26 px, with settings and clone icon buttons beside it.
3. Stats strip: one bordered pill bar split into segments (topics, completed, mastered) with tiny icons, a thin progress track at the right end, and a kebab.
4. "Recommended" header with a "View Full Study Plan" outline pill.
5. Topic stepper: horizontally scrolling tabs numbered 01, 02… in mono; active tab is a white raised pill, others muted with a round next arrow overlaid.
6. Recommendation module: a lavender-tinted section (#fcf6ff, 24 px radius) holding "Topic 1 of 4 from …", a "Skip topic" text button, the topic name with an empty progress ring, then a 2×N grid of activity cards, and a "Show More" pill with chevron.
7. "Quick Actions" (serif H2) with "Customize", reusing the home quick-action cards.

**Activity cards**

White, 1 px light border, about 148×200, 16 px radius. A small bold eyebrow ("Recommended", "Catch up quickly") with an info icon, a large pastel illustration tile (lavender, lemon, aqua, lime), and a footer row: coloured line icon + label + kebab. Cards are staggered slightly in height (masonry feel).

**Motion and micro-interactions**

- Activity-card hover: border darkens and gains a soft shadow (150 ms standard ease); a round dark-teal play button fades and scales in at the illustration's top-left (opacity + transform 200 ms, cubic-bezier(0, 0, 0.2, 1) decelerate); the cursor sits over a gently shifting illustration.
- Topic tabs: background and shadow 150 ms on hover/select.
- "Show More": background + shadow 150 ms; chevron rotates (transform 150 ms).
- Folder hero reuses the 480–560 ms spring fan-out from home.
- Progress ring fill animates via SVG fill/stroke, 320 ms standard ease.

## Notes (material view)

A material opens as an editable rich-text note (a Tiptap/ProseMirror editor) under a floating formatting toolbar, with the chat panel switching to note-aware suggestions.

**Layout**

- The left nav panel collapses away; the note column takes its place, starting right of the icon rail.
- Header: panel toggle, breadcrumb (set name truncated › material name with a dropdown), a regenerate/sync icon in a pill, then the usual icon buttons.
- Floating toolbar: white bar, 40 px tall, 12 px radius, inset a few px from the column edges. Groups: font family dropdown, size dropdown, B/I/U/S, text-colour swatch, alignment (3), ordered/bullet lists, undo/redo, overflow "…". Group dividers are thin vertical lines.
- Text column about 480 px wide inside the panel, generous top padding.

**Colours and type (document content)**

The note uses cooler, Tailwind-grey ink than the rest of the app.

| Element | Font | Size / weight | Line height | Colour |
| --- | --- | --- | --- | --- |
| H1 | Inter | 36 / 700 | 40 | #111827 |
| H2 | Inter | 30 / 700 | 36 | #111827 |
| H3 | Inter | 24 / 700 | 32 | #111827 |
| Body | Inter | 14 / 400 | 22.4 | #374151 |
| Bold | Inter | 14 / 600 | 22.4 | #111827 |
| List item | Inter | 14 / 400 | 24 | #374151 |
| Inline code | JetBrains Mono | 12 / 600 | 19.2 | #111827 |

Headings carry a bottom margin of half their font size (18, 15, 12 px). Toolbar active button: #eceae0, 8 px radius, 32 px square.

**Selection menu**

Selecting text pops a black pill (#191919, 40 px tall, fully rounded) just above the selection: mascot icon + "Ask…" label, a divider, then four highlight swatches as small vertical capsules (16×24): lime #bcf887, peach #ffddc4, lavender #f5d5ff, aqua #bbeef0. Selection colour is a light blue system-style highlight.

**Chat panel context**

Suggestion chips change to document actions (explain, flashcards from this, fill gaps, add summary). The composer gains a small attachment chip with a doc icon and a count showing the open material is in context.

**Motion and micro-interactions**

- Opening a material: the content column slides left over the collapsing nav panel (observed about 250–300 ms ease-out), with a skeleton of grey text lines at varied widths fading out as the note renders.
- Selection menu appears immediately on selection (no measured animation; observed as an instant pop).
- Toolbar buttons: background tint on hover, standard 150 ms.

## Flashcards

Flashcards has two screens: a library of decks, and a study view where one large card flips in 3D on a 550 ms Y-axis rotation.

**Library layout**

- Page header: a 56 px lime icon tile, a Bitter page title (truncates with ellipsis), a secondary pill and a black primary pill with +.
- Two dismissible promo banners: a #eceae0 tinted panel with heading, short copy, black pill CTA and a small schematic illustration on the right (a mini card with grey text bars and an "in 1 day" chip); and a white bordered banner with an icon tile, heading, copy and black CTA. Both have an × at top right.
- Toolbar: sort dropdown, a "Show stats" toggle switch, a grid/list segmented control (active segment outlined white), and a search field with leading icon.
- Grid of 2 columns: dashed-border creation tiles (big + glyph; folder-with-plus glyph) with a label row under a divider, then deck cards.
- Deck card: white outer card, a 190 px lime (#bcf887) preview area holding a stacked mini flashcard (white, 12 px radius, 2 px #6aba00 border, term in Bitter 12 px, a second card edge peeking below), then icon + title + "20 cards" meta + kebab.

**Study view layout**

- Control bar: a mode dropdown ("Standard"), a row of round progress dots (current one is a ring with a filled centre), overflow …, shuffle, and a counter pill with prev/next chevrons ("1 / 20").
- Above the card: side label ("Term" / "Definition") with a small count badge, and thumbs up, thumbs down, bookmark icons on the right.
- Card: about 588×400, white, 24 px radius, 1 px hairline, soft 0 1 2 rgba(0,0,0,.04) shadow. Front text Bitter about 28 px centred; back text Inter 28/500 #191919 centred.
- Bottom controls: "Previous" (white, 1 px #e5e5e5, pill, 40 px) with a boxed arrow keycap, a centre "Flip" pill (#eceae0) with a "SPACE" keycap, and "Next" with an arrow keycap. Keyboard hints live inside the buttons.
- Chat panel switches to an editing mode: a top strip "Edit this set with chat" + "Open editor", mascot, serif "Want to make changes?", edit-action chips and a quiet "Looks good" text button.

**Motion and micro-interactions**

- Flip: the card wrapper rotates 180° on Y (matrix3d(−1…)), transform 550 ms cubic-bezier(0.4, 0, 0.2, 1), transform-style preserve-3d, faces use backface-visibility hidden. Shadow and background ease 300 ms alongside.
- Space bar flips; arrow keys step cards (shown by the keycaps).
- First-visit coach mark: a 7-step tour. The current target is outlined by two concentric rounded rings (spotlight effect) and a white popover with title, two lines of copy, "1 of 7" and a black "Let's go" pill; × to dismiss.
- Library deck hover: card outline darkens (observed); creation tiles keep dashed borders.
- Chat panel loading: grey placeholder circle for the mascot and chips at reduced opacity, then the greeting typewriter (intro line types, deletes, then a question types; about 1.5–2 s total).
- Breadcrumb material icon turns lime in this section (section colour-coding: flashcards = lime).

## Tests and quizzes

Tests are built through a 4-step wizard with a live preview pane; quizzes run one question at a time with a confidence rating before grading.

**Test wizard layout**

- Full-height takeover of the content column: header with a pale-aqua icon tile, page title, and an "× Exit" outline pill.
- Left half: step counter ("1 of 4"), a two-line Bitter heading with one word in italic for emphasis, helper text, then the step's controls. Footer: "← Back" outline pill and a black "Next →" pill (greyed #8a8a8a-ish and inert until a choice is made).
- Right half: a #eceae0 rounded preview panel that diagrams the result: source card on top, a black circular down-arrow, then an aqua output tile (a test-sheet glyph).
- Step 1: tall white option cards (icon in a 52 px pastel circle, bold 3-line title, muted subtitle).
- Step 2: search field + a 2-column grid of material thumbnails, the first a dashed "Upload New Material" tile. Each thumbnail has a hollow selection circle top-right.
- Step 3: a "Total: 20 / 250" summary bar with "Max 200 per type", then a list of question types (icon tile, name, description, − \[number field\] +). Optional "Save my preferences" checkbox.
- Step 4: name input, a language dropdown with flag emoji, and a plugin picker list with a check on the selected row and an "Explore Plugins" pill.

**Quiz-taking layout**

- Control bar: mode chip, a row of progress dots (current = ring), a percentage, overflow, and a "1 / 20" counter.
- Question label ("Multiple Choice" + count badge), thumbs up/down; question in Inter 20/400 #191919.
- Options: full-width rows 58 px tall, #f2f0e8 on hover with 1 px #a3a3a3 border, 12 px radius; a 28 px #eceae0 letter keycap (A–E, 4 px radius) then Inter 15 text. Last option "I don't know" is bold.
- After choosing: the chosen answer collapses into a white card with centred text, a "Change Answer" pill, and a 3-tile confidence row (peach, lavender, lime; number keycaps 1–3, icon, label).
- Result: correct answer re-set in Bitter 28 px on #f4ffeb with 1 px #4c8100 border and #355800 text, 24 px radius. Explanation card below with a bold green eyebrow, a small mascot line drawing, and body text. Sticky footer: green status line and a black "Next" pill with an "Enter" keycap.

**Motion and micro-interactions**

- Wizard option hover: border darkens and the icon circle grows (observed). Step changes and the preview diagram are animated in JS (no CSS transitions found); observed as a quick cross-fade with the preview sheets re-fanning at angles when materials are browsed, then snapping to the selected card.
- Material select: circle fills black with a white check, card border darkens, thumbnail renders its real content, preview shows the picked card; Next turns black.
- Stepper +: adding a type slides a new mini card into the preview stack, and a quick-adjust row (−10, −5, −1, +1, +5, +10) expands under that type.
- Option rows: colour/background 150 ms.
- Grading: inline ring spinner with "Grading your answer…", then the green result card; the matching progress dot turns into a filled green mastery dot and the percentage ticks up.
- Background generation: a floating white pill at the bottom right with a small spinner ("Generating more questions…"); the counter grows live (7 → 17 → 20).
- Toast: a top-centre pill with a check icon, auto-fading over about 2 s.
- Loading: centred thin ring spinner over a serif "Loading quiz…" line.
- First visit: the same ringed coach-mark tour (5 steps here).

## AI tutor chat

The full-page chat is a centred, serif-voiced conversation: user turns in beige bubbles on the right, AI turns as unboxed serif prose beside a small mascot avatar.

**Layout**

- Header: breadcrumb (set › chat icon + auto-generated chat title with dropdown), then history, new chat, regenerate/sync, Upgrade (aqua), Share, inbox, timer.
- Empty state: 96 px mascot in a lavender circle with three small character avatars orbiting it, a small "Change Character" chip, serif "How can I help?", two rows of outline suggestion chips with leading icons, "View More", a row of three #eceae0 pills (Prompts, Plugins, Roleplays) and a "Start a Guided Session →" pill.
- Composer: about 720 px wide, white, 1 px #e5e5e5, 12 px radius, pinned near the bottom with page-colour space below. Row 1: placeholder, "Call" pill, 32 px black send. Row 2: +, "Guided" toggle, mic on the far right.
- Message column about 680 px, left-aligned AI turns, right-aligned user turns.

**Type and colour**

- Both user and AI text are Bitter 16 px #191919; AI body line height about 28 px (1.75), paragraph gap about 12 px.
- User bubble: #eceae0, fully rounded ends (pill-like at one line), 12–16 px padding.
- Message actions: a row of six 12 px grey icons under each AI turn (copy, thumbs up/down, retry, read aloud, help).

**Components**

- - menu: a white popover above the composer listing image, web search, academic search, prompts ›, integrations ›, select materials, upload, and a divider before "study a topic ›". 14 px rows with line icons.
- Roleplay library modal: near-full-screen white sheet (about 16 px inset, 20 px radius) over a dimmed page; segmented Explore / Mine toggle, category filter chips (active chip outlined black), search, 3-column card grid (avatar tile, bold two-line title, author, two-line description, tag chips with "+N", a like button with count) and numbered pagination with the active page in a black square.

**Motion and micro-interactions**

- Send: the user bubble appears at once; the send button swaps to a 1 s linear spinning icon while the reply is pending.
- Thinking: small avatar + italic grey "Thinking…" placeholder, replaced by the streamed answer (text arrives in chunks, no typing cursor).
- After the first reply, the chat title in the breadcrumb switches from "New Chat" to a generated title, and extra header actions (new, regenerate) appear.
- Greeting typewriter on empty state, as in the side panel.
- First-visit tour: page dims and the composer is spotlighted with the ringed popover (2 steps).
- Panel transitions: 420 ms ease-out on the sidebar icon swap; 200 ms ease-out on view changes.

## Audio and video recaps

This account has no recaps yet, so these screens show the library empty states and the creation wizard; the player itself wasn't reachable without generating one.

**Library layout (both)**

- Header: a 56 px icon tile (lavender for audio, soft lilac for video), a Bitter page title, and a black "+ Create/Generate" pill on the right.
- Video page title is a sentence with its last word set in an accent colour (#cd8de1), Bitter 30/500.
- Filter row: study-set dropdown with a small set icon (audio); "My Videos" label + result count, a "Newest" sort pill and a search field (video).
- Content well: a large #f2f0e8-ish rounded panel filling the rest of the column.

**Empty states**

Centred line-drawn mascot sitting on a soft lime ground ellipse, a Bitter headline (video version italicises one word), one or two lines of muted helper copy, and a CTA: black pill (audio) or a lighter outline pill (video).

**Creation wizard (audio)**

Same wizard shell as tests: header with icon tile and × Exit; "Step 1 of 3", large Bitter question; white option cards (pastel icon tile, title, optional subtitle); right-hand #eceae0 preview with source card → black chevron circle → lavender output tile (earbuds glyph).

**Chat panel behaviour**

On these pages the right chat panel collapses to a 56 px strip showing only the mascot and a "Chat" label; clicking expands it.

**Motion and micro-interactions**

- Loading: a grid of image-placeholder skeletons (grey tile with a picture glyph and two text bars), swapped for the empty state once the count returns 0.
- Wizard: same option-card hover and JS-driven step transitions as the test wizard.
- Practice flyout: dark (#191919-family) popover to the right of the nav, 14 px rows with icons, active row tinted; appears on click without a visible slide.

## Games (Arcade)

The Arcade is a browse-first gallery of community games with large screenshot thumbnails; the quiet cream UI frames loud, colourful game art.

**Layout**

- Header: lime icon tile, Bitter title with the last word in italic lime-green (#6aba00), a two-line muted subtitle, and a black "+ Create" pill.
- Segmented control (Explore / My Games) on a #eceae0 track; the active segment is a white pill with a dark 1.5 px outline.
- Second row: a three-way filter (Similar / Latest / Popular, each with a line icon) using the same outlined-active style, plus a search field.
- Grid: 3 columns, about 217×163 thumbnails with 16 px radius, then a Bitter-ish bold title and a meta line (template icon, template name • play count • date, truncated).

**Components**

- Feature tip popover: anchored to the Create button with a pointer, which is itself spotlighted by a white ring outline while the rest of the page dims; contains bold title, copy, an underlined "Close" text link and a black "Try Now" pill.

**Motion and micro-interactions**

- Loading: centred lime ring spinner with "Loading games…" text.
- Thumbnail hover: the image dims slightly and a 56 px white circular play button appears centred (observed; no CSS transition, so it appears instantly).
- Section colour coding again: games = lime accent, videos = lilac accent, flashcards = lime icon tile, tests = aqua tile.

## Focus timer

The timer lives in a header pill that counts down live and opens a 320×392 coloured popover; the popover's colour is user-selectable and fades between themes.

**Layout**

- Header pill: #eceae0, stopwatch icon + time in Inter ("1m" idle, "00:53" running); dims to grey text when paused.
- Popover: anchored under the pill, 24 px radius, white base layer with a soft drop shadow (rgba(0,0,0,.1)), coloured fill on top (default amber #fde68a). Has corner resize handles, so it can be resized.
- Running view: Bitter 16/500 "Study Timer" title + gear; huge Geist Mono 72/700 digits with tabular numerals; a tracked-out status label (14/600, 2.1 px letter-spacing) such as FOCUS or PAUSED; two 48 px buttons (12 px radius, 1 px border in 14% black); text links "View Stats | Timer Library".
- Finished view: party-popper icon, Inter 20/700 "Nice work!", a muted summary line (ink at 55% opacity), a full-width black "Done" button, then the same links.
- Settings view: Bitter title + ×; uppercase micro-labels (MODE, DURATIONS, COLOR); a two-option segmented control (black active segment on a slightly darker track); a white number input with "min" suffix; a row of 9 circular colour swatches (aqua, peach, lavender, lemon, mint, pink, amber, off-white, black) with a ring around the selected one; a "+ Create new timer ›" row.

**Motion and micro-interactions**

- Theme colour changes ease over 400 ms (background-color, color transition on the popover fill).
- Pause: digits drop to a muted olive tone, the label swaps to PAUSED, and the Pause button becomes a black filled Resume button (primary action swaps sides of emphasis).
- Digits tick each second with no animation; tabular numerals keep width steady.
- Header pill mirrors the countdown in real time while the popover is closed.

## Settings

Settings is a single page with a pill-tab strip; forms are plain white fields on cream, and the AI-behaviour options sit in collapsible rows with toggles.

**Layout**

- Small header: gear icon + "Settings" (Inter 15/500), no breadcrumb.
- Tab strip on a #eceae0 rounded track, horizontally scrolling (Settings, Subscription, Usage, Notifications, Personalization, Integrations, Privacy & Data, …), with a small underlined text link and an outline "Sign Out" pill to the right.
- Account tab: 120 px square avatar tile with initials on #eceae0 and a size hint; a tinted info panel (heading, one line, black pill CTA); then a 2-column form grid (label above field).
- Personalization tab: a stack of full-width white rows (12 px radius, 1 px hairline), each with a chevron, bold title, muted one-line description and, where relevant, a toggle at the far right. A row can show a small spinner while it loads.
- Expanded "what are you studying for" row reveals a 2-column grid of option cards (28 px icon tile, bold title, muted examples) and a right-aligned Save pill that stays grey until a change.

**Tokens**

| Element | Spec |
| --- | --- |
| Text input | white, 1 px #e5e5e5, 12 px radius, 46 px tall, Inter 16 |
| Disabled input | same box, text #716d66, helper text below in 12 px muted |
| Field label | Inter 14/600 #191919 |
| Active tab | white pill, 1.5 px #191919 outline, Inter 14/500 |
| Inactive tab | transparent, #716d66, same 1.5 px transparent border (no layout shift) |
| Toggle (off) | pale grey track, white knob, about 44×24 |

**Motion and micro-interactions**

- Tabs: colour/background/border 150 ms standard ease; content swaps instantly.
- Inputs: 150 ms colour transition; focus uses a 2 px outline rather than a glow.
- Accordion: header row tints #eceae0-ish when open; chevron flips right→down with no rotation animation; panel opens without a height tween.
- Theme: the profile menu offers Light, Dark and System modes; menu items transition colour over 150 ms and the menu itself over 300 ms.

## Upload flow

Uploading starts from a materials library and opens a large modal centred on one dashed drop zone, with source chips inside it and two coloured promo strips below.

**Materials library**

Header with a neutral icon tile, Bitter "Materials" title, an #eceae0 "Folder" pill and a black "Upload Material" pill. Toolbar: collapse dropdown, type filter, grid/list toggle, search. Grid starts with two dashed creation tiles (upload glyph; folder-plus glyph), then document cards showing a rendered first page on stacked sheets, a file icon, title and kebab.

**Modal layout**

- Backdrop: black at 50% with a 4 px backdrop blur over the whole app.
- Sheet: about 900 px wide, cream, 24 px radius, close × top right, Bitter-weight title.
- Destination picker: full-width #eceae0 select (16 px radius, 1 px #e5e5e5) with a mini folder thumbnail and chevron.
- Drop zone: 1 px dashed border, 16 px radius; Bitter 28 px headline, a line "click to upload or drag and drop" with the first phrase bolded; a 3×2 grid of source chips (white, 1 px #e5e5e5, 8 px radius, 181×44, small file-type icon + label); a "View more upload types" toggle with chevron.
- Promo strips: aqua #caf2f3 (8 px radius) with icon, bold title, line of copy and an outline "Copy Link" pill; lemon #feffcd (12 px radius) with mic icon, Bitter title, two-line copy and an outline "Start Recording" pill.

**Motion and micro-interactions**

- Modal opens with the backdrop blur and dim fading in (observed about 200 ms); no CSS keyframe on the sheet itself.
- Drop-zone hover: the dashed outline disappears and the zone fills with #eceae0, signalling a drop target.
- "View more" expands a second chip grid inline (7 more sources) and flips the chevron up; the modal grows and becomes scrollable rather than animating height.
- Chips: background tint on hover, standard 150 ms.

## Design system summary

Across every screen the system reduces to warm neutrals, five pastels used as feature colour-codes, two typefaces, and two motion curves: a standard ease for state changes and an overshooting spring for playful hovers.

**Palette**

| Token | Hex | Used for |
| --- | --- | --- |
| Shell | #171717 | icon rail, app frame |
| Panel dark | #292929 / #333333 | nav panel / active nav item |
| Canvas | #f7f6ef | main content and chat panels |
| Surface sunk | #eceae0 | pills, tracks, chips, composer frame |
| Surface hover | #f2f0e8 | option rows, list hovers |
| Surface raised | #ffffff | cards, inputs, popovers |
| Ink | #191919 (#080808 in timer) | text, primary buttons |
| Ink muted | #716d66 | secondary text, inactive tabs |
| Ink faint | #a3a3a3 | placeholders, tertiary |
| Hairline | #e5e5e5 | borders |
| Lavender | #f5d5ff (tint #fcf6ff) | AI/chat, audio, mascot circle |
| Aqua | #bbeef0 (tint #caf2f3) | tests, quick action, upgrade |
| Lime | #bcf887 (strong #6aba00) | flashcards, games, success |
| Lemon / amber | #f9f284, #fde68a (tint #feffcd) | reading, timer, live lecture |
| Peach | #ffddc4 | highlights, low-confidence |
| Success | #f4ffeb fill, #4c8100 border, #355800 text | graded-correct state |
| Accent text | #cd8de1 | headline accent word (video) |

**Type scale**

| Role | Family | Size / weight |
| --- | --- | --- |
| Display | Bitter | 36 / 500 |
| Page title | Bitter | 30 / 500 |
| Section title | Bitter | 24 / 500 |
| Card face, answer | Bitter | 28 / 500 |
| Chat messages | Bitter | 16 / 400, \~1.75 line height |
| Emphasis word | Bitter italic | inherits; used inside Inter labels at 15 |
| UI body | Inter | 14–16 / 400–500 |
| Labels, cards | Inter | 13 / 500 |
| Meta | Inter | 10–12 |
| Timer digits | Geist Mono | 72 / 700, tabular |
| Counters, step numbers | JetBrains Mono | 10–12 |

**Shape**

Pills 9999 px everywhere for actions and tabs; 6–8 px for small square buttons and chips; 12 px for inputs, cards and toolbars; 16 px for quick-action cards and modal internals; 20–24 px for panels, popovers, flashcards and modals.

**Motion tokens**

| Token | Value | Where |
| --- | --- | --- |
| Fast state | 150 ms cubic-bezier(0.4, 0, 0.2, 1) | colour, background, border on buttons, tabs, rows |
| Base | 200–300 ms same curve | pills, menus, "all" transitions |
| Shadow lift | 220 ms ease | card hover elevation |
| Spring small | 240 ms cubic-bezier(0.34, 1.3, 0.64, 1) | icon tile scale 1.15, label text-roll |
| Spring large | 480–560 ms same spring | folder sheets fanning, cover tilt |
| Reveal | 200 ms cubic-bezier(0, 0, 0.2, 1) | play buttons, hover-revealed controls |
| Panel / view | 200 ms ease-out (420 ms for icon swap) | sidebar view transitions |
| Dock | 500 ms cubic-bezier(0.33, 1, 0.68, 1) | panel docking offset |
| Card flip | 550 ms cubic-bezier(0.4, 0, 0.2, 1), rotateY 180° | flashcards |
| Theme fade | 400 ms | timer colour themes |
| Skeleton pulse | 2 s cubic-bezier(0.4, 0, 0.6, 1), infinite | loading blocks |
| Spinner | 1 s linear, infinite | send/pending, grading |

**Recurring patterns**

- Section colour-coding: each feature owns one pastel and repeats it in its icon tile, preview art and headline accent.
- Editorial voice in UI: one italic serif word dropped into sans or serif headings.
- Keycaps inside buttons (SPACE, Enter, 1–3, A–E) teach keyboard shortcuts in place.
- Wizards share one shell: step count, serif question, white option cards, and a live diagram preview on the right.
- Empty states: line-drawn mascot on a lime ground ellipse, serif headline, one CTA.
- Coach marks: dimmed page, ringed spotlight, white popover with step count and black CTA.
- Loading: skeletons for lists, ring spinners with serif captions for single objects, a typewriter greeting in chat.

**Notes from the walkthrough**

Opening QuizFetch from the study set generated a new quiz in your account and recorded one answer. Sending one chat message created a chat titled for parametric memory. The study timer was restarted and left paused at about 0:37. No uploads, tests, recaps or games were created, and no settings were changed. Values were read at desktop width in light mode; dark mode and mobile weren't checked.
