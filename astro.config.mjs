import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://joaojacinto.com',
  integrations: [react(), sitemap()],
  outDir: './dist',
  redirects: {
    '/en/':              '/',
    '/en/about':         '/about',
    '/en/case-studies':  '/case-studies',
    '/en/contact':       '/contact',
  },
});
