---
name: Cleanly
description: Soft Prism OS — paper-and-glass desktop utility where pigment lives in capsules and live cards, not in chrome.
colors:
  ink: "#0f1218"
  ink-2: "#3c4250"
  ink-3: "#5b6270"
  on-ink: "#ffffff"
  paper: "#f2f3f6"
  surface: "#ffffff"
  surface-2: "#f7f8fb"
  raised: "#ffffff"
  raised-2: "#f3f4f7"
  line: "#e2e5ea"
  line-soft: "#eef0f3"
  hair: "rgba(255, 255, 255, 0.9)"
  card: "rgba(255, 255, 255, 0.84)"
  track: "#e8eaee"
  scrim: "rgba(15, 18, 24, 0.28)"
  grid: "#e5e7ec"
  blue: "#2b4cff"
  violet: "#8a5cff"
  pink: "#ff5d8f"
  amber: "#ffb547"
  mint: "#1fbf8f"
  danger: "#d6334f"
  link-hover: "#1a2fb0"
  prism-a: "#6d7bff"
  prism-b: "#a77bff"
  prism-c: "#ff8fc8"
  graphite-paper: "#161618"
  graphite-ink: "#f5f5f7"
  graphite-ink-2: "#c7c7cc"
  graphite-ink-3: "#a8a8af"
  graphite-on-ink: "#161618"
  graphite-surface: "#202024"
  graphite-surface-2: "#1b1b1e"
  graphite-raised: "#2a2a2e"
  graphite-raised-2: "#36363c"
  graphite-line: "rgba(255, 255, 255, 0.08)"
  graphite-hair: "rgba(255, 255, 255, 0.08)"
  graphite-link: "#c5cbff"
  graphite-danger: "#ff6b81"
  graphite-mint: "#30d158"
typography:
  display:
    fontFamily: "Unbounded Variable, Unbounded, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Unbounded Variable, Unbounded, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 500
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Onest Variable, Onest, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Onest Variable, Onest, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "JetBrains Mono Variable, JetBrains Mono, ui-monospace, monospace"
    fontSize: "11.5px"
    fontWeight: 400
    letterSpacing: "0.14em"
  hero-numeral:
    fontFamily: "Unbounded Variable, Unbounded, system-ui, sans-serif"
    fontSize: "clamp(60px, 5.6vw, 88px)"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.045em"
rounded:
  xs: "6px"
  sm: "7px"
  md: "12px"
  lg: "14px"
  xl: "18px"
  card: "28px"
  live: "26px"
  pill: "999px"
spacing:
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "18px"
  xl: "24px"
  panel: "22px 24px"
  main: "0 28px 24px 8px"
  titlebar: "44px"
  nav: "236px"
components:
  button-default:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "40px"
  button-default-hover:
    backgroundColor: "{colors.raised}"
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "40px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.pill}"
    height: "40px"
  button-cta:
    backgroundColor: "rgba(190, 196, 225, 0.55)"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 22px 0 8px"
    height: "56px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "11px 14px"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "22px 24px"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "40px"
  nav-item-active:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "40px"
  chip:
    backgroundColor: "#eef0f6"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.pill}"
    padding: "0 9px"
    height: "22px"
  toast:
    backgroundColor: "rgba(15, 18, 24, 0.92)"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    padding: "12px 16px 12px 12px"
---

# Design System: Cleanly

## Implementation Center adaptations

This product is **Implementation Command Center**, a desktop-first web ops tool for Web Scribble launches. It uses the Cleanly visual world. It is not Cleanly the product.

- **No titlebar.** Browser chrome is enough. Nav and content float in a 14px gutter on the paper.
- **Floating panels.** Sidebar, page chrome (`.icc-chrome`), and filter workbenches (`.icc-workbench`) are glass cards. Project cards and empty stages sit on the paper — never nested inside another card.
- **Admin type.** Source Sans 3 is the work face: 15px / 1.55 body, 22px / 600 screen titles, `-0.018em` tracking. Unbounded stays on the brand wordmark and rare numerals only. JetBrains Mono stays on metadata.
- **No Flow / no bubble physics.** Background is CSS Dots (light) and Backlight Glow (Graphite).
- **Live cards** belong on Dashboard stats only. Project cards stay frosted `.card-w`.
- **Lucide** is allowed inside dense boards (Launch Board, notes, pathway) until those icons are redrawn as duotone sprites. Chrome, empty states, and signature buttons use the Cleanly sprite.
- **Accent picker is gone.** Theme is Light / Graphite / System. `--color-accent` bridges to Brand Blue.
- **One spinning CTA per region**, currently New Project. Primary buttons stay ink capsules.
- **Mobile** uses a capsule `.fx-dock`, not a hidden nav.

Kit CSS lives in `src/design-system/css/` (tokens → components → layouts → icc). React wrappers in `src/components/ui/` keep existing ICC props and emit Cleanly classes.

## Overview

**Creative North Star: "The Soft Prism OS"**

Cleanly looks like a well-made desktop utility, not a marketing site and not a dashboard skin. The window is cool paper. Surfaces are frosted glass. Type is tight Unbounded for names and big numbers, Onest for reading, JetBrains Mono for metadata. Color is a thin prism ribbon — blue into violet into pink — used on a handful of objects that deserve it: the brand spark, the Clean capsule, live-card pigment, status tags.

Light mode is the original look. Dark mode is a named theme, **A · Graphite**: near-black paper (`#161618`), floating vibrancy sidebar, inset hairlines, and a slow backlight that pools behind the UI. Graphite is not inverted light. Cards stay tonal; the prism ribbon stays saturated.

Motion is one springy ease, short press feedback, a blur-rise entrance, and a few authored loops (spinning glass rims, drifting live-card blobs, cosmic-wind mist). Loops stop under `prefers-reduced-motion`. Full timing lives in [MOTION.md](MOTION.md).

**Key Characteristics:**
- Paper canvas, frosted cards, hairline borders, a 1px top-edge highlight
- Pigment concentrated in capsules, live cards, and tags — never in chrome
- Unbounded + Onest + JetBrains Mono
- Capsule buttons; 28px cards; spinning conic rims on signature controls
- Light original, Graphite dark with backlight glow
- One ease: `cubic-bezier(0.2, 0.8, 0.2, 1)`

## Colors

A cool-neutral paper stack with one prism accent family. Status colors (mint, amber, danger) are semantic only.

### Primary

- **Brand Blue** (`#2b4cff`): links, eyebrows, active nav icons, focus rings. The calm end of the prism.
- **Prism Blue** (`#6d7bff`): gradient start on chips, checkboxes, toggles, CTA discs — slightly lighter than Brand Blue so glass highlights still read.
- **Prism Violet** (`#8a5cff` / `#a77bff`): middle of the ribbon; brand mark, live-card accents, selected chips.
- **Candy Pink** (`#ff5d8f` / `#ff8fc8`): the hot end of the ribbon; junk bars, hot bubbles, CTA rim, reclaim badges.

**The Quiet Chrome Rule.** The prism occupies a small fraction of any screen. Window chrome, cards, lists, and default buttons stay paper/ink. If a layout is colorful everywhere, it is no longer Cleanly.

**The Ribbon Rule.** Brand gradients always run `#6d7bff → #a77bff → #ff8fc8` (or the `#2b4cff → #8a5cff → #ff5d8f` numeral clip). Do not reverse it, do not add a fourth hue, do not use a purple glow instead of the ribbon.

### Secondary

- **Mint** (`#1fbf8f`; Graphite `#30d158`): safe, done, connected, live-dot.
- **Amber** (`#ffb547`): review, busy, medium risk, star ratings.
- **Danger** (`#d6334f`; Graphite `#ff6b81`): keep/high, destructive confirms, error toasts.

### Neutral

- **Ink** (`#0f1218`): primary text, primary button fill.
- **Ink 2** (`#3c4250`): secondary text, nav labels at rest, body on paper.
- **Ink 3** (`#5b6270`): metadata, hints, placeholders-adjacent.
- **Paper** (`#f2f3f6`): window canvas.
- **Surface** (`#ffffff`): solid cards, active nav pill.
- **Surface 2** (`#f7f8fb`): wells, stats, list rows, input fills in Graphite.
- **Raised / Raised 2** (`#ffffff` / `#f3f4f7`): resting and hover controls.
- **Line / Line Soft** (`#e2e5ea` / `#eef0f3`): card edges vs. inner row dividers.
- **Hair** (`rgba(255,255,255,0.9)`): inset top-edge highlight on glass.
- **Track** (`#e8eaee`): empty bars.
- **Card fill** (`rgba(255,255,255,0.84)`): frosted `.card-w` so mist/glow shows through.

### Graphite (dark)

- **Graphite Paper** (`#161618`): window.
- **Graphite Ink** (`#f5f5f7` / `#c7c7cc` / `#a8a8af`): text stack. Ink 3 is tuned to ~6.7:1 on surface.
- **Graphite Surface** (`#202024` → `#1b1b1e` gradient on cards).
- **Graphite Raised** (`#2a2a2e` / `#36363c`).
- **Graphite Line / Hair** (`rgba(255,255,255,0.08)`).
- **On-ink** flips to `#161618` so primary buttons become light-on-dark inverted: pale fill, dark label.
- **Link** lifts to `#c5cbff`. Hero numerals use `#f5f5f7 → #c3c9ff → #b48cff → #ff9fcf`.

**The Graphite Is Not Invert Rule.** Do not derive dark by flipping light greys. Recolor chrome to Graphite tokens; keep prism fills; add inset hairlines and a coloured underglow on live cards.

## Typography

**Display Font:** Unbounded Variable (fallback Unbounded, system-ui)
**Body Font:** Onest Variable (fallback Onest, system-ui)
**Label/Mono Font:** JetBrains Mono Variable (fallback JetBrains Mono, ui-monospace)

**Character:** Unbounded is slightly wide, slightly sporty, never condensed-tech. It carries screen titles and big numbers at medium weight. Onest is the quiet reader. Mono is for things a technician would glance at: sizes, paths, eyebrows, kbd, section labels.

### Hierarchy

- **Hero numeral** (Unbounded 600, `clamp(60px, 5.6vw, 88px)`, line-height 1, tracking `-0.045em`, tabular nums, prism text-clip): reclaimable bytes, tip amounts. Unit is `0.42em` / weight 500.
- **Display** (Unbounded 500, 28px, tracking `-0.04em`): screen titles in `.screen-head h1`. Brand wordmark is 20px / `-0.02em`.
- **Headline** (Unbounded 500, 18px, `-0.02em`): empty-state titles, panel names at 15px, dock numbers at 26px.
- **Title** (Onest 600, 14–15px, tracking `-0.01em`): row titles, CTA label, live-card names.
- **Body** (Onest 400–550, 14px, line-height 1.5–1.6, max ~560px / 60ch on subtitles): screen sub, empty copy, chat bubbles.
- **Label** (Mono 400, 10.5–12px, tracking `0.14em`, often uppercase): `.eyebrow`, `.nav-label`, `.fx-stat span`, kbd 11px.

**The Mono Label Rule.** Eyebrows, section labels, byte sizes, keyboard hints, and breadcrumbs-as-metadata use JetBrains Mono. Do not set those in Onest, and do not set body copy in Mono.

**The Tight Display Rule.** Unbounded always tracks negative (`-0.02em` to `-0.05em`). Never letterspace display type out. Weight stays 300–600; 800+ is not this system.

## Layout

Desktop utility shell, not a marketing grid.

- **Window:** column flex, `100vh`, overflow hidden. Background is a named canvas (Mist, Grid, Dots, Grain) behind the chrome.
- **Titlebar:** 44px, drag region, 20px horizontal pad. macOS leaves 92px for traffic lights; Windows leaves 150px for caption buttons. Graphite pushes titlebar content to 264px so it clears the floating nav.
- **Body:** sidebar + main, `min-height: 0`.
- **Sidebar:** 236px, 14px horizontal pad, 2px item gap. Brand row 48px. Nav items 40px × 12px radius. Footer is a disk card + three mini items (Tip, Feedback, Settings).
- **Main:** `padding: 0 28px 24px 8px`, column, gap 18px, vertical scroll.
- **Screen:** column, gap 18px, min-height 100%. Head is baseline-aligned title + grow + actions.
- **Home:** `hero + map` row (`min-height: 392px`, gap 18px); map is `clamp(340px, 38%, 460px)`. Below, four live cards (`repeat(4, minmax(0, 1fr))`, gap 16px). At 1040px, live cards become 2×2.
- **Files map:** `1fr + 340px`, stage height 560px. Stacks at 1100px.
- **System splits:** Speed is `minmax(0, 380px) + 1fr`. Settings is two columns. Support/Feedback are ~1:1.08 and 1.45:1. Stack ~980–1080px.
- **Rhythm:** 18px is the screen gap. 16px is card-to-card. Panel padding is 22×24. List rows are 12px vertical. Sticky docks are 76px min-height capsules.

**The Eighteen Rule.** Sibling sections on a screen are 18px apart. Do not invent a second vertical rhythm (24/32/48) for app chrome. Save larger gaps for inside a hero (20–32px).

**The Shell First Rule.** Every app screen is titlebar + 236px nav + padded main. Do not hide the nav, do not use a top tab bar, do not full-bleed content to the window edge except the background layer.

## Elevation & Depth

Depth is **tonal glass**, not Material shadows. Resting surfaces are almost flat. A 1px inset hairline (`inset 0 1px 0 var(--hair)`) plus a diffuse drop (`0 24px 60px rgba(15, 18, 24, 0.06)`) is the card. Hover adds a slightly tighter, closer shadow (`0 6px 18px` / `0.08`). Live cards and Graphite add a coloured underglow.

Mist, dots, and grain show through `--card` at 84% white. That translucency is the material.

### Shadow Vocabulary

- **Card rest** (`0 24px 60px rgba(15, 18, 24, 0.06)`): `.card-w`.
- **Control rest** (`0 1px 2px rgba(15, 18, 24, 0.05)`): default buttons.
- **Control hover** (`0 6px 18px rgba(15, 18, 24, 0.08)`): buttons, chips.
- **Active nav** (`0 1px 2px / 0 6px 18px` at 0.08 / 0.06): selected `.nav-item`.
- **CTA** (`0 1px 2px` + `0 10px 30px rgba(91, 95, 224, 0.16)`; hover 40px / 0.24): coloured ambient, still soft.
- **Live card** (`inset 0 1px 1px rgba(255,255,255,0.4)` + `0 18px 40px var(--sh)`): pigmented drop matching the card hue.
- **Toast** (`0 16px 40px rgba(15, 18, 24, 0.3)`): the one truly dark lift, because the toast itself is ink.
- **Graphite card** (`inset 0 1px 0 hair` + `0 1px 2px rgba(0,0,0,0.4)` + `0 24px 60px rgba(0,0,0,0.35)`).
- **Graphite nav** (`backdrop-filter: blur(30px) saturate(1.6)` + hairline + the Graphite drop).

**The Hairline Rule.** Every raised Graphite surface and every glass light surface gets `inset 0 1px 0 var(--hair)`. Skip it and the material goes plastic.

**The Flat-By-Default Rule.** Lists, settings rows, and ghost buttons have no drop shadow at rest. Shadow appears for cards, selected pills, hover, and the dock.

## Shapes

A language of **soft rectangles and true capsules**.

- **Cards:** 28px (`--radius`). Live cards 26px. Disk widget 18px. Inner wells and duplicate groups 16–18px.
- **Pills:** 999px for buttons, CTA, segmented, toggles, toasts, docks, search, filter chips, tags, breadcrumbs.
- **Icons wells:** 12px (chip-ico, nav-adjacent), 10px on glass-ico, 18px on empty-state wells, 22px on assistant orb.
- **Inputs:** 14px. Checkboxes: 7px rounded square. Radios: circle.
- **Brand mark:** a four-point spark (the Unbounded-adjacent glint) filled with the prism ribbon, plus a 2.4px amber satellite.

**The Capsule Control Rule.** Interactive chrome that is not a card or an icon well is a pill. Do not use 8px “Material medium” buttons.

**The Conic Rim Rule.** Signature objects (CTA, wait orb, space-map bubble) are a spinning conic-gradient behind a frosted inner disc inset 1.5px. That is the material. A flat fill plus outer glow is not a substitute.

Icons are **duotone**: soft fill at 16% (`--fo: 0.16`) plus a 1.7px round-cap outline, optional accent blob in Candy Pink. On gradient discs, fill opacity goes to 0.3 and the accent becomes white.

## Components

### Buttons

Quiet pills. Primary is ink, not prism. The prism is reserved for the Clean capsule.

- **Shape:** full capsule (999px), height 40px, pad 0 16px, 14px / weight 550, 8px icon gap. Small is 32px / 13px / 12px pad.
- **Default:** raised fill, hairline, rest shadow. Hover lifts the shadow. Active `scale(0.98)`.
- **Primary:** ink fill, `--on-ink` label, matching border. Graphite primary is a pale raised pill with dark label; disabled primary stays a quiet raised pill (not a faded ink slab).
- **Ghost:** no fill, no border, no shadow; hover is 70% white (light) or 6% white (Graphite).
- **Danger:** default pill with danger-colored label. Dock confirm uses a red gradient fill.
- **Focus:** 2px Brand Blue ring, 2px offset (3px in Graphite).

### CleanButton (signature)

The spinning glass capsule. Height 56px, pad `0 22px 0 8px`, lavender-grey glass (`rgba(190, 196, 225, 0.55)`). `::before` is a 320px conic ribbon spinning 4.5s; `::after` is the frosted inner. Left disc is 40px, prism radial. Label 15px/600 + mono 11px sub. Hover `translateY(-1px)`. Busy accelerates the rim to 1.2s and swaps the disc for a spinner. Done pauses the rim and turns the disc mint→sky.

### Chips / Tags

- **Tag:** 22px capsule, 11.5px/600, `#eef0f6`. Safe mint wash, review amber wash, keep/high danger wash.
- **Filter chip:** 34px, hairline, pressed = white + `1.5px #a9b3ff` ring + violet count pill.
- **Count badge** (nav): pink wash, `#b4235a` (Graphite `#ff9cbc`).
- **Drive pill:** mono 10.5px, blue wash.

### Cards / Containers

- **`.card-w`:** 28px, `--card` fill, `--line` border, `--shadow`. Panel pad 22×24.
- **Live card `.lc`:** 26px, pigmented gradient (`c-clean` crimson, `c-speed` olive, `c-prot` indigo, `c-apps` ocean), glass-ico 32×10px, Unbounded 40px/300 numeral, glass pill CTA. Hover `translateY(-4px)`. Inner shine, drifting blob, optional embers.
- **Disk card:** 18px, 86% white, hairline, stacked 6px bars (blue→violet used, pink junk).
- **Dock `.fx-dock`:** sticky capsule, 72% white, `blur(22px) saturate(1.5)`, 76px min-height. Graphite matches the floating nav.

### Inputs / Fields

- **Text:** 14px radius, 11×14 pad, hairline, white (Graphite: surface-2 + inset). Focus: `#a9b3ff` border + `0 0 0 4px rgba(109, 123, 255, 0.15)` (Graphite 0.28).
- **Search:** same field as a 42px pill with 42px left pad for the icon.
- **Checkbox:** 20px, 7px radius, 1.5px `#c9ced8`. Checked = prism gradient + white chevron.
- **Toggle:** 44×26 pill, `#d5d9e2` track, 20px white thumb. On = prism gradient, thumb `translateX(18px)` in 250ms.
- **Segmented:** outer capsule, 4px pad, 2px gap, 70% white. Pressed segment is raised + shadow.
- **Composer (assistant):** 26px capsule, focus same 4px prism ring.

### Navigation

- **Item:** 40px, 12px radius, 14px/450, Ink 2. Hover 60% white. Active: white, 600, blue icon, soft shadow. Graphite active is a 11%→7% white gradient with inset hair.
- **Section label:** mono 10.5px, tracking 0.14em, Ink 3, 14px top pad.
- **Graphite nav:** floats, 20px radius, 8px inset, rises 36px under the titlebar, vibrancy blur 30px.

### Lists

Row: 14px gap, 12px vertical, hairline `--line-soft` on all but first. Title 14/600 ellipsis; sub 12px Ink 3; size mono 13px. Hover well `#f4f5fa` at 90%. Selected row: `rgba(109, 123, 255, 0.06)`. Graphite dividers are inset 14px pseudo-lines so they do not arc inside 16px-radius rows.

### Feedback states

- **Empty:** centered, 48px pad, 52px prism well, Unbounded 18px title, 14px body max 380px.
- **Wait orb:** 64px glass disc, spinning conic rim (same recipe as CTA).
- **Progress:** 4px track; indeterminate 40% prism bar `indet` 1.4s; determinate 300ms width.
- **Spinner:** 18px, 2px, prism. `on-color` for gradient discs; `on-ink` for primary buttons.
- **Toast:** fixed bottom-center, ink capsule, mint/danger icon, `rise` 400ms.
- **Skeleton:** glass circles breathing 1.8s on the map; live-card numeral pulse 1.4s; support chips shimmer.

### Signature extras

- **Brand mark:** 30px spark, prism fill, amber satellite.
- **Hero numeral:** Unbounded clip of `--numeral-grad`.
- **Glass bubble:** packed circles, conic rim, bob 6s, grab scale 1.06. Physics in MOTION.md.
- **Protection ring:** 160px arc, prism stroke, 12s spinning glow, glass inner with clipped score.
- **Chat:** user bubble ink, 22px with a 6px corner; AI bubble frosted 6px/22px; send is a 40px prism disc.

## Do's and Don'ts

### Do:

- **Do** keep chrome on Paper / Surface / Ink and spend the prism on one authored object per region (CTA, live card, orb).
- **Do** use Unbounded for titles and numbers, Onest for UI, Mono for metadata — with the exact tracking above.
- **Do** use `--ease` (`cubic-bezier(0.2, 0.8, 0.2, 1)`) for every state change; authored loops may use `linear` (spin) or `ease-in-out` (wander/bob).
- **Do** put `inset 0 1px 0 var(--hair)` on glass and Graphite raised surfaces.
- **Do** build signature controls as conic rim + inset frosted disc, not as neon strokes.
- **Do** honor `prefers-reduced-motion`: freeze loops, keep color/opacity state.
- **Do** use 18px as the screen rhythm and 28px as the card radius.
- **Do** treat Graphite as its own token set (paper `#161618`, vibrancy nav, backlight).

### Don't:

- **Don't** put prism fills on default buttons or the window chrome.
- **Don't** use Inter, generic Georgia/Times, or a monospaced UI font.
- **Don't** use pure `#000000` or a heavy 24px Material shadow.
- **Don't** add outer neon glows, glassmorphism-everywhere, or a custom cursor.
- **Don't** invert the whole palette to “make dark mode.”
- **Don't** animate layout (`top`/`left`/`width`/`height`) when a transform will do — exception: the space-map pack, which intentionally transitions `left/top/width/height` for 1s while physics runs on a transform offset.
- **Don't** show bouncing “scroll to explore” chrome, emoji as icons, or three equal marketing cards in place of the 4-live-card home row.
- **Don't** skip the duotone icon recipe (soft fill + crisp outline) in favor of a single-weight stroke set.
