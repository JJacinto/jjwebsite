import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://joaojacinto.com',
  integrations: [sitemap()],
  outDir: './dist',
  redirects: {
    '/en/':              '/',
    '/en/about':         '/about',
    '/en/case-studies':  '/case-studies',
    '/en/contact':       '/contact',
  },
});
