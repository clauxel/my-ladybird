import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { keywordPages } from '../src/content/keyword-pages.js'
import { buildRobotsTxt, buildSitemapXml } from '../worker/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const distDir = path.join(rootDir, 'dist')
const sourceIndexPath = path.join(distDir, 'index.html')
const origin = 'https://ladybird.best'
const siteName = 'Ladybird Best'
const googleVerification = (process.env.GOOGLE_SITE_VERIFICATION || '').trim()

const homeTitle = 'Ladybird Best - Independent Browser Readiness Lab for App Teams'
const homeDescription =
  'Check Ladybird Browser readiness for checkout, login, media, forms, public pages, and independent engine risk before you ship customer-facing apps.'

const sourceIndex = await fs.readFile(sourceIndexPath, 'utf8')

await writeStaticPage('/', {
  title: homeTitle,
  description: homeDescription,
  robots: 'index,follow',
  canonicalPath: '/',
  rootHtml: buildHomePrerender(),
  structuredData: [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: siteName,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: `${origin}/`,
      description: homeDescription,
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'USD',
        lowPrice: '14.50',
        highPrice: '99.50',
        availability: 'https://schema.org/InStock',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: siteName,
      url: `${origin}/`,
    },
  ],
})

for (const page of keywordPages) {
  const title = `${page.title} | ${siteName}`
  await writeStaticPage(page.path, {
    title,
    description: page.description,
    robots: 'index,follow',
    canonicalPath: page.path,
    rootHtml: buildKeywordPrerender(page),
    structuredData: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: title,
        description: page.description,
        url: `${origin}${page.path}`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
          { '@type': 'ListItem', position: 2, name: page.h1, item: `${origin}${page.path}` },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: page.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      },
    ],
  })
}

await writeStaticPage('/privacy', {
  title: `Privacy | ${siteName}`,
  description: 'How Ladybird Best handles paid readiness reviews, payment metadata, support messages, and first-party analytics.',
  robots: 'index,follow',
  canonicalPath: '/privacy',
  rootHtml: buildLegalPrerender(
    'Privacy Policy',
    'Ladybird Best keeps readiness work focused on public URLs and uses simple first-party events to understand product reliability.',
  ),
  structuredData: [],
})

await writeStaticPage('/terms', {
  title: `Terms | ${siteName}`,
  description: 'Terms for using Ladybird Best paid readiness reviews, compatibility workspaces, and hosted checkout.',
  robots: 'index,follow',
  canonicalPath: '/terms',
  rootHtml: buildLegalPrerender(
    'Terms of Service',
    'Plans cover paid readiness reviews, monitored journey notes, browser-progress interpretation, and practical compatibility guidance.',
  ),
  structuredData: [],
})

await writeStaticPage('/checkout/done', {
  title: `Checkout Complete | ${siteName}`,
  description: 'Your Ladybird Best checkout is finishing.',
  robots: 'noindex,nofollow',
  canonicalPath: '/checkout/done',
  rootHtml: buildLegalPrerender('Returning to Ladybird Best...', 'Your payment is complete and the homepage is reopening.'),
  structuredData: [],
})

await fs.writeFile(path.join(distDir, 'sitemap.xml'), buildSitemapXml())
await fs.writeFile(path.join(distDir, 'robots.txt'), buildRobotsTxt())

async function writeStaticPage(routePath, page) {
  const html = renderHtml(page)

  if (routePath === '/') {
    await fs.writeFile(sourceIndexPath, html)
    return
  }

  const outputDir = path.join(distDir, routePath.replace(/^\/+/, ''))
  await fs.mkdir(outputDir, { recursive: true })
  await fs.writeFile(path.join(outputDir, 'index.html'), html)
}

function renderHtml({ title, description, robots, canonicalPath, rootHtml, structuredData }) {
  const canonicalUrl = `${origin}${canonicalPath === '/' ? '/' : canonicalPath}`
  let html = sourceIndex
  html = html.replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(title)}</title>`)
  html = upsertMeta(html, 'name', 'description', description)
  html = upsertMeta(html, 'name', 'robots', robots)
  html = upsertMeta(html, 'property', 'og:title', title)
  html = upsertMeta(html, 'property', 'og:description', description)
  html = upsertMeta(html, 'property', 'og:url', canonicalUrl)
  html = upsertMeta(html, 'name', 'twitter:title', title)
  html = upsertMeta(html, 'name', 'twitter:description', description)
  html = html.replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${escapeAttr(canonicalUrl)}" />`)
  html = html.replace('<div id="root"></div>', `<div id="root">${rootHtml}</div>`)

  if (googleVerification) {
    html = html.replace('</head>', `    <meta name="google-site-verification" content="${escapeAttr(googleVerification)}" />\n  </head>`)
  }

  const graph =
    structuredData.length > 1
      ? { '@context': 'https://schema.org', '@graph': structuredData.map(stripContext) }
      : structuredData[0]

  if (graph) {
    html = html.replace(
      '</head>',
      `    <script type="application/ld+json" id="ladybird-prerender-schema">${JSON.stringify(graph)}</script>\n  </head>`,
    )
  }

  return html
}

function upsertMeta(html, attrName, attrValue, content) {
  const escapedAttrValue = escapeRegExp(attrValue)
  const pattern = new RegExp(`<meta\\s+${attrName}="${escapedAttrValue}"\\s+content="[^"]*"\\s*\\/?>`, 's')
  const replacement = `<meta ${attrName}="${escapeAttr(attrValue)}" content="${escapeAttr(content)}" />`
  return html.replace(pattern, replacement)
}

function stripContext(item) {
  const { '@context': _context, ...rest } = item
  return rest
}

function buildHomePrerender() {
  return `
    <main class="lb-main">
      <section class="lb-hero" id="readiness">
        <div class="lb-hero-copy">
          <p class="lb-eyebrow">Independent browser readiness for the Ladybird era</p>
          <h1>See whether your site is ready for Ladybird Browser before your users ask.</h1>
          <p class="lb-lede">Start with a monitored readiness workspace that turns standards, media, login, and checkout risk into a short action plan for a truly independent web engine.</p>
          <p><a class="lb-button lb-button-red" href="#pricing">Choose Pro annual</a></p>
        </div>
        <section class="lb-scan-card">
          <p class="lb-eyebrow">Workspace preview</p>
          <h2>See what Flight Deck reviews before your team spends engineering time.</h2>
        </section>
      </section>
    </main>`
}

function buildKeywordPrerender(page) {
  const sections = page.sections
    .map(
      (section) => `
        <section>
          <h2>${escapeHtml(section.heading)}</h2>
          ${section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('\n')}
          ${section.bullets?.length ? `<ul>${section.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join('')}</ul>` : ''}
        </section>`,
    )
    .join('\n')
  const faqs = page.faqs
    .map((faq) => `<article><h3>${escapeHtml(faq.question)}</h3><p>${escapeHtml(faq.answer)}</p></article>`)
    .join('\n')

  return `
    <main class="lb-main">
      <article class="lb-article">
        <a class="lb-back-link" href="/">Back to Ladybird Best</a>
        <p class="lb-eyebrow">${escapeHtml(page.eyebrow)}</p>
        <h1>${escapeHtml(page.h1)}</h1>
        <p class="lb-lede">${escapeHtml(page.lede)}</p>
        <div class="lb-intent-box"><strong>Best for</strong><span>${escapeHtml(page.intent)}</span></div>
        ${sections}
        <section>
          <h2>Quick answers</h2>
          ${faqs}
        </section>
        <aside class="lb-article-cta">
          <div>
            <p class="lb-eyebrow">Next step</p>
            <h2>Choose the readiness plan while the context is fresh.</h2>
            <p>The fastest way to make this practical is to attach the review to the page your users actually land on.</p>
          </div>
          <a class="lb-button lb-button-red" href="/#pricing">See recommended plan</a>
        </aside>
      </article>
    </main>`
}

function buildLegalPrerender(title, description) {
  return `
    <main class="lb-main">
      <article class="lb-article">
        <a class="lb-back-link" href="/">Back to Ladybird Best</a>
        <h1>${escapeHtml(title)}</h1>
        <p class="lb-lede">${escapeHtml(description)}</p>
      </article>
    </main>`
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, '&#96;')
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
