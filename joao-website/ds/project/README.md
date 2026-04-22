# JJ Design System

**Personal brand and design system for João Jacinto** — Senior Product Designer with 10+ years across fintech, SaaS, and media tech. Based in Aveiro, Portugal. Currently at Anchorage Digital (crypto/web3 infrastructure).

---

## System Name — 3 Candidates

Choose one. Each works as a component prefix (e.g. `[Name]Button`, `[Name]Card`).

| Name | Origin | Vibe |
|------|--------|-------|
| **Jacinto** | His surname | Mature, Portuguese, sounds like a publishing house. `JacintoButton`, `JacintoCard` |
| **Jota** | Portuguese letter "J" | Spare, editorial, confident. `JotaButton`, `JotaCard` |
| **Pedra** | Portuguese for "stone/rock" | Solid, durable, precise. Not startup-y. `PedraButton`, `PedraCard` |

> Recommendation: **Jacinto** — it's ownable, sounds like a seasoned European creative brand, and carries his full identity.

---

## Sources

- **Codebase**: `Repository/jjwebsite/joao-website/` — full portfolio website (`index.html` is the entire site: all HTML/CSS/JS in one file)
- **Project instructions**: `Repository/jjwebsite/PROJECT_INSTRUCTIONS.md` — comprehensive brief covering content, design system, and quality standards
- **Brand assets**: `Repository/Assets/Brand/` — JJ wordmark SVG + PNG
- **Case study images**: `Repository/Assets/Case studies/` and per-project subfolders (Namecheap, Talkdesk, SY-DS, SY-Webinar, SY-Research)
- **No Figma link was provided** — design system is derived from the codebase and the brief

---

## Who is JJ

**João Jacinto** (he/him) — Senior Product Designer, Aveiro, Portugal.

Career: Be.Ubi → Namecheap → Talkdesk → Hopin → StreamYard → Anchorage Digital (current, 2024+).

10+ years, 5M+ users impacted, 8 industries: AI/CX, live streaming, e-commerce, engineering platforms, crypto infrastructure, media tech, GIS, 3D.

Personality: INTJ-A, Enneagram Type 5. Values: awareness, creativity, precision, respect, gratitude.
Interests beyond design: music production, drums, VR, gaming, football.

Contact: jjacinto.mail@gmail.com · linkedin.com/in/joaofranciscojacinto/

---

## Surfaces

| Surface | Description |
|---------|-------------|
| **Portfolio website** | Single-file vanilla HTML/CSS/JS SPA. Four pages: Home, About, Case Studies, Contact. Self-hosted on a NAS via Docker + nginx. |
| **Case study documents** | Long-form reading. Structured: problem → context → process → decisions → outcome → impact. |
| **Presentation decks** | 16:9 slides for work contexts. |
| **Personal project interfaces** | Ad hoc prototypes and experimental UIs. |

---

## CONTENT FUNDAMENTALS

### Voice & Tone
- **First person, direct.** "I designed..." not "A design was created..."
- **Specific over vague.** Numbers, decisions, tradeoffs. Not "innovative holistic synergy."
- **Calm authority.** Confident without over-explaining. The voice of someone who has opinions and doesn't need to sell them.
- **Editorial, not corporate.** Closer to a well-written product blog post than a résumé bullet.
- **Honest.** Reflective about process and tradeoffs. "We chose X over Y because..." not "We delivered a seamless experience."

### Banned words/phrases
`innovative`, `holistic`, `synergy`, `leverage`, `seamless`, `passionate about`, `I'm excited to`, `deep dive`, `game-changer`, `user-centric` (when used as buzzword not substance).

### Casing
- Navigation: title case (`Case Studies`, `About`)
- Section labels/eyebrows: lowercase or small caps (`my career in numbers`, `you may like to read:`)
- Headlines: sentence case in body; all-caps only for decorative marquee text
- CTAs: sentence case (`Let's connect`, `View my CV`)

### Numbers and claims
Always substantiated: "5M+ users", "10+ years", "50,000 concurrent users". Never fabricated.

### Emoji usage
Used sparingly and personally — `👋` in hero greeting, `♥` in tagline. Never as design elements or bullet replacements.

### I vs. you
Predominantly "I" in first-person narrative. "You" when addressing the reader directly (e.g. contact page: "Thanks for the visit. Let's chat.").

### Tone examples (from live site)
- Hero: *"Hi 👋 I'm João Jacinto."* — warm, immediate
- Tagline: *"Designing digital products with startups and enterprises since 2015, with love ♥"* — personal, specific
- About: *"From a young age, I've been innately drawn to creative pursuits."* — reflective, not braggy
- Contact: *"Thanks for the visit. Let's chat."* — inviting, low-friction, no filler

---

## VISUAL FOUNDATIONS

### Color

**Light mode (primary)**
| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#ECEAE5` | Page background — warm off-white |
| `--surface` | `#F7F5F1` | Cards, elevated surfaces |
| `--fg1` | `#1C1A17` | Primary text, headings |
| `--fg2` | `#6B6560` | Secondary text, descriptions |
| `--fg3` | `#9B948D` | Muted text, labels, timestamps |
| `--accent` | `#A0644E` | Terracotta — the signature color |
| `--accent-subtle` | `#EDE0D9` | Accent tinted backgrounds |
| `--border` | `rgba(28,26,23,0.08)` | Dividers, card outlines |
| `--border-strong` | `rgba(28,26,23,0.16)` | Stronger borders, input fields |
| `--dark` | `#1C1A17` | Dark section backgrounds (contact/footer) |

**Dark mode**
| Token | Value |
|-------|-------|
| `--bg` | `#1C1A17` |
| `--surface` | `#262320` |
| `--fg1` | `#F0EDE8` |
| `--fg2` | `#9B948D` |
| `--fg3` | `#6B6560` |
| `--accent` | `#C07B60` |
| `--accent-subtle` | `#2E201A` |

**Accent rationale:** Muted terracotta (`#A0644E`) — earthy, warm, ownable. Not a designer blue. Not a startup purple. Feels editorial and unhurried. At 900 weight in Hanken Grotesque, display text carries all the visual weight; the accent color supports hierarchy rather than screaming for attention.

### Typography

**LOCKED. Do not substitute without explicit approval.**

| Role | Typeface | Weight | Usage |
|------|----------|--------|-------|
| Display / hero | Hanken Grotesk | 900 (Black) | H1, marquee text, stat numbers, large section titles |
| Body / UI | Mona Sans | 400 (Regular) | Body copy, nav links, captions, labels, meta text |

> **Font availability caveat:** Hanken Grotesk 900 is on Google Fonts. Mona Sans (GitHub's typeface) is NOT on Google Fonts — use the GitHub CDN: `https://github.githubassets.com/assets/mona-sans.woff2`. If CDN fails in a context, substitute **DM Sans 400** from Google Fonts and flag it.

**Type scale (8px grid)**
| Step | Size | Weight | Font | Letter-spacing | Usage |
|------|------|--------|------|----------------|-------|
| `--text-display` | `clamp(3.5rem, 8vw, 7rem)` | 900 | Hanken | `-0.04em` | Hero headline |
| `--text-h1` | `clamp(2.5rem, 5vw, 4rem)` | 900 | Hanken | `-0.035em` | Page titles |
| `--text-h2` | `clamp(1.8rem, 3vw, 2.6rem)` | 900 | Hanken | `-0.03em` | Section titles |
| `--text-h3` | `1.3rem` | 900 | Hanken | `-0.02em` | Sub-section headers |
| `--text-body-lg` | `1.1rem` | 400 | Mona Sans | `0` | Lead paragraphs |
| `--text-body` | `0.95rem` | 400 | Mona Sans | `0` | Body copy |
| `--text-sm` | `0.85rem` | 400 | Mona Sans | `0` | Captions, secondary info |
| `--text-label` | `0.78rem` | 400 | Mona Sans | `0.04em` | Eyebrow labels, uppercase |

### Grid & Spacing
- **Base unit:** 8px
- **Container:** max-width `1140px`, centered
- **Page padding:** `clamp(20px, 5vw, 40px)`
- **Section gap:** `clamp(80px, 10vw, 120px)`
- **Card padding:** `32px` (desktop), `20px` (mobile)
- **Layout philosophy:** generous whitespace; asymmetric layouts where appropriate; content-first — no decorative blobs or hero illustrations

### Border Radius
- `--radius-sm`: `8px` — buttons, tags, small elements
- `--radius-md`: `16px` — cards, modals
- `--radius-full`: `100px` — pill buttons, nav capsule, avatars

### Cards
- Background: `--surface` (`#F7F5F1`)
- Border: `1px solid --border` (optional, subtle)
- Shadow: `0 1px 4px rgba(0,0,0,0.04)` at rest; `0 8px 30px rgba(0,0,0,0.06)` on hover
- Hover: `translateY(-3px)` + elevated shadow
- Radius: `16px`
- No colored left-border accents

### Animation & Motion
- **Scroll reveal:** `opacity 0 → 1` + `translateY(24px → 0)`, `cubic-bezier(0.22, 1, 0.36, 1)`, `650ms`. Stagger with `80ms` delay increments.
- **Marquee:** horizontal infinite scroll, `20–30s linear` duration. Used for large decorative typography (WELCOME, ABOUT ME, CASE STUDIES).
- **Hover transitions:** `0.25s ease` for color/border changes; `0.3s` for transforms.
- **Card hover:** `translateY(-2px to -3px)` — subtle, never dramatic.
- **Tool card flip:** 3D `rotateY(180deg)`, `0.6s`, `preserve-3d`. Used for tool stack.
- **No bounce, no spring, no heavy easing.** Motion is calm and purposeful.
- **Respects `prefers-reduced-motion`.**

### Backgrounds
- **Light sections:** `--bg` (`#ECEAE5`) — all standard content
- **Dark sections:** `--dark` (`#1C1A17`) — contact / footer / CTA
- **No full-bleed hero illustrations.** No decorative blobs. No gradients as backgrounds.
- **Marquee text** uses `rgba(0,0,0,0.06)` on light bg — ghost text, purely decorative.

### Imagery
- **Case study images:** full-width, `aspect-ratio: 16/10`, `object-fit: cover`. No filters applied.
- **Avatar/profile images:** circular crop, `object-fit: cover`.
- **Brand logos:** grayscale-leaning, `opacity: 0.7` at rest → `opacity: 1` on hover.
- No grain, no warm/cool grading enforced — images used as-provided.
- No hand-drawn illustrations or SVG imagery.

### Hover & Press States
- **Links:** underline with `text-underline-offset: 3px`, `text-decoration-thickness: 1px`. Color shift to accent on hover.
- **Buttons:** `translateY(-2px)` + box-shadow lift. No color inversion.
- **Ghost/outline buttons:** border darkens (`rgba(0,0,0,0.07)` → `var(--fg1)`) on hover.
- **Accent buttons:** darken `10%` on hover, keep color family.
- **Press state:** no explicit implementation; relies on OS/browser default.

### Borders & Dividers
- Divider: `1px solid var(--border)` — used between hero and body, footer top
- Card outlines: optional; when used, `1px solid var(--border)`
- Nav capsule: `rgba(255,255,255,0.5)` background, transparent border

### Transparency & Blur
- **Sticky nav (scrolled):** `backdrop-filter: blur(16px)` + semi-transparent bg (`rgba(236,234,229,0.82)`)
- **Mobile menu overlay:** `backdrop-filter: blur(20px)` + near-opaque bg (`rgba(236,234,229,0.97)`)
- **Blur used conservatively** — only on fixed/overlay elements, not cards

### Corner Radii summary
`8px` (small) · `16px` (cards/modals) · `100px` (pills/nav)

---

## ICONOGRAPHY

- **No icon system or icon font** in the existing codebase. Icons are sparse and purposeful.
- **Brand logos** (Figma, Framer, etc.) fetched via `cdn.simpleicons.org` — inline `<img>` tags, not SVG sprite.
- **Unicode arrows** used as content indicators: `→` in achievement lists, `•` for list bullets.
- **No emoji** used as icons. Emoji appear only in copy (`👋`, `♥`) and are never decorative components.
- **LinkedIn "in"** badge is text-only (`font-size: 0.7rem; font-weight: 700`) inside a small bordered box — no icon font.
- **Hamburger menu** is pure CSS (`::before`/`::after` pseudo-elements on a `<span>`).
- **Back arrow** in case study detail is `←` unicode character with text.
- **JJ wordmark** (SVG, `assets/JJ.svg`) is the sole brand mark. A custom letterform of "JJ" in a clean geometric style. Used as nav logo (`width: 30px, height: 26px`).

### Usage rules
- Use `cdn.simpleicons.org/{name}` for tech/tool logos — same approach as codebase.
- For navigation/UI icons: prefer unicode characters over SVG if simple enough. For more complex icons, inline SVG only (no icon font dependencies).
- Never rasterize icons for UI use — keep SVG or unicode.

---

## File Index

```
/
├── README.md                    ← This file
├── SKILL.md                     ← Agent skill descriptor
├── colors_and_type.css          ← CSS custom properties (colors + typography)
├── assets/
│   ├── JJ.svg                   ← Brand wordmark
│   └── images/
│       ├── joao-photo.webp      ← Profile photo
│       ├── case-webinar.avif    ← Case study: Webinar customization (StreamYard)
│       ├── case-research.avif   ← Case study: Research ops (StreamYard)
│       ├── case-ds.avif         ← Case study: Design system (StreamYard)
│       ├── case-talkdesk.avif   ← Case study: AI training platform (Talkdesk)
│       └── case-namecheap.avif  ← Case study: Support chat (Namecheap)
├── preview/
│   ├── type-display.html        ← Display + H1/H2 type specimens
│   ├── type-body.html           ← Body + label type specimens
│   ├── type-hierarchy.html      ← Full typographic hierarchy in context
│   ├── colors-brand.html        ← Brand color swatches
│   ├── colors-semantic.html     ← Semantic / dark mode colors
│   ├── spacing-tokens.html      ← Spacing scale, border radius, shadows
│   ├── components-nav.html      ← Navigation component
│   ├── components-buttons.html  ← Buttons and CTAs
│   ├── components-cards.html    ← Case study + testimonial cards
│   ├── components-stats.html    ← Stat display component
│   └── components-tags.html     ← Tags, badges, meta labels
└── ui_kits/
    └── website/
        ├── README.md            ← UI kit notes
        ├── index.html           ← Interactive portfolio prototype
        ├── tokens.js            ← Shared design tokens
        ├── Nav.jsx              ← Navigation component
        ├── Hero.jsx             ← Hero section
        ├── CaseCard.jsx         ← Case study card
        └── CaseStudyDetail.jsx  ← Case study detail view
```
