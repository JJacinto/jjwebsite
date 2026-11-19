import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import ptPages from './integrations/pt-pages.mjs';

/* React is only needed in dev to mount the Retune visual-editing
   overlay. Skip the integration in prod so the production bundle
   stays React-free. */
const isDev = process.env.NODE_ENV !== 'production';

export default defineConfig({
  site: 'https://joaojacinto.com',
  integrations: [
    ...(isDev ? [react()] : []),
    /* Left out of the sitemap: the removed case (its page only redirects
       to /case-studies/) and the error pages, which are noindex. */
    sitemap({
      filter: (page) =>
        !page.includes('/reshaping-an-ai-training-platform') &&
        !/\/(403|404|500|error)\/?$/.test(page),
    }),
    /* Real Portuguese pages under /pt/. Must stay after sitemap(): it edits
       the sitemap file that sitemap() writes. */
    ptPages(),
  ],
  outDir: './dist',
  redirects: {
    '/en/':              '/',
    '/en/about':         '/about',
    '/en/case-studies':  '/case-studies',
    '/en/contact':       '/contact',
  },
});
