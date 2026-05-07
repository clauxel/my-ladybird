import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildRobotsTxt,
  buildSitemapXml,
  handleCheckout,
  handleReadiness,
  handleRuntime,
} from '../worker/index.js'

test('runtime returns Cloudflare deployment metadata', async () => {
  const response = handleRuntime(new URL('https://www.ladybird.best/api/runtime'))
  assert.equal(response.status, 200)
  const payload = await response.json()
  assert.equal(payload.ok, true)
  assert.equal(payload.publicAppOrigin, 'https://www.ladybird.best')
  assert.equal(payload.paymentProvider, 'creem')
})

test('sitemap and robots include indexable Ladybird pages', () => {
  const sitemap = buildSitemapXml()
  const robots = buildRobotsTxt()

  for (const path of [
    '/ladybird-github',
    '/ladybird-where-to-watch',
    '/ladybug-or-ladybird',
    '/ladybird-swift',
    '/ladybird-browser',
    '/ladybird-os',
    '/ladybird-download',
    '/ladybird-netflix',
  ]) {
    assert.match(sitemap, new RegExp(`https://ladybird\\.best${path}`))
  }

  assert.match(robots, /Sitemap: https:\/\/ladybird\.best\/sitemap\.xml/)
  assert.match(robots, /Disallow: \/api\//)
})

test('checkout validates method and payment secret', async () => {
  const getResponse = await handleCheckout(new Request('https://ladybird.best/api/checkout'), {}, new URL('https://ladybird.best/api/checkout'))
  assert.equal(getResponse.status, 405)

  const noSecretResponse = await handleCheckout(
    new Request('https://ladybird.best/api/checkout', {
      method: 'POST',
      body: JSON.stringify({ planId: 'pro', billing: 'annual' }),
    }),
    {},
    new URL('https://ladybird.best/api/checkout'),
  )
  assert.equal(noSecretResponse.status, 503)
})

test('checkout creates Creem product and hosted checkout URL', async () => {
  const originalFetch = globalThis.fetch
  const calls = []
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), body: JSON.parse(options.body) })
    if (String(url).endsWith('/v1/products')) {
      return Response.json({ id: 'prod_ladybird_test' })
    }
    if (String(url).endsWith('/v1/checkouts')) {
      return Response.json({ checkout_url: 'https://www.creem.io/checkout/test' })
    }
    return Response.json({ message: 'unexpected' }, { status: 500 })
  }

  try {
    const response = await handleCheckout(
      new Request('https://www.ladybird.best/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: 'pro', billing: 'annual' }),
      }),
      { API_PROD_KEY: 'creem_test_key' },
      new URL('https://www.ladybird.best/api/checkout'),
    )
    const payload = await response.json()

    assert.equal(response.status, 200)
    assert.equal(payload.ok, true)
    assert.equal(payload.checkoutUrl, 'https://www.creem.io/checkout/test')
    assert.equal(calls[0].body.currency, 'USD')
    assert.equal(calls[0].body.billing_type, 'onetime')
    assert.equal(calls[1].body.success_url, 'https://www.ladybird.best/checkout/done')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('readiness blocks local targets', async () => {
  const response = await handleReadiness(
    new Request('https://ladybird.best/api/readiness', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'http://localhost:3000' }),
    }),
  )
  assert.equal(response.status, 400)
})

test('readiness inspects reachable HTML without leaking headers', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () =>
    new Response(
      '<!doctype html><main><h1>Pricing</h1><script type="module" src="/app.js"></script><a href="/checkout">Checkout</a></main>',
      {
        status: 200,
        statusText: 'OK',
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'content-security-policy': "default-src 'self'",
          'strict-transport-security': 'max-age=31536000',
        },
      },
    )

  try {
    const response = await handleReadiness(
      new Request('https://ladybird.best/api/readiness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com/pricing' }),
      }),
    )
    const payload = await response.json()

    assert.equal(response.status, 200)
    assert.equal(payload.ok, true)
    assert.equal(payload.analysis.mode, 'remote-inspection')
    assert.ok(payload.analysis.score >= 70)
    assert.ok(payload.analysis.risks.some((risk) => /checkout/i.test(risk)))
  } finally {
    globalThis.fetch = originalFetch
  }
})
