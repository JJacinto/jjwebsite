import { test as base } from '@playwright/test';

/* Default fixture: case studies are pre-unlocked.
   addInitScript runs in every new document before page scripts,
   so the inline gate in [slug].astro sees the unlock flag at
   parse-time and never hides #case-content. */
export const test = base.extend({
  context: async ({ context }, use) => {
    await context.addInitScript(() => {
      try { sessionStorage.setItem('jj-case-unlocked', '1'); } catch {}
    });
    await use(context);
  },
});

/* Locked variant: no init script, fresh storage. Use only for
   the gate spec itself. */
export const lockedTest = base;

export { expect } from '@playwright/test';

export const VISIBLE_CASE_SLUGS = [
  'redefining-webinar-customization',
  'understanding-webinar-organizers',
  'leading-and-managing-a-design-system',
  'designing-a-support-chat-experience',
];

export const HIDDEN_CASE_SLUG = 'reshaping-an-ai-training-platform';
