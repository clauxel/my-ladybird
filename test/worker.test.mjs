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
    assert.equal(calls[0].body.name, 'Ladybird Best Flight Deck (annual)')
    assert.equal(calls[0].body.price, 47400)
    assert.equal(calls[0].body.currency, 'USD')
    assert.equal(calls[0].body.billing_type, 'onetime')
    assert.match(calls[0].body.description, /\$39\.50\/mo/)
    assert.equal(calls[1].body.metadata.planId, 'pro')
    assert.equal(calls[1].body.metadata.billing, 'annual')
    assert.equal(calls[1].body.success_url, 'https://www.ladybird.best/checkout/done')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('readiness endpoint is not offered as a free scan', async () => {
  const response = await handleReadiness(
    new Request('https://ladybird.best/api/readiness', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com/pricing' }),
    }),
  )
  const payload = await response.json()

  assert.equal(response.status, 402)
  assert.equal(payload.ok, false)
  assert.match(payload.error, /paid workspaces/i)
})

test('readiness endpoint still rejects unsupported methods', async () => {
  const response = await handleReadiness(new Request('https://ladybird.best/api/readiness'))
  assert.equal(response.status, 405)
})
