import { findKeywordPageByPath, normalizePath } from '../content/keyword-pages.js'

const origin = 'https://ladybird.best'
const siteName = 'Ladybird Best'

const routeSeo = {
  '/': {
    title: 'Ladybird Best | Independent Browser Readiness Lab',
    description:
      'Run a practical Ladybird Browser readiness scan, understand independent engine risk, and launch a monitored compatibility workspace for your site.',
  },
  '/privacy': {
    title: `Privacy | ${siteName}`,
    description: 'How Ladybird Best handles readiness scans, payment metadata, support messages, and first-party analytics.',
  },
  '/terms': {
    title: `Terms | ${siteName}`,
    description: 'Terms for using Ladybird Best readiness scans, compatibility workspaces, and hosted checkout.',
  },
  '/checkout/done': {
    title: `Checkout Complete | ${siteName}`,
    description: 'Your Ladybird Best checkout is finishing.',
    robots: 'noindex,nofollow',
  },
}

export function syncSeo(pathname) {
  const normalized = normalizePath(pathname)
  const keywordPage = findKeywordPageByPath(normalized)
  const page = keywordPage
    ? {
        title: `${keywordPage.title} | ${siteName}`,
        description: keywordPage.description,
      }
    : routeSeo[normalized] || {
        title: `Page Not Found | ${siteName}`,
        description: 'The requested Ladybird Best page was not found.',
        robots: 'noindex,nofollow',
      }

  document.title = page.title
  setMeta('name', 'description', page.description)
  setMeta('name', 'robots', page.robots || 'index,follow')
  setMeta('property', 'og:title', page.title)
  setMeta('property', 'og:description', page.description)
  setMeta('property', 'og:url', `${origin}${normalized === '/' ? '/' : normalized}`)
  setMeta('name', 'twitter:title', page.title)
  setMeta('name', 'twitter:description', page.description)
  setCanonical(`${origin}${normalized === '/' ? '/' : normalized}`)
}

function setMeta(attributeName, attributeValue, content) {
  let tag = document.head.querySelector(`meta[${attributeName}="${attributeValue}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attributeName, attributeValue)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

function setCanonical(href) {
  let link = document.head.querySelector('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', href)
}
