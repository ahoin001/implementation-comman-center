# Motion System: Cleanly

Companion to [DESIGN.md](DESIGN.md). Tokens the Stitch frontmatter cannot hold.

**ICC:** Do not ship Flow or bubble physics. Screen remounts use `.rise`. List stagger caps at 240ms. Reduced motion freezes loops and keeps press, hover color, and focus.

**Thesis:** Motion explains state and gives the glass a pulse. One springy ease for interaction. A blur-rise for arrivals. A handful of authored loops on signature objects. Loops are decoration; they die under `prefers-reduced-motion`. Never make the operator wait through choreography.

## 1. The one ease

```css
--ease: cubic-bezier(0.2, 0.8, 0.2, 1);
```

This is an ease-out with a slight overshoot of attention, not a bounce. Use it for hover, active, focus, width of bars, nav, toggles, cards. Do not mix in Material standard (`0.4, 0, 0.2, 1`) or linear on interactive state.

**Exceptions (intentional):**
- `linear` — spinning conic rims (`spin`), grain wash, protection ring glow, backlight horizon
- `ease-in-out` — wander blobs, live-card drift, bubble bob, shine/sweep, glow breath
- Exponential decay in JS — number counting (`useEased`) and Flow color/thin mixing

## 2. Duration ladder

| Duration | Use | Source |
|---|---|---|
| 200ms | color, background, nav, ghost hover, checkbox, input border | `.nav-item`, `.btn`, `.check`, `.input` |
| 250ms | toggle track/thumb, CTA transform, link gap, group opacity | `.toggle`, `.cta`, `.home .link` |
| 300ms | determinate progress width, confirm rise | `.progress[data-value]`, `.sy-confirm` |
| 350ms | live-card lift + shadow, app-icon pop | `.lc`, `.sy-pop` |
| 400ms | toast rise, bubble disc hover, `fb-sys` | `.toast`, `.bubble .disc` |
| 450ms | chat message rise | `.sy-msg` |
| 500ms | dock arrival | `.fx-dock` |
| 600ms | system stagger items, badge pop | `.sy-stagger`, `.sp-pop` |
| 700ms | screen entrance `.rise` | `.rise` |
| 900ms | speed slider fill/knob | `.slider .fill` |
| 1.0–1.4s | disk bars, pack layout, protection arc | `.bar`, `.bubble`, `.sy-ring .arc` |

**Active press** is not a duration so much as a snap: `transform: scale(0.98)` on `.btn`, `.cta`, `.sp-chip`. Star buttons go `scale(0.94)`.

**Hover lifts (transform, not layout):**
- Default button: shadow only
- CTA: `translateY(-1px)`
- Live card: `translateY(-4px)`
- Bubble disc: `scale(1.03)`; grabbing `scale(1.06)`
- Send / link: `translateY(-1px)` or gap 6→9px
- Star: `translateY(-1px) scale(1.06)`

Exit is the reverse of the same curve; do not add a second exit keyframe unless collapsing a dock.

## 3. Entrance: rise

```css
.rise { animation: rise 0.7s var(--ease) both; }
@keyframes rise {
  from { opacity: 0; transform: translateY(12px); filter: blur(6px); }
  to   { opacity: 1; transform: none; filter: blur(0); }
}
```

Used on screen heads, the sidebar, toasts (400ms), chat messages (450ms), the dock (500ms), confirm chips (300ms). The blur is the signature — a fade-only entrance is not Cleanly.

**Stagger** (system screens):

```css
.sy-stagger > * { animation: rise 0.6s var(--ease) both; }
.sy-stagger > *:nth-child(2) { animation-delay: 0.06s; }
.sy-stagger > *:nth-child(3) { animation-delay: 0.12s; }
.sy-stagger > *:nth-child(4) { animation-delay: 0.18s; }
.sy-stagger > *:nth-child(n + 5) { animation-delay: 0.24s; }
```

Cap total delay at 240ms. Do not stagger every list row on scroll.

Screen switches remount `<main key={screen}>`, so each visit gets a fresh rise. That is the navigation transition. There is no shared-element morph.

## 4. Number counting

Hero numerals and live-card numbers ease toward the target on `requestAnimationFrame`:

```
cur += (target - cur) * (1 - exp(-dt * 5))
```

Tau is **5**. Reduced motion jumps to the target. Format in the *final* unit so the suffix does not flicker (GB stays GB while the digits run).

Flow uses the same exponential mixer: mist palettes ease with `1 - exp(-dt / 5)`; plume with `1 - exp(-dt * 2)`; dark thinning with `1 - exp(-dt * 3)`.

## 5. Authored loops

All loops are `transform` / `opacity` / `filter` / gradient position. All of them pause or unplug under reduced motion.

| Loop | Element | Timing | Notes |
|---|---|---|---|
| `spin` | CTA `::before`, grain wash, spinner, wait-orb rim, bubble rim | 4.5s CTA; 1.2s CTA busy; 0.8s spinner; 1.6s wait orb; 12s bubble; 40s grain | `linear`. CTA `done` sets `animation-play-state: paused; opacity: 0` |
| `wander` | Mist/dots background blobs | 22s ease-in-out, delays −7s / −14s | translate + scale, blur(70px) |
| `drift` | Live-card `.glow` | `--bd` default 6s ease-in-out | blob wander |
| `ember` | Live-card sparks | `--ed` ~3s linear, staggered `--edl` | paused when `.lc.calm` |
| `shine` | Live-card sheen | 4.5s ease-in-out | skewX(-18deg) sweep |
| `sweep` | Speed slider fill | 2.2s ease-in-out | |
| `float` | Speed card particles | `--fd` ~2.6s | |
| `bob` | Bubble float wrapper | `--dur` 6s, `--delay` per bubble | paused while grabbing |
| `indet` | Indeterminate progress | 1.4s ease-in-out | translateX −100% → 260% |
| `home-dot` | Busy eyebrow | 1.2s ease-in-out | scale 1 → 0.6 |
| `home-breathe` | Map skeleton | 1.8s ease-in-out | |
| `home-pulse` | Card skeleton / slider loading | 1.4s ease-in-out | opacity |
| `sy-spin` | Protection ring glow | 12s linear | |
| `sy-dot` | Chat typing | 1.3s, 160ms stagger | |
| `sy-breathe` | “ask permission” hint | 1.6s | |
| `sy-pop` | App icon appear | 0.35s once | scale 0.82 |
| `sp-pop` | Success badge | 0.6s once | scale 0.6 → 1.06 → 1 |
| `sp-shimmer` | Support skeleton | 1.4s | background-position |
| `glowBreath` | Graphite lav pool | 26s ease-in-out alternate, −13s | |
| `glowShift` | Graphite pink pool | 38s ease-in-out alternate, −19s | |
| `horizonBreath` | Graphite horizon | 30s ease-in-out alternate, −15s | |
| `horizonSlide` | Graphite horizon wash | 52s ease-in-out alternate, −26s | |

**The Loop Budget Rule.** A resting home screen may run: CTA rim, live-card glow/shine (and embers on Clean), background mist/glow. Do not add extra perpetual motion on nav, rows, or settings.

## 6. Background canvases

Four named backgrounds, chosen in Settings. They sit in `.app > .bg-layer` (`pointer-events: none`, z-index under chrome).

1. **Mist (default)**
   - Light: WebGL Flow, mode `mist` — domain-warped fBm “cosmic wind,” resolution scale 0.32, energy 1.4, palettes rotate every 18s. See [kit/optional/flow.md](kit/optional/flow.md).
   - Graphite: CSS **Backlight Glow** — lavender pool, pink pool, masked horizon. Transform/opacity only. 26–52s cycles.
2. **Grid** — 22×22px `--grid` lines, static.
3. **Dots** — 18px radial dots + three huge blurred blobs (`wander` 22s). Graphite blobs drop to ~0.08–0.15 opacity.
4. **Grain** — warm paper, two radials, 40s spinning conic. Graphite adds a 5% overlay fractal-noise film.

CSS fallback for consumers who will not ship WebGL: the Dots blob layer (light) or Backlight Glow (Graphite). Never block first paint on the shader.

## 7. Bubble physics (Space Map)

Visual CSS and a rAF simulation are separate.

**CSS:** pack positions (`left`/`top`/`width`/`height`) ease 1s with `--ease`. The inner `.b-float` bobs 6s. Disc hover `scale(1.03)` in 400ms. Grabbing adds `data-grab`, pauses bob, `scale(1.06)`, deeper shadow. Hot bubbles spin the rim at 4.5s instead of 12s.

**Simulation** ([Bubbles.tsx](C:\Users\ahoin\Desktop\cleanly\src\components\Bubbles.tsx)):

| Constant | Value | Role |
|---|---|---|
| `SPRING` | 70 | pull back to packed rest |
| `DAMP` | 7.5 | velocity damping |
| `GAP` | 3 | extra collision padding (px) |
| `BOUNCE` | 0.55 | bubble–bubble restitution |
| `WALL` | 0.5 | wall restitution |
| `HOVER_REACH` | 26 | hover influence radius |
| `HOVER_PUSH` | 42 | hover push strength |
| `MAX_V` | 2600 | clamp (px/s) |
| `GRAB_SCALE` | 1.06 | |
| `DRAG_MIN` | 4 | pointer delta before a grab counts as a throw |

Packing is greedy: largest first, spiral around centre, fill 0.50 down to 0.12. Physics animates an offset `(ox, oy)` on top of the packed rest. Throws inherit pointer velocity.

Reduced motion: no bob, no disc hover scale, `touch-action: auto`. Packing may still ease.

This module is **optional**. Most screens should not import it. CSS-only packed circles are enough for a catalog or a static map.

## 8. Flow (WebGL cosmic wind)

Optional signature. Two modes on one fragment shader:

- **`mist`** — slow silk behind the window (light theme only). Internal res 0.32×. Mood palettes:
  - `#ffb8cf #ffd9b0 #c9d8ff #e6c8ff`
  - `#a9d2ff #c9bcff #ffc6dd #e4f1ff`
  - `#a8f0dc #b5dcff #ffd6c2 #d9cfff`
  - `#ffc2b0 #d6b8ff #ffb8d6 #ffe6c4`
- **`plume`** — rises from the bottom of a card (Smart Scan hero, Support). Palettes `PLUME` (`#ffa8c4 #ffd2a1 #a9d6ff #cbb9ff`) and `CALM` after a clean (`#8fefc9 #a8dcff #d4f6ff #b9f0e0`). `pulse` slams `boost = 1` and it decays at 0.8/s. Dark cards draw the plume thinner (`DARK_THIN = 0.62`) and the host CSS screens/blurs it into backlight.

Clock is real `dt`, so a slow GPU drops frames rather than slowing the wind. Reduced motion runs the shader at 0.15× speed (still visible, not frozen-black).

Do not ship Flow on a wallpaper-like always-on surface without the resolution scale and a reduced-motion path. Prefer Backlight Glow / Dots fallback.

## 9. Reduced motion

Kill loops; keep meaning.

```css
@media (prefers-reduced-motion: reduce) {
  .rise, .bubble, .bubble .disc::before, .cta::before,
  .lc .glow, .ember, .slider .fill::after, .parts i, .lc .shine,
  .bg-dots i, .bg-grain::before,
  .bg-glow .glow-lav, .bg-glow .glow-pink,
  .bg-glow .glow-horizon, .bg-glow .glow-horizon i,
  .fx-wait .orb::before, .sy-stagger > *, .sy-msg, .sy-dots i,
  .sy-ring-glow, .home .eyebrow .dot.busy { animation: none; }
}
```

Also: `useEased` jumps; Flow clock × 0.15; bubble bob off; protection arc transition off.

**Do not** remove hover color, the 0.98 press, or focus rings. Those are state, not spectacle.

## 10. Performance reflexes

- Animate `transform`, `opacity`, `filter`, `box-shadow`. Shadow is used (card lift) — keep the shadow list short and on few nodes.
- Bound blur: background blobs `blur(70px)` on three elements; live-card glow `blur(18px)` inside overflow clip; Graphite glow is huge but 2–3 nodes, 26s+ cycles.
- Flow renders at 0.32–0.5 of CSS size. `antialias: false`, premultiplied alpha.
- `will-change` is not used; do not add it for resting loops.
- Icon sprite is one SVG `<defs>` at the root; instances are `<use>`.
- Home live cards clip (`overflow: clip`) so shine/embers never dirty the window.

## 11. Named rules

**The One Ease Rule.** Interactive motion uses `--ease`. If it does not, it must be a loop (`linear` / `ease-in-out`) or the JS exponential counter.

**The Rise Rule.** Arrivals use `translateY(12px) + blur(6px) + fade`. Fade-only is a downgrade.

**The Press Rule.** Buttons and chips scale to 0.98 (stars 0.94). They do not bounce, ripple, or slide.

**The Loop Dies Rule.** Every infinite animation is listed in the reduced-motion media query. Adding a loop without that line is a bug.

**The Transform Rule.** Do not animate `top` / `left` / `width` / `height` for hover or entrance. The allowed exception is Space Map packing (1s `--ease` on those properties) because the rest positions actually change.
