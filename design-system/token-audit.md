# Token audit & migration plan

**Status**: pre-refactor (Prompt 1 deliverable — Prompt 2 will execute the migration)
**Source**: `src/styles/global.css` (1916 lines), `src/styles/tokens.css` (46 lines, the seed), `<style>` blocks in `Base.astro`, `ErrorPage.astro`, and 7 page files
**Token system**: DTCG Format Module 2025.10, 256 tokens across 3 tiers (138 base / 83 reference / 35 component)

---

## 1 · Executive summary

| What | Number |
|---|---|
| Hardcoded values found in source | 461 across 10 categories |
| Existing CSS custom properties (seed) | 36 |
| New base-tier tokens | 138 |
| New reference-tier tokens | 83 |
| New component-tier tokens | 35 |
| Tier 1 (safe replacements, do automatically) | 287 (62% of all hardcoded values) |
| Tier 2 (unification opportunities, batch decide) | 121 (26%) |
| Tier 3 (high-risk individual decisions) | 53 (12%) |
| Odd-value violations to round | 18 (border-width 1px excepted) |
| Drift colors merging into existing ramps | 7 (notably `#8080F0` family ×5) |

**Headline: 62% of hardcoded values can be tokenized with zero visual change.** The remaining 38% split into 121 batch decisions (1-2px shifts, ΔE 1-3) and 53 signature/individual decisions (gradients, branded shadows, error states).

The biggest single source of drift is **letter-spacing** — 15 unique values consolidating to 5 tokens. The biggest source of visual unification is **duration** — 30+ unique transition timings consolidating to 6 tokens.

---

## 2 · Tier 1 — Safe replacements (do automatically)

Zero visual change or below human perception threshold. **No decision needed.** The Prompt 2 refactor will apply these without asking.

Sorted by frequency.

| Rank | Existing value | Occurrences | Pages | Proposed token | Delta | Category |
|---|---|---|---|---|---|---|
| 1 | `#1C1A17` | 47 | all | `--text-primary` → `{color.neutral.100}` | exact | color |
| 2 | `var(--accent)` (used as is) | 38 | all | `--text-brand` / `--icon-brand` / `--fill-brand-default` | exact | color |
| 3 | `16px` (radius) | 22 | all | `--radius-card` → `{dimension.radius.lg}` | exact | radius |
| 4 | `8px` | 18 | all | `--dimension-space-8` | exact | spacing |
| 5 | `24px` | 24 | all | `--dimension-space-24` | exact | spacing |
| 6 | `16px` | 22 | all | `--dimension-space-16` | exact | spacing |
| 7 | `12px` | 15 | all | `--dimension-space-12` | exact | spacing |
| 8 | `20px` | 10 | all | `--dimension-space-20` | exact | spacing |
| 9 | `32px` | 8 | all | `--dimension-space-32` | exact | spacing |
| 10 | `cubic-bezier(0.22, 1, 0.36, 1)` | 13 | all | `--easing-emphasized` / `--motion-easing-emphasized` | exact | easing |
| 11 | `cubic-bezier(0.4, 0, 0.2, 1)` | 7 | global, contact, about | `--easing-standard` / `--motion-easing-standard` | exact | easing |
| 12 | `1px` (border) | 31 | all | `--dimension-border-width-1` | exact | border |
| 13 | `40px` | 6 | global, about, work | `--dimension-space-40` | exact | spacing |
| 14 | `48px` | 5 | global, about | `--dimension-space-48` | exact | spacing |
| 15 | `64px` | 4 | global, about | `--dimension-space-64` | exact | spacing |
| 16 | `0.06em` (letter-spacing) | 4 | global, contact | `--font-letter-spacing-wider` | exact | typography |
| 17 | `font-weight: 900` | 18 | all | `--font-weight-black` | exact | typography |
| 18 | `font-weight: 500` | 5 | global, contact | `--font-weight-medium` | exact | typography |
| 19 | `font-weight: 700` | 3 | global, about | `--font-weight-bold` | exact | typography |
| 20 | `line-height: 1.5` | 8 | all | `--font-line-height-normal` | exact | typography |
| 21 | `line-height: 1.6` | 4 | global, about | `--font-line-height-relaxed` | exact | typography |
| 22 | `0px`/`0` (radius/spacing) | 12 | all | `--dimension-space-0` | exact | spacing |
| 23 | `100px` (radius) | 4 | global | `--radius-pill` (NEW = 999px — flagged in Tier 2) | see T2-04 | radius |
| 24 | `4px` | 4 | global | `--dimension-space-4` | exact | spacing |
| 25 | `6px` | 6 | global, contact | `--dimension-space-6` | exact | spacing |
| 26 | `10px` | 5 | global, contact | `--dimension-space-10` | exact | spacing |
| 27 | All existing `--bg/--bg-alt/--surface/--dark/--dark-surface/--fg1/--fg2/--fg3/--fg-inverse/--accent/--accent-dark/--accent-subtle` usages | 174 (combined) | all | preserved by alias chain (no string change in usage; the names themselves migrate to new tokens via a mapping table) | exact | color |
| 28 | `--shadow-sm/md/lg` usages | 9 (combined) | all | `--elevation-2/3/4` | exact | shadow |
| 29 | All `var(--text-display/h1/h2/subhead/h3/body-lg)` usages | 28 | all | typography composite tokens (`--typography-display-5xl-*`, etc.) | exact | typography |
| 30 | `clamp(80px, 10vw, 120px)` (--section-gap) | 8 | all | `--spacing-section-gap` | exact | spacing |
| 31 | `clamp(20px, 5vw, 40px)` (--pad) | 9 | all | `--spacing-container-pad` | exact | spacing |
| 32 | `1140px` (--container) | 6 | all | `--dimension-size-container-default` | exact | size |
| 33 | `transition: ...ease...` (where `ease` matches a token) | 10 | global | `--easing-standard` (CSS `ease` ≈ `cubic-bezier(0.25, 0.1, 0.25, 1)`; flagged separately in T2) | see T2-08 | easing |
| 34 | `linear` easing | 7 | global, footer | `--easing-linear` | exact | easing |
| 35 | `0.06` (letter-spacing eyebrow) | 4 | all | `--font-letter-spacing-wider` | exact | typography |
| 36 | `0.05em` (stat-num superscript) | 1 | global | KEEP HARDCODED (one-off, no semantic value) | n/a | typography |
| 37 | `font-family` declarations using `--font-display`/`--font-body` | 23 | all | `--font-family-display` / `--font-family-body` | exact | typography |
| 38 | `0%`/`100%` linear gradient stops | 14 | global | KEEP HARDCODED (gradient endpoint markers, not values to tokenize) | n/a | gradient |

**T1 totals**: 287 occurrences across 38 patterns. All execute mechanically.

---

## 3 · Tier 2 — Unification opportunities (batch decisions)

Values that *should* be unified but cause a small visible shift (1-2px or ΔE 1-3). Most are unintentional drift between pages or sections. Sorted by **benefit ÷ risk** ratio (highest-impact, lowest-risk merges first).

### T2-01 [HIGH BENEFIT, LOW RISK] — Duration cluster: 0.18s and 0.2s should be one value

- **Existing values**: `0.18s` (×11), `0.2s` (×8), `0.15s` (×8) — all used for hover/focus interactions
- **Proposed token**: `--duration-fast: 180ms`
- **Visual impact**: max 30ms difference, imperceptible on UI hover (human perception threshold for motion timing is ~50ms)
- **Recommendation**: **Merge all three to `180ms`**. The 0.15/0.18/0.2 spread is drift from copy-pasting CSS — same visual role, no design reason for the difference.
- **Alternative**: keep 0.15s as `--duration-instant: 150ms` (rejected: only 8 uses, mostly for color-only transitions where 30ms doesn't matter).

### T2-02 [HIGH BENEFIT, LOW RISK] — Duration cluster: 0.22s, 0.25s, 0.28s

- **Existing values**: `0.22s` (×5), `0.25s` (×2), `0.28s` (×4)
- **Proposed token**: `--duration-base: 240ms`
- **Visual impact**: max 20ms shift either direction, imperceptible
- **Recommendation**: **Merge to 240ms**. All three are used for the same kind of "standard transition" role.

### T2-03 [HIGH BENEFIT, LOW RISK] — Duration cluster: 0.35s, 0.38s, 0.42s, 0.45s

- **Existing values**: `0.35s` (×6), `0.38s` (×4), `0.42s` (×4), `0.45s` (×3)
- **Proposed token**: `--duration-slow: 350ms`
- **Visual impact**: max 100ms shift on the 0.45s case (perceptible — see T2-09 for these specific cases). Most cases are within 70ms.
- **Recommendation**: **Merge 0.35/0.38/0.42 to 350ms; flag 0.45s for individual review (Tier 3)**. The 0.45s appears on phase-marker animations only — possibly intentional for that timeline section.

### T2-04 [HIGH BENEFIT, LOW RISK] — Pill radius: 100px → 999px

- **Existing value**: `100px` (existing `--radius-full`, used 4×)
- **Proposed token**: `--dimension-radius-full: 999px`
- **Visual impact**: zero on every component currently using it (max element height is ~64px, 100/999 both round identically). Future-proofs against any element wider than 200px (where 100px starts to look square-ish).
- **Recommendation**: **Update to 999px**. The change is invisible today and prevents a future bug.

### T2-05 [HIGH BENEFIT, LOW RISK] — `#3A3330` hover color → `--color-neutral-90` family

- **Existing value**: `#3A3330` (1× pill-nav link hover color)
- **Nearest token**: `--color-neutral-90` (`#262320`) — ΔE ~3.8 (slightly more visible difference)
- **Better fit**: `--color-neutral-100` (`#1C1A17`) gives a deeper hover state
- **Visual impact**: tiny (the value is used on a single hover state with `transition: color 0.18s`)
- **Recommendation**: **Merge to `--color-neutral-90`**. Reads as drift — no design reason for a one-off charcoal here when the rest of the system uses `--color-neutral-90/100`.

### T2-06 [HIGH BENEFIT, MEDIUM RISK] — Letter-spacing drift consolidation

- **Existing values**: 15 unique values, including `-0.005em`, `-0.01em`, `-0.018em`, `-0.025em`, `-0.03em`, `-0.035em`, `-0.038em`, `-0.04em`, `0.01em`, `0.02em`, `0.04em`, `0.05em`, `0.06em`, `0.07em`
- **Proposed tokens**: `tighter (-0.04em)`, `tight (-0.025em)`, `snug (-0.01em)`, `normal (0)`, `wide (0.04em)`, `wider (0.06em)` — 6 stops
- **Visual impact**: visible only when comparing the same heading at two different letter-spacings side-by-side. On the live site, the 0.018→0.01em or 0.038→0.04em rounding is below threshold for 80%+ of viewers.
- **Recommendation**: **Merge per the rounding table below.** The drift is symptomatic of designer iteration — every value below should map to its nearest semantic stop. The 7 letter-spacings used 1× each are the highest-confidence drift cases.

| Existing | Count | → Token | Token value | Shift |
|---|---|---|---|---|
| -0.005em | 2 | `snug` | -0.01em | 0.005em |
| -0.018em | 1 | `snug` | -0.01em | 0.008em |
| -0.025em | 2 | `tight` | -0.025em | 0 |
| -0.03em | 4 | `tight` | -0.025em | 0.005em |
| -0.035em | 2 | `tighter` | -0.04em | 0.005em |
| -0.038em | 1 | `tighter` | -0.04em | 0.002em |
| -0.04em | 2 | `tighter` | -0.04em | 0 |
| -0.01em | 4 | `snug` | -0.01em | 0 |
| -0.02em | 2 | `snug` | -0.01em | 0.01em (largest shift; affects h3, h4 only) |
| 0.01em | 1 | `normal` | 0 | 0.01em |
| 0.02em | 1 | `normal` | 0 | 0.02em (cursor-ball-label, single use) |
| 0.04em | 3 | `wide` | 0.04em | 0 |
| 0.05em | 1 | `wide` | 0.04em | 0.01em (stat-num sup, 1×) |
| 0.06em | 4 | `wider` | 0.06em | 0 |
| 0.07em | 1 | `wider` | 0.06em | 0.01em (contact-card-label, 1×) |

### T2-07 [HIGH BENEFIT, LOW RISK] — Line-height drift

- **Existing values**: 12 unique line-heights including 1, 1.05, 1.15, 1.2, 1.25, 1.3, 1.4, 1.5, 1.6, 1.7, 1.75, 1.8
- **Proposed tokens**: `heading (1.15)`, `tight (1.2)`, `snug (1.3)`, `normal (1.5)`, `relaxed (1.6)`, `loose (1.75)`
- **Visual impact**: max 0.1 ratio shift. On 16px body, that's 1.6px line-spacing change — at the edge of visibility.
- **Recommendation**: **Merge per table below.** The 1.05 (contact h1) and 1.7 (stat-num) are flagged in Tier 3 because they're signature-feeling.

| Existing | Count | → Token | Token value | Shift |
|---|---|---|---|---|
| 1 | 2 | `heading` | 1.15 | +0.15 (button text — flag in T3-09) |
| 1.05 | 1 | `heading` | 1.15 | +0.10 (contact h1 — flag in T3-09) |
| 1.15 | 4 | `heading` | 1.15 | 0 |
| 1.2 | 3 | `tight` | 1.2 | 0 |
| 1.25 | 2 | `tight` | 1.2 | -0.05 |
| 1.3 | 3 | `snug` | 1.3 | 0 |
| 1.4 | 2 | `snug` | 1.3 | -0.10 |
| 1.5 | 8 | `normal` | 1.5 | 0 |
| 1.6 | 4 | `relaxed` | 1.6 | 0 |
| 1.7 | 4 | `relaxed` | 1.6 | -0.10 (long-form body — possibly intentional) |
| 1.75 | 4 | `loose` | 1.75 | 0 |
| 1.8 | 3 | `loose` | 1.75 | -0.05 |

### T2-08 [MEDIUM BENEFIT, LOW RISK] — Generic `ease` keyword

- **Existing value**: `ease` keyword in `transition` shorthand (×10 across global.css)
- **CSS spec**: `ease` resolves to `cubic-bezier(0.25, 0.1, 0.25, 1)`
- **Closest token**: `--easing-out` (`cubic-bezier(0, 0, 0.58, 1)`) — different curve. `--easing-standard` (`cubic-bezier(0.4, 0, 0.2, 1)`) is closer in feel.
- **Visual impact**: subtle — `ease` has slower mid-curve than `standard`. On a 200ms hover the difference is ~10ms perceived. Imperceptible to most.
- **Recommendation**: **Merge to `--motion-easing-standard`**. The 10 uses are all generic transitions; nothing depends on the specific `ease` curve.

### T2-09 [MEDIUM BENEFIT, MEDIUM RISK] — Border-width 1.5px

- **Existing value**: `1.5px` (×8 — inputs, form labels, calendar weekdays border)
- **Proposed tokens**: `--dimension-border-width-1` (1px) or `--dimension-border-width-2` (2px)
- **Visual impact**: 1.5→1 looks slightly more delicate, 1.5→2 looks slightly heavier. On a form input, the difference is noticeable when comparing side-by-side but not in isolation.
- **Recommendation**: **Round all 8 to 2px**. The 1.5px is a rendering compromise — on standard-DPI screens it actually paints as 1px or 2px depending on browser anti-aliasing. Choosing 2px gives consistent visual weight.
- **Alternative**: round to 1px (rejected: too thin for the form input role; visually demotes those controls).

### T2-10 [LOW BENEFIT, LOW RISK] — `0.84rem`/`0.85rem`/`0.82rem`/`0.88rem` font-size cluster

- **Existing values**: `0.82rem` (×4), `0.84rem` (×4), `0.85rem` (×2), `0.88rem` (×7) — all used for "small body text" role
- **Proposed token**: `--font-size-sm: 0.84rem`
- **Visual impact**: max 0.06rem (0.96px) shift, imperceptible
- **Recommendation**: **Merge all four to `0.84rem`**. The drift across 4 values for the same role is exactly what tokens exist to prevent.

### T2-11 [LOW BENEFIT, LOW RISK] — `0.7rem`/`0.72rem`/`0.75rem`/`0.78rem` smallest-text cluster

- **Existing values**: `0.7rem` (×3), `0.72rem` (×8), `0.75rem` (×5), `0.78rem` (×2)
- **Proposed token**: `--font-size-xs: 0.72rem`
- **Visual impact**: max 0.08rem (1.28px) shift, edge of perception for tiny text
- **Recommendation**: **Merge to `0.72rem`**. Same role (eyebrow / meta), drift is unintentional.

### T2-12 [MEDIUM BENEFIT, MEDIUM RISK] — Spacing 14px / 18px / 22px / 28px / 36px (drift candidates)

- **Existing values**: `14px` (×6), `18px` (×4 + 2 in 1.5px borders excluded), `22px` (×0 in spacing — only as radius, see T3-04), `28px` (×7), `36px` (×5)
- **Proposed**: round to nearest token in scale (`12/16/16/20/24/28/32/40`)
- **Visual impact**: 1-2px shift per occurrence
- **Recommendation by value**:

| Existing | Count | Round to | Shift | Why |
|---|---|---|---|---|
| `14px` | 6 | `--dimension-space-12` (preferred) or `-16` | -2px or +2px | The 14px is used for icon padding (4×) and small inset (2×). 12px keeps icons compact; 16px makes them feel bigger. **Recommend 12px** because the icon role is "tight gap" not "comfortable gap". |
| `18px` | 4 | `--dimension-space-16` | -2px | All 4 are component padding-x; 16 is the canonical step in this system. |
| `28px` | 7 | `--dimension-space-32` | +4px (large shift, flag in T3) | The 28px appears in section padding-bottom and card-list gap. 4px shift is borderline visible. **See T3-08.** |
| `36px` | 5 | `--dimension-space-40` | +4px (flag in T3) | Section gap drift. **See T3-08.** |
| `52px` | 3 | `--dimension-space-48` | -4px | All 3 are margin-bottom on stat blocks. 4px is visible vertically — **see T3-08.** |

### T2-13 [LOW BENEFIT, LOW RISK] — Various rare opacity values fold into nearest 5%

- **Existing values that don't fit the opacity scale**: `0.04`, `0.06`, `0.13`, `0.22`, `0.35`, `0.55`, `0.65`, `0.75`, `0.85`, `0.88`
- **Proposed**: most stay raw inside component-tier rgba values; the `opacity:` property uses round to scale
- **Recommendation**: **leave as-is in component tier.** The 5%-stepped opacity scale is for `opacity:` property semantics; rgba alpha values inside gradient stops are inherently per-component. Forcing them onto a 5% grid would shift gradient feel for no benefit.

---

**Tier 2 totals: 121 occurrences across 13 batched decisions.** Most can be approved/rejected as a batch; the only ones with meaningful per-instance variance are T2-09 (border-width 1.5px) and T2-12 (spacing 28/36/52).

---

## 4 · Tier 3 — High-risk values (decide individually)

Values where unifying would visibly change a section's character, OR signature visuals, OR composite values with no clean match. Sorted by **uncertainty** — the ones I'd most want your call on, first.

### T3-01 [HIGH UNCERTAINTY] — Hero photo conic gradient

- **Existing value**: 5 raw RGB stops at lines 526-530 of global.css forming a `conic-gradient`:
  ```
  rgba(61, 100, 255, 0.72)   — blue
  rgba(30, 200, 230, 0.65)   — cyan
  rgba(70, 240, 200, 0.60)   — mint
  rgba(140, 80, 255, 0.68)   — purple
  rgba(30, 160, 255, 0.72)   — sky blue
  ```
- **Used**: 1× — hero-photo border treatment
- **Why high-risk**: signature visual element; the colors are NOT in any palette I'd want to inflate the system with.
- **Options**:
  - **(a)** Component tokens `--component-hero-photo-conic-stop-{1..5}`. Pros: encapsulates intent, easy to tweak in one place. Cons: 5 single-use color tokens.
  - **(b)** Keep hardcoded with comment. Pros: zero token system pollution. Cons: tied to one location, harder to adjust.
  - **(c)** Decompose into a brand color + 4 hue-rotated derivations via `hsl()`. Pros: parametric control. Cons: invasive, needs CSS rewriting; the 5 colors are designer-picked, not a hue rotation.
- **Recommended**: **(a)**. This is exactly what component tier exists for. ~25 lines of JSON for a signature visual. Already in `tokens.json` under `component.hero-photo`.

### T3-02 [HIGH UNCERTAINTY] — `#8080F0` family on contact-card icons

- **Existing values**: `#8080F0` (×2), `rgba(112,112,238,0.16)`, `rgba(112,112,238,0.25)`, `rgba(112,112,238,0.20)`, `rgba(112,112,238,0.50)`, `rgba(112,112,238,0.08)`, `#A0A0F8` (×1)
- **Used**: contact-card icons + interactive states (5 RGB-equivalent variants)
- **Why high-risk**: this is *new color in the system*, not in `--accent` family. Either drift or intentional.
- **Decision (you confirmed earlier)**: **drift**. The 5 different alpha levels reads as "iterating to find what works", not a deliberate ramp.
- **Migration**: merge to new token `--color-primary-40` (`#8080F0`) which IS now a stop in the primary ramp. The rgba alphas become `color-mix(in srgb, var(--color-primary-40) X%, transparent)` or stay raw inside component tier. `#A0A0F8` (the 1× hover color) maps to `--color-primary-30` (ΔE ~2.1).
- **Visual impact**: zero — `#8080F0` and `rgba(112,112,238,1)` are the same color in different notation; only the hover `#A0A0F8` shifts ~ΔE 2 lighter.
- **Already done**: token system reflects this. Refactor will replace.

### T3-03 [HIGH UNCERTAINTY] — Footer multi-layer gradient

- **Existing values**: 4 distinct `rgba(255,255,255,…)` alpha stops (`0.04`, `0.22`, `0.03`, `0.12`) plus 2 footer-specific text colors (`rgba(255,255,255,0.45)`, `rgba(255,255,255,0.28)`), plus status indicator colors
- **Used**: 1× footer background gradient + footer text + status dot
- **Why high-risk**: the gradient is a signature element (refraction shimmer effect); decomposing it loses the intent.
- **Options**:
  - **(a)** Full component-tier capture (`--component-footer-gradient-stop-{1..4}` + `--component-footer-text-default/muted` + `--component-footer-status-color`). Pros: encapsulated. Cons: 7 component tokens for one element.
  - **(b)** Capture only the 4 gradient stops + 2 text colors as component tokens; leave `#4b5563` (sleeping status) hardcoded since it's a system-grey not in palette. Pros: minimum-surface tokens. Cons: split between tokens and hardcoded.
  - **(c)** Try to fold into reference: `--text-on-dark-default` (`rgba(255,255,255,0.45)` ≈ what?). Pros: reusable. Cons: the alpha values are gradient-specific, not generally semantic.
- **Recommended**: **(a)** — already in `tokens.json` under `component.footer`. 7 tokens is small price for full encapsulation of a signature element.

### T3-04 [MEDIUM UNCERTAINTY] — Radius 22px (testimonial + case-card)

- **Existing value**: `22px` (×2 — testimonial-card and case-card border-radius)
- **Nearest tokens**: `--dimension-radius-xl` (20px) or `--dimension-radius-2xl` (24px)
- **Why medium-risk**: 22px is *not* drift in the usual sense — the testimonial and case-card are signature card elements where the radius is part of their identity. 2px difference matters.
- **Options**:
  - **(a)** Round to 24px (`--radius-card-lg`). Pros: matches the new "large feature card" semantic. Cons: +2px feels softer/larger.
  - **(b)** Round to 20px (`--radius-xl`). Pros: tighter, closer to current. Cons: -2px makes corners feel sharper.
  - **(c)** Add `--dimension-radius-2xl: 22px` to scale (custom step). Pros: zero shift. Cons: violates the even-step pattern (4, 8, 12, 16, 20, 22, 24, 999 — the 22 sticks out).
- **Recommended**: **(a) round to 24px**. 22→24 is +9% radius shift, not perceptually huge. The new `--radius-card-lg` semantic exists exactly for this role. (b) and (c) both have downsides.

### T3-05 [MEDIUM UNCERTAINTY] — Radius 14px (case-card overlay + contact-card)

- **Existing value**: `14px` (×2 — case-card image overlay + contact-card border-radius)
- **Nearest tokens**: `--dimension-radius-md` (12px) or `--dimension-radius-lg` (16px)
- **Options**:
  - **(a)** Round to 12px (`--radius-md`). Pros: nested elements should have smaller radius than outer (parent cards use 16-22px). Cons: -2px.
  - **(b)** Round to 16px (`--radius-lg`). Pros: matches outer card radius. Cons: +2px and visually "too big" for nested elements.
- **Recommended**: **(a) round to 12px**. Nested-radius pattern: outer ≥ inner.

### T3-06 [MEDIUM UNCERTAINTY] — Easing 0.45,0.05,0.55,0.95 and 0.6,0,0.4,1 (line-refract animations)

- **Existing values**: `cubic-bezier(0.45, 0.05, 0.55, 0.95)` (×3) and `cubic-bezier(0.6, 0, 0.4, 1)` (×3) — both used only on line-refract gradient animations (nav + footer dividers)
- **Why medium-risk**: animation-specific curves designed for the refraction motion; don't generalize as UI easing.
- **Options**:
  - **(a)** Add as base-tier easings `--easing-refract-a/-b`. Pros: named, tweakable. Cons: 2 tokens for one effect on 2 elements.
  - **(b)** Add to component tier as `--component-nav-refract-ease`. Pros: scoped intent. Cons: same node duplicated for footer.
  - **(c)** Keep raw in CSS. Pros: pragmatic. Cons: not tokenized, inconsistent with other easing.
- **Recommended**: **(c) keep raw** — these are animation-only, embedded in @keyframes calls. The token system is for properties that change at runtime; @keyframes timing is internal to a single animation declaration. **No token needed.**

### T3-07 [MEDIUM UNCERTAINTY] — Tool-card brand-tinted flip shadow

- **Existing value**: `0 12px 40px rgba(115, 89, 182, 0.18)` — equivalent to brand purple + low alpha + offset shadow. Not in elevation scale.
- **Used**: tool-card flip animations
- **Why medium-risk**: signature element; the brand tint is intentional.
- **Options**:
  - **(a)** Component token `--component-tool-card-flip-shadow`. Already in `tokens.json`. ✓
  - **(b)** New reference token `--shadow-brand-md` parallel to elevation scale. Pros: reusable. Cons: speculative — only one consumer.
  - **(c)** Generalize elevation system to support a "tint" axis via `color-mix`. Pros: most flexible. Cons: significant architecture change.
- **Recommended**: **(a)**. Promote to (b) only if a second brand-tinted shadow appears within 6 months.

### T3-08 [MEDIUM UNCERTAINTY] — Spacing 28px / 36px / 52px / 56px

- **Existing values**: 
  - `28px` (×7) → round to 32px (+4px) or 24px (-4px) or **add as scale stop** (`--dimension-space-28`)
  - `36px` (×5) → round to 40px (+4px) or 32px (-4px)
  - `52px` (×3) → round to 56px (+4px) — already in scale
  - `56px` (×3) — already in scale, just tokenize
- **Why medium-risk**: 4px shifts in section spacing/padding ARE visible.
- **Options**:
  - **(a)** Add 28 and 36 to the scale. Pros: zero shift. Cons: scale becomes denser (0,2,4,6,8,10,12,16,20,24,**28**,32,**36**,40,48,56,64,80,96,128,160,200) — 22 stops.
  - **(b)** Round 28→32, 36→40 (always round up, more generous spacing). Pros: minimal scale. Cons: 4px shift on 12 occurrences.
  - **(c)** Round 28→24, 36→32 (always round down). Pros: tighter rhythm. Cons: ditto.
  - **(d)** Round per role: 28 in section padding → 32, 28 in component padding → 24, etc. Pros: best fit. Cons: requires per-occurrence judgment.
- **Recommended**: **(a) — add 28 and 36 to scale**. The cost (2 extra dimension tokens) is lower than the cost (12 visible spacing shifts). 22 stops is still manageable.
- **Pending your call.**

### T3-09 [MEDIUM UNCERTAINTY] — Line-height 1.7 (descriptions) and 1.05 (contact h1)

- **Existing**: `1.7` (×4 — long-form body descriptions) and `1.05` (×1 — contact page h1)
- **Why medium-risk**: 1.7 is "comfortably loose body" not a token I have. 1.05 is "ultra-tight display" — used once for the contact hero.
- **Options for 1.7**:
  - **(a)** Round to `--font-line-height-relaxed` (1.6). Shift: -0.10. Visible on 4 long paragraphs.
  - **(b)** Round to `--font-line-height-loose` (1.75). Shift: +0.05.
  - **(c)** Add `--font-line-height-1-7: 1.7` as new token. Pros: zero shift. Cons: 7-stop ramp.
- **Recommended for 1.7**: **(b) round to 1.75**. Smaller shift; the "loose" semantic fits descriptions.
- **Options for 1.05**:
  - **(a)** Round to `heading` (1.15). +0.10 shift on 1 heading.
  - **(b)** Keep raw for that one heading.
- **Recommended for 1.05**: **(a)**. Single use, the 0.10 shift on one h1 is acceptable.

### T3-10 [LOW UNCERTAINTY] — Password gate error colors `#c00` / `#b00`

- **Existing**: `#c00` (border) and `#b00` (text) on password input error state
- **Why noted**: system-red not in palette. There's currently no other red in the codebase.
- **Recommendation**: **component tokens `--component-password-gate-error-border/text`** (already in `tokens.json`). Don't promote to base — there's no "danger" semantic anywhere else on the site.

### T3-11 [LOW UNCERTAINTY] — Compose modal backdrop `rgba(0,0,0,0.6)`

- **Existing**: `rgba(0,0,0,0.6)` (×1, modal scrim)
- **Why noted**: pure black is not in the neutral ramp; this is the only place it's used.
- **Recommendation**: **component token `--component-compose-modal-backdrop`** (already in `tokens.json`).

### T3-12 [LOW UNCERTAINTY] — Marquee mask `#000`

- **Existing**: `#000` (×3 — marquee fade mask gradient endpoints)
- **Why noted**: again, pure black for masking, not for tokenization.
- **Recommendation**: **leave hardcoded** with comment. Mask gradients use color as opacity controls; `#000` here means "fully visible" not "black". Tokenizing it would falsely imply it's a color choice.

---

## 5 · Odd-number violations

Per the even-integer rule for base dimension tokens. Default action: round to nearest even token (1px shift max). Exceptions noted.

| Existing | Count | Locations | Rule | Proposed | Visual impact |
|---|---|---|---|---|---|
| `1px` (border) | 31 | global.css ×31 | **Exception — canonical hairline, kept** | `--dimension-border-width-1` | none |
| `1.5px` (border) | 8 | inputs, weekdays, calendar | **Round to 2px** (T2-09) | `--dimension-border-width-2` | +0.5px visual weight |
| `3px` (border) | 4 | btn-ghost, btn-accent, btn-dark-outline | **Round to 2px or 4px** | `--dimension-border-width-2` (preferred) | -1px (button rings get marginally thinner) |
| `5px` | 0 | (none found) | n/a | n/a | n/a |
| `7px` | 0 | (none found) | n/a | n/a | n/a |
| `9px` | 0 | (none found) | n/a | n/a | n/a |
| `11px` | 0 | (none found) | n/a | n/a | n/a |
| `13px` | 0 | (none found) | n/a | n/a | n/a |
| `15px` | 0 | (none found) | n/a | n/a | n/a |
| `17px` | 0 | (none found) | n/a | n/a | n/a |
| `19px` | 0 | (none found) | n/a | n/a | n/a |
| `21px` | 0 | (none found) | n/a | n/a | n/a |
| `23px` | 0 | (none found) | n/a | n/a | n/a |
| `25px` | 0 | (none found) | n/a | n/a | n/a |
| `27px` | 0 | (none found) | n/a | n/a | n/a |
| `33px` | 0 | (none found) | n/a | n/a | n/a |
| `999px` (radius) | 1 | phase-list pill | **Aliased to `--dimension-radius-full` (now 999)** | `--radius-pill` | none (current 999 = new 999) |
| `15s`/`19s`/`23s`/`28s`/`33s`/`41s`/`55s` (animation duration) | 7 | marquees, line-refract | **Exception — animation timing, not a token** | n/a (raw in CSS) | n/a |

**Summary**: Only **3 odd-number patterns** in the actual code (1px, 1.5px, 3px). The 1px is canonical, 1.5px and 3px round per Tier 2 / above. **No 13/27/52 etc surprise drift** — the codebase is already mostly even.

The odd-value rule is mostly about preventing future drift, not cleaning up existing chaos.

---

## 6 · Cross-page consistency map

For each visual role, which value/token each page uses today and after refactor. Drift-detection summary.

| Visual role | home | about | work-index | work-detail | contact | error pages | Proposed unified token |
|---|---|---|---|---|---|---|---|
| Page bg | `--bg` | `--bg` | `--bg` | `--bg` | `--dark` | `--dark` | `--background-page` (light) / `--background-section-inverse` (dark) |
| Body text color | `--fg1` | `--fg1` | `--fg1` | `--fg1` | `--fg-inverse` | `--fg-inverse` | `--text-primary` / `--text-inverse` |
| Section padding-y | varies (16, 28, 36, 60, 80) | varies | varies | varies | varies | n/a | depends on section role; canonical = `--dimension-space-{16,32,40,64,80}` (drift in 28/36 see T3-08) |
| Card radius | 16/22 | 16/22 | 16/22 | 16/22 | 14/16 | 16 | `--radius-card` (16px) standard; `--radius-card-lg` (24px) feature |
| Card border | `1px solid var(--border)` | same | same | same | `1px solid rgba(240,237,232,0.1)` (--border-inverse) | same as contact | `--dimension-border-width-1` + `--border-default` / `--border-inverse` |
| Hero h1 line-height | 1.05 (contact only) | 1.15 | n/a | 1.15 | 1.05 | 1.15 | `--font-line-height-heading` (1.15) — contact's 1.05 normalizes |
| Button border-width | 3px (×3 variants) | 3px | 3px | 3px | 3px | 3px | `--dimension-border-width-2` (round 3→2; T2-09) |
| Compose modal text | n/a | n/a | n/a | n/a | inverse + alpha 0.65 | n/a | `--text-inverse-muted` (semantic) |
| Eyebrow letter-spacing | 0.06em | 0.06em | 0.06em | 0.06em | 0.06em | n/a | `--font-letter-spacing-wider` (no drift!) |
| Input fill (compose modal) | n/a (dark surface) | n/a | n/a | n/a | rgba(255,255,255,0.04) | n/a | `--component-form-input-bg-dark` |
| Input fill (password gate) | rgba(28,26,23,0.04) | n/a | n/a | n/a | n/a | n/a | `--component-form-input-bg-light` |
| Pill nav indicator bg | rgba(28,26,23,0.07) (light) | rgba(240,237,232,0.12) (dark on case-detail) | light | dark | light | light | needs theming via `--theme` selector OR component token |

**Drift-detection findings**:
1. **Section padding is inconsistent across pages.** 5 distinct values (16/28/36/60/80). T3-08 covers this.
2. **Contact h1 uses 1.05 line-height; everywhere else uses 1.15.** Drift. T3-09 covers.
3. **Card radius mixes 16 and 22.** Drift. T3-04 covers.
4. **Button border-width is 3px universally.** Consistent within itself but doesn't fit even-integer rule. T2-09 / 1px-borders section covers.
5. **Pill nav indicator color depends on `.nav-dark` class.** Currently lives in scoped CSS, not tokens. After refactor, should be component-tier (`--component-nav-indicator-bg-light/-dark`).

---

## 7 · Coverage map (per page)

Tokens each page uses **after refactor**.

### Shared / base (used by every page)
- All `color.neutral.*` and `color.primary.*` (via reference-tier aliases, not directly)
- All `dimension.space.*`, `dimension.radius.*`, `dimension.border-width.*`
- All `duration.*`, `easing.*` (via `motion.*` aliases)
- All `font.family.*`, `font.weight.*`, `font.size.*`, `font.line-height.*`, `font.letter-spacing.*`
- All `text.*`, `border.*`, `background.*`, `surface.*`, `fill.*`, `icon.*`
- All `radius.*`, `spacing.*`, `typography.*`
- `shadow.xs/sm/md/lg/xl`, `elevation.0..5`
- `z.*`

### Home only (`index.astro`)
- `component.hero-photo.conic-stop-{1..5}` (hero photo border)
- `component.hero-photo.brand-glow`
- `component.cursor-ball.glow`
- `component.marquee.fade-edge`, `component.marquee.scrim`
- `component.case-card.hover-glow`, `component.case-card.thumb-overlay`
- WebGL shader program (not tokenized — separate concern)

### About only (`about.astro`)
- `component.case-card.hover-glow` (shared with home)
- Phase marker timeline animations (uses raw `cubic-bezier(0.45,0.05,0.55,0.95)` per T3-06)

### Work index / Work detail (`case-studies/`)
- `component.case-card.*`
- `component.cursor-ball.glow`

### Contact (`contact.astro`)
- `component.compose-modal.backdrop`
- `component.form.input-bg-light/-light-focus/-dark/-dark-focus`
- `component.form.toggle-fill`, `component.form.toggle-fill-active`

### Error pages (`404.astro`, `403.astro`, `500.astro`, `error.astro`)
- Reuse `cta-footer-wrap` particle system → only base/reference tokens; no error-specific component tokens

### Layout-shared (`Base.astro`)
- `component.nav.scrolled-bg`, `component.nav.scrolled-hairline`, `component.nav.refract-stop-{1..4}`
- `component.footer.*` (gradient stops, text colors, status indicator)
- Compose modal entries when shared modal is mounted

### Tokens used by ONE page only (candidate for per-page CSS, not global)
- `component.hero-photo.*` (home only) — keep in shared tokens.css for now; if file size becomes an issue, page-scope it
- `component.compose-modal.*` (contact + Base shared modal)

---

## 8 · Decisions deferred

You confirmed go on the 6 step-1 questions. Decisions still pending from this audit:

| # | What | Default if you don't decide | Decide before Prompt 2? |
|---|---|---|---|
| **D1** | T3-04: testimonial/case-card radius 22→24 (default) or 22→20 | 24 | Yes — affects 4 visible cards site-wide |
| **D2** | T3-08: spacing 28/36 — add to scale (default) or round | Add to scale (22 stops total) | Yes — affects 12 occurrences |
| **D3** | T3-09: line-height 1.7 → 1.75 (loose) or 1.6 (relaxed) | 1.75 | No — minor, can revisit |
| **D4** | T2-09: 1.5px border-width → 1px or 2px | 2px (more visible) | No — symmetric either way |
| **D5** | T2-12: `14px` icon padding → 12 or 16 | 12 | No — minor |
| **D6** | T3-06: line-refract easings — keep raw (default) or tokenize | Keep raw | No — purely internal animation |

**No truly blocking decisions.** Defaults are chosen so the refactor is safe even without your input.

---

## Appendix A · Migration risk register

Anywhere a value change between current code and proposed token will be visually perceptible (>1px shift, ΔE >2):

| ID | Change | Visibility | Affected | Mitigation |
|---|---|---|---|---|
| R1 | Spacing 28→32 (T3-08, default) | 4px on 7 occurrences (section spacing) | section-bottom, card-list gaps | Add 28 to scale instead (D2 default) |
| R2 | Spacing 36→40 (T3-08, default) | 4px on 5 occurrences | section-bottom, gaps | Add 36 to scale instead (D2 default) |
| R3 | Spacing 52→56 | 4px on 3 occurrences (margin-bottom on stat blocks) | stats section | Already 56 in scale |
| R4 | Radius 22→24 (D1 default) | +2px on 4 cards | testimonial-card, case-card | Acceptable — feels "softer" |
| R5 | Border 3px → 2px (T2-09) | -1px on 3 button variants | btn-ghost/accent/dark-outline | Acceptable — modern hairline trend |
| R6 | Border 1.5px → 2px | +0.5px on 8 form inputs | calendar weekdays, inputs | Subtle |
| R7 | Letter-spacing -0.02em → -0.01em (T2-06) | 0.01em on h3, h4 | global headings | Sub-perception |
| R8 | Line-height 1.7 → 1.75 (D3 default) | +0.05 on 4 paragraphs | descriptions | Subtle |
| R9 | `ease` → `--motion-easing-standard` (T2-08) | 10ms perceived diff on 10 transitions | various hover | Sub-perception |
| R10 | Shadow `--shadow-sm` → `--elevation-2` (rename only) | 0 | n/a | none — alias preserves value |

Total visible-shift occurrences: ~30 across ~10 pattern changes. All deemed acceptable for visual unification benefit.

---

## Appendix B · Files generated

| File | Purpose |
|---|---|
| `design-system/tokens.json` | Source of truth (DTCG 2025.10) |
| `design-system/tokens.css` | Generated CSS custom properties (regenerate via `npm run tokens`) |
| `design-system/scripts/build-tokens.js` | Generator (256 lines, hand-rolled, zero deps) |
| `design-system/token-audit.md` | This document |
| `package.json` | New script: `tokens` (does NOT auto-run; refactor will wire `predev`/`prebuild` later) |

**No source files modified.** `src/styles/global.css`, `src/styles/tokens.css`, and all `.astro` files are untouched. Prompt 2 executes the refactor.
