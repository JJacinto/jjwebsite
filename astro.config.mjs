import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';

/* React is only needed in dev to mount the Retune visual-editing
   overlay. Skip the integration in prod so the production bundle
   stays React-free. */
const isDev = process.env.NODE_ENV !== 'production';

export default defineConfig({
  site: 'https://joaojacinto.com',
  integrations: [...(isDev ? [react()] : []), sitemap()],
  outDir: './dist',
  redirects: {
    '/en/':              '/',
    '/en/about':         '/about',
    '/en/case-studies':  '/case-studies',
    '/en/contact':       '/contact',
  },
});
