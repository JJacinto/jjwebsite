# Project Instructions — João Jacinto Personal Website

## Who I am

**João Jacinto** — Senior Product Designer based in Aveiro, Portugal.  
Currently at **Anchorage Digital** (crypto/web3 infrastructure). Previously: **StreamYard** (live streaming), **Talkdesk** (AI/CX), **Namecheap** (engineering platform), **Hopin**, **Be.Ubi**.  
Designing digital products since **2015**. 10+ years, 5M+ users impacted, 8+ industries.

Personality: INTJ-A, Enneagram Type 5. Values awareness, creativity, precision, respect, and gratitude.  
Interests beyond design: music production, drums, VR, gaming, football.

LinkedIn: https://linkedin.com/in/joaofranciscojacinto/  
Email: jjacinto.mail@gmail.com

---

## Website purpose

This is my **personal portfolio and professional home on the web**. Its goals in order of priority:

1. **Attract the right opportunities** — freelance, senior/lead roles, advisory. Every section should signal strategic, senior-level thinking, not just execution.
2. **Showcase work depth** — case studies should go beyond pretty screens. Show problem framing, process, decisions, tradeoffs, impact.
3. **Express personality** — warm but precise. Opinionated but collaborative. The site should feel like *me*, not a generic designer portfolio.
4. **Demonstrate craft** — the site itself is a piece of design work. It is hand-coded, not a template. That matters and should be evident.

---

## Tech stack (non-negotiable constraints)

- **Single file: `index.html`** — all HTML, CSS, and JS live here. No build step, no bundler, no npm.
- **Vanilla HTML/CSS/JS only** — no React, Vue, Tailwind, or any framework.
- **Fonts via Google Fonts CDN** — Plus Jakarta Sans, Playfair Display.
- **No external JS libraries** unless absolutely essential (and CDN-only if so).
- **Docker + nginx** for serving — `docker-compose.yml` and `nginx.conf` already configured.
- **Hosting: UGREEN DXP2800 NAS** — always on, locally served, optionally exposed via Cloudflare Tunnel.
- **Git** for version control.

When making changes: edit `index.html` only. Never modify `docker-compose.yml`, `nginx.conf`, or `Makefile` unless I explicitly ask.

---

## Design system (established — do not deviate without asking)

```
Background:       #EDEAEE  (warm off-white/lavender)
Dark background:  #1A1A1A
Surface (cards):  #FFFFFF
Text primary:     #1A1A1A
Text secondary:   #6B6B6B
Text muted:       #9A9A9A
Accent:           #7C6CEB  (purple)
Accent light:     rgba(124, 108, 235, 0.12)
Accent glow:      rgba(124, 108, 235, 0.4)
Border:           rgba(0, 0, 0, 0.07)

Font heading:     Plus Jakarta Sans, weights 700–800, letter-spacing -0.03em to -0.04em
Font body:        Plus Jakarta Sans, weight 400–500
Border radius:    16px
Container width:  1140px
Section gap:      clamp(80px, 10vw, 120px)
```

Motion principles: scroll-reveal with opacity + translateY(24px), cubic-bezier(0.22, 1, 0.36, 1), 650ms. Marquee animations for large decorative text. Hover states are subtle: translateY(-2...-3px) + soft box-shadow.

---

## Current state of the site

### ✅ Built and live
- **Nav** — fixed, pill-style center links, blur-on-scroll, mobile hamburger menu
- **Home / Hero** — greeting, rotating subtitle, photo placeholder (awaiting real photo), marquee background, tagline, CTA
- **Home / Brands** — scrolling marquee: Namecheap, Talkdesk, StreamYard, Hopin, Be.Ubi
- **Home / Stats** — 10+ years, 5M+ users, 8 industries, 5 products launched
- **Home / Testimonials** — masonry grid, 6 real testimonials from colleagues (Daniel Cardoso, Renato Duarte, Bartlomiej Mucha, João Costa, Xavier Gallego, Will Brett-Atkin)
- **About / Why** — "What is my why?" philosophy text
- **About / About me** — personality type, values, passions (3-col grid)
- **About / Journey** — 4-paragraph narrative from hi5 themes at 15, through IT engineering degree, to current career
- **About / Tool stack** — Figma, Framer, Adobe Creative Cloud, HTML, CSS, ChatGPT
- **Contact** — email + LinkedIn, dark background section
- **Footer** — copyright, "custom-designed and built" note

### ⬜ Placeholder / not yet built
- **Case Studies** — currently just a "coming soon" message. This is the highest priority missing section.
- **Hero photo** — placeholder circle. Needs a real image when I provide one.
- **Open Graph / SEO meta tags** — missing entirely.
- **Dark mode** — not implemented (aspirational, not urgent).
- **Contact form** — currently just links. A functional form (via mailto or a service) would be better.
- **Resume download** — no CV link exists yet.

---

## Pages and their intent

### Home
The "first impression" page. Should communicate who I am, social proof, and invite deeper exploration — all within a single scroll. Tone: confident, warm, human.

### About
The "behind the work" page. My philosophy, personality, and path. This is where I become a person, not just a title. Tone: reflective, honest, specific (avoid clichés).

### Case Studies
The "proof" page. Each case study should tell a story: problem → context → process → decisions → outcome → impact. Not just deliverables. Prioritise depth over volume. 2–4 strong cases beat 10 shallow ones. Aim for a card grid entry point with individual case study detail views (can be additional hidden page sections).

### Contact
Low friction. Clear. Dark, contrasting section. Should feel like an invitation, not a form to fill in.

---

## Figma integration workflow

I design in Figma and use the Figma MCP connected to this project. When working with Figma:

- Use `get_design_context` or `get_screenshot` to inspect my designs before coding them.
- Match spacing, typography, colour, and component behaviour exactly — pixel-perfect is the standard.
- If a Figma component maps to an existing HTML/CSS pattern in `index.html`, extend it rather than duplicating.
- When I say "implement this from Figma", fetch the design first, then translate it to vanilla HTML/CSS — do not guess or approximate.
- Use `get_variable_defs` to check if Figma tokens match the CSS variables above before assuming.

---

## Writing and copy standards

- **Voice**: first-person, direct, no filler phrases ("I'm passionate about..." is a cliché — be specific instead).
- **Testimonials**: real quotes only, never fabricated.
- **Case study copy**: lead with the business/user problem, not the solution. Quantify impact wherever possible.
- **Avoid**: "innovative", "holistic", "synergy", "leverage", "seamless", and other empty design buzzwords.
- **Footer year**: keep current (2024 is stale — update to reflect the actual year when regenerating).

---

## Quality standards (non-negotiable)

- **Responsive**: mobile-first. Test at 375px, 768px, 1280px minimum. Breakpoints: 680px (mobile), 900px (tablet).
- **Accessibility**: semantic HTML (proper heading hierarchy, `alt` attributes, `aria-label` on icon buttons), sufficient colour contrast (WCAG AA).
- **Performance**: no render-blocking scripts. Images should be compressed and lazy-loaded. Inline SVGs preferred over icon fonts.
- **Scroll reveal**: every new section must include the `.reveal` class pattern already established in the codebase.
- **Animations**: purposeful only. No animation for animation's sake. Reduce-motion should be respected (`@media (prefers-reduced-motion: reduce)`).
- **No console errors**.

---

## How to work with me

- **Read the existing code before writing anything new.** Understand what's already there.
- **Extend, don't rewrite.** The design system, component patterns, and page structure are intentional.
- **Ask before changing the design system.** Colours, fonts, and spacing are not arbitrary.
- **One page at a time.** Don't refactor the entire file when touching one section.
- **Commit-ready output**: changes to `index.html` should be complete and not leave the file in a broken state.
- **When in doubt about copy or content**, use a placeholder clearly marked `[TODO: João to fill in]` rather than making something up.
- **Figma is the source of truth for design.** If I share a Figma link or file, that overrides any assumptions.
