import { buildChecks, buildNextSteps, buildRisks, normalizeTargetUrl } from '../src/lib/readiness.js'
import { keywordPages } from '../src/content/keyword-pages.js'
import { handleNowPaymentsCheckout } from './nowpayments.js'

const CANONICAL_ORIGIN = 'https://ladybird.best'
const CANONICAL_HOSTS = new Set(['ladybird.best', 'www.ladybird.best'])
const ANNUAL_DISCOUNT_MULTIPLIER = 0.5

const creemProductCache = new Map()

const planCatalog = {
  starter: {
    id: 'starter',
    name: 'Scout',
    label: 'Starter',
    monthlyAmountCents: 2900,
    currency: 'USD',
    summary: 'one monitored journey and a monthly readiness brief',
  },
  pro: {
    id: 'pro',
    name: 'Flight Deck',
    label: 'Pro',
    monthlyAmountCents: 7900,
    currency: 'USD',
    summary: 'the default Ladybird readiness workspace for serious teams',
  },
  scale: {
    id: 'scale',
    name: 'Constellation',
    label: 'Scale',
    monthlyAmountCents: 19900,
    currency: 'USD',
    summary: 'portfolio monitoring and deeper media compatibility planning',
  },
}

const indexablePaths = [
  '/',
  ...keywordPages.map((page) => page.path),
  '/privacy',
  '/terms',
]

const staticAssetPaths = new Set([...indexablePaths, '/checkout/done'])

export function securityHeaders() {
  return new Headers({
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  })
}

export function jsonResponse(data, status = 200) {
  const headers = securityHeaders()
  headers.set('Content-Type', 'application/json; charset=utf-8')
  return new Response(JSON.stringify(data), { status, headers })
}

function xmlResponse(body) {
  const headers = securityHeaders()
  headers.set('Content-Type', 'application/xml; charset=utf-8')
  headers.set('Cache-Control', 'public, max-age=3600')
  return new Response(body, { status: 200, headers })
}

function textResponse(body) {
  const headers = securityHeaders()
  headers.set('Content-Type', 'text/plain; charset=utf-8')
  headers.set('Cache-Control', 'public, max-age=3600')
  return new Response(body, { status: 200, headers })
}

function maybeRedirectToHttps(requestUrl, request) {
  if (typeof isLocalDevRequest === 'function' && isLocalDevRequest(request)) return null
  const canonicalUrl = new URL(CANONICAL_ORIGIN)
  const isKnownHost = typeof CANONICAL_HOSTS !== 'undefined' && CANONICAL_HOSTS.has(requestUrl.hostname)
  if (isKnownHost && (requestUrl.protocol !== 'https:' || requestUrl.hostname !== canonicalUrl.hostname)) {
    const redirectUrl = new URL(requestUrl)
    redirectUrl.protocol = 'https:'
    redirectUrl.hostname = canonicalUrl.hostname
    return Response.redirect(redirectUrl.toString(), 301)
  }
  return null
}

function resolvePublicAppOrigin(requestUrl) {
  if (CANONICAL_HOSTS.has(requestUrl.hostname)) return `https://${requestUrl.hostname}`
  if (requestUrl.hostname.endsWith('.workers.dev') || requestUrl.hostname.endsWith('.pages.dev')) return requestUrl.origin
  return CANONICAL_ORIGIN
}

function resolveCreemBase(env) {
  const raw = String(env?.CREEM_API_BASE || '').trim()
  return raw ? raw.replace(/\/+$/, '') : 'https://api.creem.io'
}

async function getSecretValue(value) {
  if (typeof value === 'string') return value.trim()
  if (value && typeof value.get === 'function') {
    const resolved = await value.get()
    return typeof resolved === 'string' ? resolved.trim() : ''
  }
  return ''
}

async function firstSecretEnv(env, ...keys) {
  for (const key of keys) {
    const value = await getSecretValue(env?.[key])
    if (value) return value
  }
  return ''
}

function normalizeEnvKey(value) {
  return String(value)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function formatMoney(amountCents, currency) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: amountCents % 100 === 0 ? 0 : 2,
  }).format(amountCents / 100)
}

function resolveConfiguredProductId(env, planId, billing) {
  const cycle = billing === 'monthly' ? 'MONTHLY' : 'YEARLY'
  const tier = planId === 'scale' ? 'SCALE' : planId === 'starter' ? 'STARTER' : 'PRO'
  const normalizedSelection = normalizeEnvKey(`${planId}_${billing}`)
  const keys = [
    `CREEM_PRODUCT_LADYBIRD_${tier}_${cycle}`,
    `CREEM_PRODUCT_ID_LADYBIRD_${normalizedSelection}`,
    `CREEM_PRODUCT_ID_${normalizedSelection}`,
    `CREEM_PRODUCT_ID_${tier}`,
    'CREEM_PRODUCT_ID',
  ]

  for (const key of keys) {
    const value = env?.[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

async function requestCreemJson(apiKey, url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(body),
  })

  const rawText = await response.text()
  let payload = null
  if (rawText) {
    try {
      payload = JSON.parse(rawText)
    } catch {
      payload = null
    }
  }

  if (!response.ok) {
    throw new Error(
      payload && typeof payload === 'object'
        ? payload.message || payload.error || 'Creem request failed.'
        : 'Creem request failed.',
    )
  }

  return payload || {}
}

async function getOrCreateCreemProduct(env, apiKey, plan, billing, successUrl) {
  const configuredProductId = resolveConfiguredProductId(env, plan.id, billing)
  if (configuredProductId) return configuredProductId

  const cacheKey = `${plan.id}:${billing}`
  if (creemProductCache.has(cacheKey)) return creemProductCache.get(cacheKey)

  const effectiveMonthlyCents =
    billing === 'annual' ? Math.round(plan.monthlyAmountCents * ANNUAL_DISCOUNT_MULTIPLIER) : plan.monthlyAmountCents
  const totalAmountCents = billing === 'annual' ? effectiveMonthlyCents * 12 : effectiveMonthlyCents
  const billingLabel = billing === 'annual' ? 'annual' : 'monthly'

  const product = await requestCreemJson(apiKey, `${resolveCreemBase(env)}/v1/products`, {
    name: `Ladybird Best ${plan.name} (${billingLabel})`,
    description: `${formatMoney(effectiveMonthlyCents, plan.currency)}/mo - ${plan.summary}`,
    price: totalAmountCents,
    currency: plan.currency,
    billing_type: 'onetime',
    tax_mode: 'inclusive',
    tax_category: 'saas',
    default_success_url: successUrl,
  })

  const productId = product.id || product.product_id
  if (!productId) throw new Error('Creem did not return a product id.')

  creemProductCache.set(cacheKey, productId)
  return productId
}

function extractCheckoutUrl(payload) {
  const candidates = [payload?.checkout_url, payload?.checkoutUrl, payload?.url]
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim()
  }
  return ''
}

export async function handleCheckout(request, env, requestUrl = new URL(request.url)) {
  if (request.method !== 'POST') return jsonResponse({ ok: false, error: 'Method not allowed.' }, 405)

  const apiKey = await firstSecretEnv(env, 'API_PROD_KEY', 'CREEM_API_KEY', 'CREEM_KEY')
  if (!apiKey) return jsonResponse({ ok: false, error: 'Payment is not configured yet.' }, 503)

  let body
  try {
    body = await request.json()
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid JSON body.' }, 400)
  }

  const planId = typeof body?.planId === 'string' ? body.planId : 'pro'
  const billing = body?.billing === 'monthly' ? 'monthly' : 'annual'
  const plan = planCatalog[planId] || planCatalog.pro
  const successUrl = `${resolvePublicAppOrigin(requestUrl)}/checkout/done`

  try {
    const productId = await getOrCreateCreemProduct(env, apiKey, plan, billing, successUrl)
    const checkout = await requestCreemJson(apiKey, `${resolveCreemBase(env)}/v1/checkouts`, {
      product_id: productId,
      units: 1,
      success_url: successUrl,
      request_id: `ladybird_${plan.id}_${billing}_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      metadata: {
        site: 'ladybird.best',
        planId: plan.id,
        billing,
      },
    })
    const checkoutUrl = extractCheckoutUrl(checkout)
    if (!checkoutUrl) throw new Error('Creem did not return a checkout URL.')
    return jsonResponse({ ok: true, checkoutUrl })
  } catch {
    return jsonResponse({ ok: false, error: 'Secure checkout could not be created yet.' }, 502)
  }
}

export function handleRuntime(requestUrl = new URL(CANONICAL_ORIGIN)) {
  return jsonResponse({
    ok: true,
    publicAppOrigin: resolvePublicAppOrigin(requestUrl),
    deployment: 'cloudflare-workers-assets',
    paymentProvider: 'creem',
    ts: Date.now(),
  })
}

function isBlockedTarget(url) {
  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (!hostname || hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local')) return true

  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    const parts = hostname.split('.').map((part) => Number(part))
    if (parts[0] === 10 || parts[0] === 127 || parts[0] === 0) return true
    if (parts[0] === 169 && parts[1] === 254) return true
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true
    if (parts[0] === 192 && parts[1] === 168) return true
  }

  if (hostname === '::1' || hostname.startsWith('fc') || hostname.startsWith('fd') || hostname.startsWith('fe80')) return true
  return false
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 8500) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, {
      redirect: 'follow',
      ...options,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timer)
  }
}

function hasMarkup(text, pattern) {
  return pattern.test(text.slice(0, 120000))
}

async function inspectRemoteUrl(targetUrl) {
  const url = new URL(targetUrl)
  const response = await fetchWithTimeout(targetUrl, {
    method: 'GET',
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      Range: 'bytes=0-120000',
      'User-Agent': 'LadybirdBestReadiness/1.0 (+https://ladybird.best)',
    },
  })

  const contentType = response.headers.get('content-type') || ''
  const hasCsp = Boolean(response.headers.get('content-security-policy'))
  const hasHsts = Boolean(response.headers.get('strict-transport-security'))
  const hasPermissionsPolicy = Boolean(response.headers.get('permissions-policy'))
  const isHtml = contentType.includes('text/html') || contentType.includes('application/xhtml+xml')
  const text = isHtml ? await response.text() : ''
  const lower = text.toLowerCase()
  const scriptCount = (lower.match(/<script\b/g) || []).length
  const iframeCount = (lower.match(/<iframe\b/g) || []).length
  const hasModuleScripts = hasMarkup(lower, /type=["']module["']/)
  const hasSemanticMain = hasMarkup(lower, /<(main|article|nav|header|footer)\b/)
  const hasHeavyMedia = hasMarkup(lower, /encrypted-media|widevine|fairplay|playready|<video\b|<audio\b|dash\.js|hls\.js|m3u8/)
  const hasPaymentFlow =
    /checkout|pricing|billing|subscribe|payment/.test(url.pathname.toLowerCase()) ||
    hasMarkup(lower, /checkout|billing|subscribe|stripe|creem|paypal|paddle/)
  const isApp = /app|dashboard|login|account|console|portal|admin/.test(url.pathname.toLowerCase()) || hasMarkup(lower, /sign in|log in|dashboard/)
  const isMedia = /video|watch|stream|movie|netflix|player|live/.test(`${url.hostname}${url.pathname}`.toLowerCase()) || hasHeavyMedia

  let score = 52
  if (url.protocol === 'https:') score += 10
  if (response.ok) score += 10
  if (isHtml) score += 8
  if (hasCsp) score += 7
  if (hasHsts) score += 6
  if (hasPermissionsPolicy) score += 2
  if (hasModuleScripts) score += 3
  if (hasSemanticMain) score += 3
  if (scriptCount > 22) score -= 5
  if (iframeCount > 2) score -= 5
  if (hasHeavyMedia) score -= 12
  if (hasPaymentFlow) score -= 3
  if (!response.ok) score -= 18
  score = Math.max(25, Math.min(98, score))

  const grade = score >= 84 ? 'Strong' : score >= 70 ? 'Promising' : score >= 54 ? 'Needs review' : 'High risk'
  const urgency =
    score >= 84
      ? 'Clean first-pass signals. Move to a focused browser smoke test.'
      : score >= 70
        ? 'Good candidate, with a few checks to clear before public claims.'
        : score >= 54
          ? 'Useful signal, but review the risky journeys before expanding support.'
          : 'Treat this as a narrow compatibility project, not a broad support promise.'

  const context = {
    isSecure: url.protocol === 'https:',
    isApp,
    isMedia,
    isDocs: /docs|github|developer|api|reference/.test(`${url.hostname}${url.pathname}`.toLowerCase()),
    hasCsp,
    hasHsts,
    hasModuleScripts,
    hasHeavyMedia,
    hasPaymentFlow,
    markupStatus: isHtml ? 'html' : 'unknown',
  }

  return {
    mode: 'remote-inspection',
    targetUrl,
    finalUrl: response.url,
    status: response.status,
    score,
    grade,
    urgency,
    checks: buildChecks(context),
    risks: buildRisks(context),
    nextSteps: buildNextSteps(context),
    summary: `${response.status} ${response.statusText || 'response'} with ${scriptCount} script tag${scriptCount === 1 ? '' : 's'} and ${
      iframeCount || 'no'
    } iframe signal${iframeCount === 1 ? '' : 's'} in the first pass.`,
  }
}

export async function handleReadiness(request) {
  if (request.method !== 'POST') return jsonResponse({ ok: false, error: 'Method not allowed.' }, 405)
  return jsonResponse({ ok: false, error: 'Readiness reviews are available inside paid workspaces after checkout.' }, 402)
}

function sanitizeAnalyticsValue(value, max = 160) {
  return String(value ?? '')
    .replace(/[^\w .:/?=&-]/g, '')
    .slice(0, max)
}

export async function handleAnalytics(request) {
  if (request.method !== 'POST') return jsonResponse({ ok: false, error: 'Method not allowed.' }, 405)

  let body = {}
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  const event = {
    site: 'ladybird.best',
    event: sanitizeAnalyticsValue(body.event || 'unknown', 80),
    path: sanitizeAnalyticsValue(body.path || '/', 180),
    planId: sanitizeAnalyticsValue(body.planId || '', 40),
    billing: sanitizeAnalyticsValue(body.billing || '', 40),
    route: sanitizeAnalyticsValue(body.route || '', 180),
    ts: Date.now(),
  }

  console.log(JSON.stringify({ type: 'ladybird_analytics', ...event }))
  return jsonResponse({ ok: true })
}

export function buildSitemapXml() {
  const today = new Date().toISOString().slice(0, 10)
  const urls = indexablePaths
    .map((path) => {
      const priority = path === '/' ? '1.0' : path === '/privacy' || path === '/terms' ? '0.4' : '0.78'
      const changefreq = path === '/' ? 'weekly' : 'monthly'
      return `  <url>
    <loc>${CANONICAL_ORIGIN}${path === '/' ? '/' : path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`
}

export function handleSitemap() {
  return xmlResponse(buildSitemapXml())
}

export function buildRobotsTxt() {
  return `User-agent: *
Allow: /
Disallow: /api/
Disallow: /checkout/done
Sitemap: ${CANONICAL_ORIGIN}/sitemap.xml
`
}

export function handleRobots() {
  return textResponse(buildRobotsTxt())
}

function noIndexNotFoundResponse(request) {
  const headers = securityHeaders(request)
  headers.set('Content-Type', 'text/html; charset=utf-8')
  headers.set('Cache-Control', 'no-store')
  headers.set('X-Robots-Tag', 'noindex, nofollow')
  return new Response('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>Page not found</title></head><body><main><h1>Page not found</h1><p>This URL is not a public page for this product.</p></main></body></html>', { status: 404, headers })
}

async function fetchAsset(request, env) {
  if (env?.ASSETS?.fetch) {
    const requestUrl = new URL(request.url)
    const normalizedPath = requestUrl.pathname.replace(/\/+$/, '') || '/'

    if (staticAssetPaths.has(normalizedPath)) {
      const assetUrl = new URL(request.url)
      assetUrl.pathname = normalizedPath === '/' ? '/index.html' : `${normalizedPath}/index.html`
      const assetResponse = await env.ASSETS.fetch(new Request(assetUrl.toString(), request))
      if (assetResponse.status !== 404) return assetResponse
    }

    return env.ASSETS.fetch(request)
  }

  return new Response('Cloudflare ASSETS binding is unavailable.', {
    status: 500,
    headers: securityHeaders(),
  })
}

export async function handleRequest(request, env) {
  const requestUrl = new URL(request.url)

  if (requestUrl.pathname === '/api/nowpayments-checkout') {
    return handleNowPaymentsCheckout(request, env, {
      plans: planCatalog,
      defaultPlanId: 'pro',
      siteName: 'ladybird',
      siteKey: 'ladybird',
      annualDiscountMultiplier: typeof ANNUAL_DISCOUNT_MULTIPLIER !== 'undefined'
        ? ANNUAL_DISCOUNT_MULTIPLIER
        : (typeof annualBillingMultiplier !== 'undefined' ? annualBillingMultiplier : 0.5),
    })
  }

  if (requestUrl.pathname === '/api/runtime') return handleRuntime(requestUrl)
  if (requestUrl.pathname === '/api/checkout') return handleCheckout(request, env, requestUrl)
  if (requestUrl.pathname === '/api/readiness') return handleReadiness(request, env, requestUrl)
  if (requestUrl.pathname === '/api/analytics') return handleAnalytics(request, env, requestUrl)

  const httpsRedirect = maybeRedirectToHttps(requestUrl)
  if (httpsRedirect) return httpsRedirect

  if (requestUrl.pathname === '/sitemap.xml') return handleSitemap()
  if (requestUrl.pathname === '/robots.txt') return handleRobots()

  return fetchAsset(request, env)
}

export default {
  async fetch(request, env) {
    try {
      return await handleRequest(request, env)
    } catch {
      return jsonResponse({ ok: false, error: 'Internal server error.' }, 500)
    }
  },
}
