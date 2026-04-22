---
name: jj-design
description: Use this skill to generate well-branded interfaces and assets for João Jacinto's personal brand (JJ), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping the portfolio website and related surfaces.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick reference

**Brand:** JJ — João Jacinto, Senior Product Designer (Aveiro, Portugal)
**Surfaces:** Portfolio website · Case study documents · Presentation decks · Personal project interfaces

**System name candidates:** Jacinto · Jota · Pedra (see README for rationale)

**Accent color:** `#3D3DB5` — midnight indigo (not a standard blue, not a purple — deliberate and ownable)
**Background:** `#ECEAE5` — warm off-white
**Dark sections:** `#1C1A17` — warm near-black

**Display font:** Hanken Grotesk 900 — large headers, stat numbers, marquee text
**Body font:** Mona Sans 400 (GitHub CDN) — all body copy, nav, labels. Fallback: DM Sans 400

**Key interaction patterns:**
- Cards/buttons: 24px border (cards) / 3px border (buttons) — subtle dark at rest → transparent accent on hover
- Buttons: `scaleX(0→1)` pseudo-element fill sweep left→right; icon slides in alongside
- Nav logo: single J at rest; hover reveals JJ with letter-spacing + accent color + subtle lilac circle
- Nav pill: smooth sliding indicator, `cubic-bezier(0.25,0.46,0.45,0.94)`, press scales to 0.93
- Hover lifts: `translateY(-4px)` + elevated shadow
- Scroll reveal: `opacity + translateY(24px)`, `cubic-bezier(0.22,1,0.36,1)`, 650ms

**Assets location:** `assets/JJ.svg` (brand mark), `assets/images/` (case study + profile photos)
**UI kit:** `ui_kits/website/index.html` — full interactive portfolio prototype (React + Babel)
