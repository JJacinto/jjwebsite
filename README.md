# joaojacinto.com

The personal site and portfolio of João Jacinto, Senior Product Designer based in Aveiro, Portugal. It holds case studies, an about page and a way to get in touch.

Live at **[joaojacinto.com](https://joaojacinto.com)**.

The site is hand-built, not a template. It is a static [Astro](https://astro.build) site with its own design tokens, and it is served from a home NAS behind Cloudflare.

## Stack

- **Astro 6**: static output, no client framework in production
- **Design tokens**: `design-system/tokens.json` (DTCG format), compiled to CSS custom properties
- **Playwright**: end-to-end tests for the interactive parts
- **Umami**: privacy-friendly analytics with no cookies (optional)
- **Retune**: visual-editing overlay, loaded in development only (it is the only reason React is installed)

## Getting started

Requires Node.js 22.

```bash
npm install
npm run dev
```

The dev server runs at `http://localhost:4321`. Design tokens are rebuilt automatically before `dev` and `build`.

| Command | What it does |
|---|---|
| `npm run dev` | Start the local dev server |
| `npm run build` | Build the static site into `dist/` |
| `npm run preview` | Serve the built site locally |
| `npm run tokens` | Regenerate `design-system/tokens.css` from `tokens.json` |
| `npm test` | Run the Playwright tests |
| `npm run test:ui` | Run the tests in Playwright's UI mode |

### Analytics (optional)

Copy `.env.example` to `.env` and set both `PUBLIC_UMAMI_SCRIPT_URL` and `PUBLIC_UMAMI_WEBSITE_ID`. The tracker only renders when both are set, so local development works without them.

## Project structure

```
src/
  pages/           Routes: home, about, contact, case studies, error pages
  components/      Astro components, grouped by page (home, about, cases)
  data/cases.ts    Case study content and metadata
  layouts/         The shared page layout
  styles/          Global styles and the compiled tokens
design-system/     Token source (tokens.json), build script and token notes
public/            Static assets: images, scripts, Retune manifest
tests/             Playwright specs
scripts/           Image resizing and deploy-watching helpers
docs/              Deploy notes
joao-website/      The earlier single-file version of the site, kept for reference
```

## Design tokens

Colours, type, spacing and the rest live in `design-system/tokens.json`. `design-system/scripts/build-tokens.js` turns each token into a CSS custom property (for example `color.neutral.10` becomes `--color-neutral-10`). Edit the JSON, not the generated CSS.

## Deployment

Every push to `main` that touches the site (`src/`, `public/`, `design-system/` or the build config) runs the **Deploy to NAS** GitHub Actions workflow:

1. Install dependencies and build the site
2. Copy `dist/` to the NAS through a Cloudflare Tunnel
3. Purge the Cloudflare cache

A deploy takes about two minutes. It can also be started by hand from **Actions → Deploy to NAS → Run workflow**. Troubleshooting notes are in [`docs/deploy.md`](docs/deploy.md).

## License

© João Jacinto. All rights reserved. The code is shared so others can see how the site is built. The content, case studies and images are not licensed for reuse.
