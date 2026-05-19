# Ladybird Best

Ladybird Best is a Cloudflare-first product site for an independent-browser readiness lab inspired by the public Ladybird Browser project.

The site includes a usable URL readiness scan, natural educational pages for common Ladybird searches, Creem hosted checkout, first-party analytics events, static prerendered SEO pages, `sitemap.xml`, `robots.txt`, Cloudflare Worker API routing, and Pages Functions compatibility.

## Local Commands

```bash
npm install
npm run test
npm run dev
```

## Cloudflare

The Worker entry is `worker/index.js` and the Pages project can deploy the same built `dist` directory. Store the Creem live key as the Cloudflare secret `API_PROD_KEY`.

