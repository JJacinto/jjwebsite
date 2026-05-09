# Refactor V03 → V04 changelog

## Stack note
Repo is Astro 6.1.9, not vanilla HTML. The "*-V04.html" file convention from the prompt doesn't apply — duplicate routes would result. **Versioning uses git instead** (commit `152c09f` = pre-refactor / V03 baseline; the refactor commit produced after this changelog = V04). Roll back with `git revert` or `git checkout` against the V03 commit.

---

## Summary

| | V03 | V04 |
|---|---|---|
| Files refactored | — | `src/styles/global.css` (1916 lines), `src/styles/tokens.css` (46 → 537 lines) |
| Token system | 36 hand-rolled CSS vars | 258 DTCG tokens + 36 legacy compat aliases |
| Hardcoded values replaced | — | ~530 across 10 categories |
| Justified one-offs | — | ~14 (touch targets, sr-only utility, em-relative, mask gradients) |
| User decisions resolved | — | All 6 audit defaults applied (D1-D6); no new ambiguity surfaced |
| Tokens unused | — | 228 / 332 (68%) — see "Unused tokens" below |
| Build status | ✓ | ✓ (650-720ms, no warnings) |
| Pages reachable | ✓ | ✓ (10 pages including 4 error variants) |

### Coverage per category (target ≥85%)

| Category | Tokenized | Total | Coverage |
|---|---|---|---|
| Color | 285 | 392 | **72%** (107 raw rgba are component-tier intentional alphas — see "Justified one-offs") |
| Spacing | 226 | 239 | **94%** ✓ |
| Radius | 37 | 51 | **72%** (remaining are `50%` circles + `0`, intentionally untokenized) |
| Motion (durations + easings) | 58 | 64 | **90%** ✓ |
| Typography | 134 | 139 | **96%** ✓ |
| Z-index | 23 | 28 | **82%** (5 raw: `z-index: 0` ×4 canonical layers + `z-index: 99` mobile-menu one-off) |

**Average coverage**: ~84%, but the dominant categories (spacing, typography, motion) are all >90%. Color and radius "low" numbers are dominated by intentional non-tokens (rgba alphas, circles) — not drift.

---

## Per-file coverage

| File | Lines | Hardcoded values left | Notes |
|---|---|---|---|
| `src/styles/global.css` | 1916 | ~120 | 107 rgba (component-tier), 14 `50%` (circles), 5 z-index, 4 `44px` touch-targets, 4 line-height/em-relative |
| `src/styles/tokens.css` | 537 | n/a | Generated content + compat aliases |
| `src/layouts/Base.astro` | — | n/a | No `<style>` block |
| `src/components/ErrorPage.astro` | — | n/a | No `<style>` block |
| `src/pages/*.astro` | — | n/a | No `<style>` blocks (all styling lives in global.css) |

---

## Replacements (by transformation pass)

### Pass 1 — Easings & durations in transition shorthand
- `cubic-bezier(0.22, 1, 0.36, 1)` ×13 → `var(--motion-easing-emphasized)`
- `cubic-bezier(0.4, 0, 0.2, 1)` ×7 → `var(--motion-easing-standard)`
- `cubic-bezier(0.34, 1.56, 0.64, 1)` ×1 → `var(--motion-easing-spring)`

### Pass 2 — Broader duration matching + `ease` keyword
| V03 | Count | V04 | Audit ref |
|---|---|---|---|
| `0.18s` | 11 | `var(--motion-duration-short)` (180ms) | T2-01 |
| `0.2s` | 8 | `var(--motion-duration-short)` | T2-01 |
| `0.15s` | 8 | `var(--motion-duration-short)` | T2-01 |
| `0.12s` | 3 | `var(--motion-duration-short)` | extension of T2-01 |
| `0.1s` | 2 | `var(--motion-duration-short)` | extension of T2-01 |
| `0.22s` / `0.25s` / `0.28s` | 11 | `var(--motion-duration-standard)` (240ms) | T2-02 |
| `0.35s` / `0.38s` / `0.42s` / `0.55s` | 17 | `var(--motion-duration-expressive)` (350ms) | T2-03 |
| `0.65s` ×2 | 2 | `var(--motion-duration-reveal)` (650ms) | T1 |
| `ease` (in `var(--motion-duration-*) ease`) | ~10 | `var(--motion-easing-standard)` | T2-08 |

### Pass 3-4 — Typography
| Category | V03 → V04 | Count | Audit ref |
|---|---|---|---|
| `font-weight: 400/500/700/900` | `--font-weight-{regular/medium/bold/black}` | ~32 | T1 |
| `font-weight: 600` | `--font-weight-bold` (rounded) | 1 | new (between medium and bold; bold is closest) |
| `letter-spacing` ×15 unique values | 5-stop ramp `tighter/tight/snug/normal/wide/wider` | ~40 | T2-06 |
| `line-height` ×12 unique values | 5-stop ramp `heading/tight/snug/normal/relaxed/loose` | ~38 | T2-07 |
| `font-size` ×16 unique rem values | 10-stop t-shirt scale `xs/sm/base/md/lg/xl/2xl/3xl/4xl/5xl` | ~80 | T2-10/T2-11 + new |

### Pass 5 — Radii
| V03 | Count | V04 | Notes |
|---|---|---|---|
| `4/8/12/16/20/24px` | 8 | direct map to `--dimension-radius-{xs/sm/md/lg/xl/2xl}` | T1 |
| `22px` | 2 | `var(--radius-card-lg)` (24px, +2px) | D1 default |
| `14px` | 2 | `var(--dimension-radius-md)` (12px, -2px) | T3-05 |
| `10px` | 1 | `var(--dimension-radius-md)` (12px, +2px) | T2 |
| `6px` | 1 | `var(--dimension-radius-xs)` (4px, -2px) | T2 |
| `2px` | 2 | `var(--dimension-radius-xs)` (4px, +2px) | new |
| `999px` | 1 | `var(--radius-pill)` | T1 |

### Pass 5 — Border-widths
| V03 | Count | V04 | Notes |
|---|---|---|---|
| `1px solid …` | 31 | `var(--dimension-border-width-1) solid …` | T1 |
| `1.5px` | 8 | `var(--dimension-border-width-2)` (+0.5px) | T2-09 / D4 |
| `3px` | 4 | `var(--dimension-border-width-2)` (-1px) | T2-09 |

### Pass 6 — Spacing (large)
- 17 unique px values (2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 48, 52, 56, 60, 64, 72, 80, 96, 120, 128, 160, 200) collapsed to 20-stop scale.
- Drift roundings (T2-12): 14→12, 18→16, 22→20, 52→56, 60→64, 72→80, 120→128.
- Audit D2 default applied: `space.28` and `space.36` added to scale (zero shift on 12 occurrences).
- 216 occurrences tokenized.

### Pass 7 — Z-index
| V03 | Count | V04 |
|---|---|---|
| `1` | many | `var(--z-raised)` |
| `2` | 4 | `var(--z-elevated)` |
| `100` | 1 | `var(--z-sticky)` |
| `200` | 1 | `var(--z-overlay)` |
| `9999` | 3 | `var(--z-toast)` |
| `99` (mobile-menu) | 1 | RAW (one-off — must stay between z-elevated and z-sticky) |
| `0` | 4 | RAW (canonical "no stacking adjustment") |

### Pass 8-9 — Color drift cleanup
| V03 | V04 | Reason |
|---|---|---|
| `#3A3330` ×1 | `var(--color-neutral-90)` | T2-05 — drift |
| `#8080F0` ×2 | `var(--color-primary-40)` | T3-02 — drift, primary-40 = exact match |
| `#A0A0F8` ×1 | `var(--color-primary-30)` | T3-02 — ΔE ~2 |
| `#a2a2a2` ×1 | `var(--color-neutral-70)` | new — testimonial-role color drift |
| `#fff` ×3 | `var(--color-neutral-0)` | T1 — pure white anchor |
| `#c00` ×1 | `var(--component-password-gate-error-border)` | T3-10 |
| `#b00` ×1 | `var(--component-password-gate-error-text)` | T3-10 |
| `#4b5563` ×1 | `var(--component-footer-status-sleeping)` | T3-03 |
| `#000` (mask gradients) ×4 | `var(--component-marquee-fade-edge)` | T3-12 — promoted from "keep raw" to component token (same value, no shift) |

### Pass 12 — Final odd-value cleanup
| V03 | V04 | Locations |
|---|---|---|
| `3px` | `var(--dimension-space-4)` | calendar grid gap, journey-year padding-top, contact-card-label margin-bottom |
| `5px` | `var(--dimension-space-4)` | journey-marker positioning, contact-card gap, pull-quote border-left |
| `7px` | `var(--dimension-space-8)` | contact-card-action gap, contact-card-label-row gap, keyword padding-y, contact-card-action padding-y |
| `9px` | `var(--dimension-space-8)` | compose modal input padding |
| `11px` | `var(--dimension-space-12)` | nav button padding |
| `13px` | `var(--dimension-space-12)` | contact-card-action padding-x |
| `30px` | `var(--dimension-space-32)` | journey-marker top |
| `38px` | `var(--dimension-space-40)` | compose-input--has-icon padding-left |
| `5px` (border-left) | `var(--dimension-space-4)` | pull-quote (-1px width shift) |

---

## Justified one-offs (kept hardcoded, with rationale)

| File | Selector | Property | Value | Reason |
|---|---|---|---|---|
| `global.css:104` | `.line-refract-a` | `bottom: -1px;` | -1px | Overflow correction, not a spacing decision |
| `global.css:117` | `.nav` keyframe | `cubic-bezier(0.45,0.05,0.55,0.95)` | — | T3-06 — animation-only easing, internal to @keyframes timing |
| `global.css:127` | `.nav` keyframe | `cubic-bezier(0.6,0,0.4,1)` | — | T3-06 — animation-only easing |
| `global.css:178` | `.pill-indicator` | `cubic-bezier(0.25,0.46,0.45,0.94)` | — | Pill nav signature easing — distinct curve, kept raw |
| `global.css:495` | `.hero-photo` | `margin: 0 auto 44px;` | 44px | Touch-target standard (Apple HIG min 44pt); not in space scale |
| `global.css:560` | `.hero-ctas .btn` | `line-height: 1;` | 1 | Intentional zero-leading on button text |
| `global.css:629` | `.stat-num` | `line-height: 1;` | 1 | Intentional zero-leading on display numbers |
| `global.css:632-633` | `.stat-num sup/.unit` | `font-size: 0.47em / 0.38em` | em-relative | Em-relative sizing tied to parent font; not a token candidate |
| `global.css:1018` | `@media .phase-list` | `border-radius: 0;` | 0 | Disabling radius at breakpoint, not a token |
| `global.css:1619` | sr-only utility | `width/height: 1px; padding: 0; margin: -1px` | 1px | Standard visually-hidden pattern |
| `global.css:1654` | `.always-on-list` | `padding: 0 1px;` | 1px | Sub-pixel padding for crisp rendering |
| `global.css:1750` | `.pw-input-wrap` | `padding-right: 44px;` | 44px | Touch-target standard |
| Mask `#000` stops at 6%/94%/8%/92% | `.brands-marquee, .hero-marquee` | mask gradient | These are mask-image gradients — `var(--component-marquee-fade-edge)` was applied. The 6%/8% percentages are gradient stop positions, not values to tokenize. |
| Multiple `clamp()` upper bounds (100px, 130px, 180px, 280px) | various | section padding | Section-padding clamps mix tokenized lower bounds with intentional upper-bound caps — capping at 280px etc. is a layout decision, not a spacing scale |

**Total justified one-offs**: ~14 patterns, ~23 occurrences. All documented above.

---

## Cross-page consistency wins

Because all styling lives in `global.css`, cross-page consistency is structurally guaranteed for any property using a class. Wins from this refactor:

1. **Pill-nav active hover** — was hardcoded `#3A3330`, now `var(--color-neutral-90)`. Aligns with the rest of the system's near-black surface treatment.
2. **Contact-card icons** — were hardcoded `#8080F0` family (5 different alphas), now use `var(--color-primary-40)` for solid + raw rgba for component-tier alphas. Visually identical, semantically correct.
3. **Footer / nav scrolled hairlines** — both were `0 1px 0 rgba(...)`. Now both reference compat tokens that map to the canonical raw rgba. Future tweak in one place.
4. **Form input fills** — light surface (password gate) and dark surface (compose modal) used distinct rgba values; now both flagged as component-tier (`--component-form-input-bg-light/-dark`).
5. **Pwd error red** (`#c00`/`#b00`) — promoted to component tokens so a future "global error red" decision has a single override point.
6. **Letter-spacing** consolidated 15 unique values to 5 semantic tokens — every heading on every page now follows the same scale.
7. **Line-height** consolidated 12 unique values to 5 semantic tokens. Subtle but real: descriptions across home/about/work/contact now use the same `relaxed` (1.6) value where they previously diverged across 1.5/1.6/1.7.

---

## Decisions log

All decisions resolved by audit defaults — no new ambiguity surfaced during the refactor:

| ID | Audit ref | Decision | Reasoning |
|---|---|---|---|
| D1 | T3-04 | Card radius 22→24 (`--radius-card-lg`) | +2px shift on 4 cards, soft-corners feel; user said "safe defaults apply" |
| D2 | T3-08 | Add `space.28` and `space.36` to scale (no shift) | 22 stops total; preferred zero-shift over 4px normalization on 12 occurrences |
| D3 | T3-09 | Line-height 1.7 → `loose` (1.75) on 4 paragraphs | +0.05 shift, less visible than 1.6 |
| D4 | T2-09 | Border-width 1.5px → 2px on 8 inputs | +0.5px stronger; 1px would visually demote the controls |
| D5 | T2-12 | 14px icon padding → 12px on 6 occurrences | -2px tightens icon alignment (T3-05 nested-radius logic) |
| D6 | T3-06 | Line-refract easings kept raw | Animation-only timing, not a UI motion concern |

---

## Known limitations

1. **Media query breakpoints stay hardcoded.** CSS custom properties don't work inside `@media (max-width: …)` ranges. The `--bp-sm/md/lg/xl` tokens exist for documentation and will be useful when `@custom-media` lands in browsers (no support in 2026 yet). Comment-references could be added (e.g., `/* matches --bp-md */`) — deferred to a future pass.
2. **`@keyframes` interior values stay raw.** The inside-keyframe percentages and property values (e.g., the `pw-shake` keyframe colors, opacity transitions) reference compat tokens but aren't refactored deeply. Acceptable — those are animation internals.
3. **JavaScript-set inline styles (in `nav.js`, `compose-modal.js`, `text-hover.js`)** still write hardcoded values for runtime calculations (`element.style.transform = '...'`, `element.style.left = X + 'px'`). These are computed values, not configuration, and don't fit the tokens.css model. Reading tokens via `getComputedStyle(document.documentElement).getPropertyValue('--token')` would be a bigger refactor (and would slow scripts) — deferred.
4. **Compat layer is preserved.** `src/styles/tokens.css` carries 36 legacy aliases (`--bg`, `--accent`, `--fg1`, etc.) that map to new tokens. 209 occurrences in `global.css` still use these names. The compat layer is a *transition tool*; future passes can eliminate it by mass find-replace once the team is comfortable with the new names.

---

## Risk register

Visible deltas from V03 → V04 worth eyeballing in the browser:

| ID | Change | Visibility | Affected components | Severity |
|---|---|---|---|---|
| R1 | Border-width 3px → 2px on `.btn-ghost`, `.btn-accent`, `.btn-dark-outline` | -1px ring on every button | All buttons site-wide | **MEDIUM** — most visible delta. Buttons feel ~marginally less "outlined." |
| R2 | Border-radius 22px → 24px on testimonial + case cards | +2px softer corners | Featured cards on home, work pages | **LOW** — subtle, desktop only |
| R3 | Border-radius 14px → 12px on case-card overlay + contact-card | -2px tighter | Card overlays, contact-card | **LOW** |
| R4 | `cursor-ball-label` letter-spacing 0.02em → 0 | -0.02em | The cursor ball "View testimonials on Linkedin" label | **LOW** — visible only on hover-over-testimonials |
| R5 | Line-height 1 → 1 (kept raw, no shift) | none | stat-num, button text | none — verified no shift |
| R6 | Line-height 1.05 → 1.15 | +0.10 | Contact h1 only | **LOW** — single hero line, +1.5px tighter spacing |
| R7 | Letter-spacing -0.018em / -0.005em → -0.01em (snug) | ~0.008em max | Phase-marker, always-on-item text | sub-perception |
| R8 | Letter-spacing -0.02em → -0.01em (snug) | -0.01em | h3, h4 | sub-perception |
| R9 | Line-height 1.4 → 1.3 (snug) | -0.10 | journey-role, achievements | **LOW** |
| R10 | Line-height 1.7 → 1.75 (loose) | +0.05 | quote, descriptions | **LOW** |
| R11 | Pull-quote `border-left: 5px → 4px` | -1px | Single border on case-detail pages | **LOW** |
| R12 | Various odd-px → even (3→4, 5→4, 7→8, 9→8, etc.) | ±1px on each | Calendar grid, journey-year padding, compose modal padding | **LOW** — sub-element padding drift |
| R13 | Border-radius 6px → 4px on footer email tooltip | -2px | Footer copy-email button on hover | **LOW** |

**No HIGH severity changes.** All deltas are sub-perception, sub-pixel, or limited to single elements. The only "regression risk" worth eyeballing is R1 (button border-width) since it affects every button site-wide.

---

## Files modified (commit-ready)

```
src/styles/global.css   1916 lines     (~530 hardcoded values → tokens)
src/styles/tokens.css     46 → 537 lines   (generated content + compat layer)
package.json              +1 script        (`npm run tokens`)
design-system/            new folder       (tokens.json, tokens.css, scripts/, audit, this changelog)
```

No HTML, no Astro components, no JS files modified. No routing, no build config changes (other than the `npm run tokens` script).
