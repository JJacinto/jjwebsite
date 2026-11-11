---
name: retune-review
description: Apply Retune changes and comments to the jjwebsite source, then improve them from a principal product designer's and a professional content writer's point of view, keeping all copy in João's own voice with no AI jargon. Use for every Retune payload on this site, whether pasted or fetched via the retune MCP tools. Triggers on "using Retune", "# Visual Changes", "# Comments", "Comment #", "Address each comment", "Prop Changes", "Attribute Changes".
---

# Retune review

Retune sends two kinds of input: **visual changes** (exact values João set by hand) and **comments** (intent in plain words). This skill does three passes over them, in order, then verifies and reports.

The mechanics of applying a payload (reading the tables, finding the element, token matching, structural actions, clearing) are in the `retune-visual-changes` skill. Follow it for pass 1. This skill adds passes 2 and 3 on top.

## Pass 1: Do what was asked

Apply every change and comment literally first.

- Exact values João set in the overlay are final. Never round them, snap them to a nearby token, or "fix" them. Use an exact token match when one exists, otherwise the raw value.
- For comments, read the intent and do it fully. "Same height as the button, 44px" means every pill matches, including hover and active states and the mobile nav if it shares the class.
- Copy edits: if João typed new text, keep his words. Only touch wording he didn't write himself, or wording he asked you to rewrite.

## Pass 2: Principal product designer

For each element you touched, ask whether the change holds up across the whole experience, and fix what doesn't. Stay inside the blast radius of the request: improve the thing he pointed at and anything it directly affects, nothing else.

Check:

1. **System fit.** Use the tokens in `src/styles/tokens.css` and existing patterns in `src/styles/global.css` before inventing values. If one component changes size, its siblings and paired elements should still feel like a set (e.g. nav pills and CTA buttons sharing a height).
2. **States.** Hover, focus-visible, active, disabled, and any JS-driven classes (`is-active`, `visible`, `tilt-active`). A change to the default state usually needs matching state rules.
3. **Responsive.** Check 375, 768 and 1280+ widths. Breakpoints in this repo live in `global.css`; reuse them.
4. **Accessibility.** WCAG AA contrast, 44×44px minimum hit targets, visible focus, real headings, `alt` text, `aria-label` on icon-only controls. When you remove an element, remove its now-dead CSS, JS and aria references too.
5. **Motion.** Follow the site's motion language: ease `cubic-bezier(0.22, 1, 0.36, 1)`, reveals at around 650ms, subtle hovers. Any new animation must have a `prefers-reduced-motion: reduce` fallback that still ends in the correct state. Interactive effects (particles, tilt) must match how the same effect already behaves elsewhere on the site: reuse that code rather than writing a second version.
6. **Consistency with the request's spirit.** If João asks for behaviour "like the contact section", find that implementation and share it, don't approximate it.

Improve, don't redesign. Anything bigger than the request (a new section, a token change, a layout rethink) goes in the report as a suggestion. Don't build it.

## Pass 3: Content writer

Run this on every piece of visible text you added or changed, and on any text a comment asked you to rewrite. Read [voice.md](voice.md) first, every time.

- Rewrite until it sounds like João talking to a peer, not like a model writing a portfolio.
- Run the banned-words list in voice.md on the final text. Zero hits.
- Keep the length close to the original unless the comment asked for shorter or longer, so layouts don't break.
- Never invent facts, numbers, clients, or quotes. If a rewrite needs a fact you don't have, keep the original claim or leave `[TODO: João to confirm]`.

## Verify

The dev server is usually already running (start it with the `jj:dev` skill if not).

1. Load each affected page in the browser pane and look at the changed parts at desktop width and at 375px. Fix anything broken before reporting.
2. Check the console for new errors.
3. Call `retune_clear_changes` so the overlay resets (skip it if the retune tools aren't loaded, and say so).

## Report

Keep it short. One line per change or comment, numbered to match Retune:

```
1. Avatar removed (plus its tilt script and styles).
2. Nav pills now 44px tall, matching the Start project button; mobile menu updated too.
7. Rewrote the "why" grid copy. Before → after for each line below.
```

Then:
- **Copy changes:** show before → after for every sentence you rewrote, so João can veto a line.
- **Extra improvements:** what passes 2 and 3 added beyond the literal request, one line each.
- **Suggestions (not done):** bigger ideas, if any. Skip the heading if there are none.
