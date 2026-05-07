import { useEffect, useState } from 'react'

import { findKeywordPageByPath, keywordPages, normalizePath } from './content/keyword-pages.js'
import { trackEvent } from './lib/analytics.js'
import { analyzeUrlLocally, getDefaultUrl } from './lib/readiness.js'
import { syncSeo } from './lib/seo.js'

const defaultOrigin = 'https://ladybird.best'
const annualMultiplier = 0.5

const plans = [
  {
    id: 'starter',
    name: 'Scout',
    label: 'Starter',
    monthlyUsd: 29,
    tagline: 'One site, one priority journey, enough signal to stop guessing.',
    bullets: ['Guided URL readiness review', 'One monitored journey', 'Monthly browser-change brief', 'Email setup help'],
  },
  {
    id: 'pro',
    name: 'Flight Deck',
    label: 'Pro',
    monthlyUsd: 79,
    tagline: 'The default workspace for teams preparing a real support story.',
    popular: true,
    bullets: ['Three monitored journeys', 'Checkout and login flow review', 'Media and popup-risk matrix', 'Priority launch notes'],
  },
  {
    id: 'scale',
    name: 'Constellation',
    label: 'Scale',
    monthlyUsd: 199,
    tagline: 'For portfolios, media-heavy products, and recurring executive reports.',
    bullets: ['Multi-site monitoring', 'Media and DRM readiness plan', 'Weekly change digest', 'Faster compatibility triage'],
  },
]

const proof = [
  { value: '1 site', label: 'included per workspace' },
  { value: '4 flows', label: 'headers, markup, media, checkout' },
  { value: '50%', label: 'annual savings by default' },
  { value: '2026', label: 'alpha horizon to track' },
]

const officialLinks = [
  { href: 'https://ladybird.org/', label: 'Official Ladybird site' },
  { href: 'https://github.com/LadybirdBrowser/ladybird', label: 'Ladybird GitHub' },
]

function CheckoutDoneBridge() {
  useEffect(() => {
    const origin = window.location.origin
    if (window.opener) {
      try {
        window.opener.postMessage({ type: 'ladybird-checkout-complete' }, origin)
      } catch {
        /* The opener may be gone. */
      }
      window.close()
      return
    }
    window.location.replace(`${origin}/?payment=success`)
  }, [])

  return (
    <main className="lb-main">
      <section className="lb-centered">
        <p className="lb-eyebrow">Checkout</p>
        <h1>Returning to Ladybird Best...</h1>
        <p>Your payment is complete and the homepage is reopening.</p>
      </section>
    </main>
  )
}

function formatMoney(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value)
}

function readJson(response) {
  return response.text().then((text) => {
    if (!text.trim()) return null
    try {
      return JSON.parse(text)
    } catch {
      return null
    }
  })
}

function openCenteredCheckoutWindow() {
  const width = 560
  const height = 760
  const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - width) / 2))
  const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - height) / 2))
  const popup = window.open(
    'about:blank',
    'ladybird-creem-checkout',
    `popup=yes,width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
  )

  if (popup) {
    try {
      popup.document.title = 'Opening secure checkout'
      popup.document.body.innerHTML =
        '<main style="min-height:100vh;display:grid;place-items:center;background:#130f0d;color:#fff5de;font-family:Arial,sans-serif;text-align:center;padding:28px"><section><h1 style="font-size:22px;margin:0 0 8px">Opening secure checkout...</h1><p style="margin:0;color:#f1c7a7">Your Creem payment window is being prepared.</p></section></main>'
    } catch {
      /* A named popup may already be cross-origin; assigning location still works. */
    }
  }

  return popup
}

function sendPopupToCheckout(popup, url) {
  if (!popup || popup.closed) return false
  try {
    popup.location.replace(url)
    popup.focus()
    return true
  } catch {
    return false
  }
}

function useRoute() {
  const [path, setPath] = useState(() => window.location.pathname)
  const [search, setSearch] = useState(() => window.location.search)

  function navigate(to) {
    const url = new URL(to, window.location.origin)
    window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`)
    setPath(url.pathname)
    setSearch(url.search)

    if (url.hash) {
      const scrollToHash = () => document.querySelector(url.hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      requestAnimationFrame(scrollToHash)
      window.setTimeout(scrollToHash, 80)
      return
    }

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    function onPop() {
      setPath(window.location.pathname)
      setSearch(window.location.search)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  return { path, search, navigate }
}

export default function App() {
  const route = useRoute()
  const normalizedPath = normalizePath(route.path)
  const keywordPage = findKeywordPageByPath(normalizedPath)
  const [publicOrigin, setPublicOrigin] = useState(defaultOrigin)
  const [headerTight, setHeaderTight] = useState(() => window.scrollY > 10)
  const [billing, setBilling] = useState('annual')
  const [selectedPlan, setSelectedPlan] = useState('pro')
  const [scan] = useState(() => analyzeUrlLocally(getDefaultUrl()))
  const [checkout, setCheckout] = useState(null)
  const [checkoutLoadingKey, setCheckoutLoadingKey] = useState('')

  useEffect(() => {
    syncSeo(normalizedPath)
    trackEvent('page_view', { route: normalizedPath })
  }, [normalizedPath])

  useEffect(() => {
    let cancelled = false
    fetch('/api/runtime')
      .then(readJson)
      .then((payload) => {
        if (!cancelled && payload?.publicAppOrigin) setPublicOrigin(payload.publicAppOrigin)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    function onScroll() {
      setHeaderTight(window.scrollY > 10)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const allowed = new Set([window.location.origin, new URL(publicOrigin).origin])
    function onMessage(event) {
      if (!allowed.has(event.origin)) return
      if (event.data?.type === 'ladybird-checkout-complete') {
        setCheckout(null)
        route.navigate('/?payment=success')
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [publicOrigin, route])

  async function startCheckout(planId = 'pro', cycle = billing, loadingKey = `checkout-${planId}-${cycle}`) {
    setSelectedPlan(planId)
    setBilling(cycle)
    setCheckoutLoadingKey(loadingKey)
    setCheckout({ status: 'loading', planId, billing: cycle, loadingKey })
    trackEvent('checkout_started', { planId, billing: cycle })

    const popup = openCenteredCheckoutWindow()

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, billing: cycle }),
      })
      const payload = await readJson(response)
      if (!response.ok || !payload?.ok || !payload.checkoutUrl) {
        throw new Error(payload?.error || 'Checkout could not be created.')
      }
      sendPopupToCheckout(popup, payload.checkoutUrl)
      setCheckout({ status: 'popup', planId, billing: cycle, checkoutUrl: payload.checkoutUrl, loadingKey })
      trackEvent('checkout_popup_opened', { planId, billing: cycle })
    } catch (error) {
      try {
        if (popup && !popup.closed) popup.close()
      } catch {
        /* Nothing to close. */
      }
      setCheckout({
        status: 'error',
        planId,
        billing: cycle,
        loadingKey,
        error: error instanceof Error ? error.message : 'Checkout could not be created.',
      })
      trackEvent('checkout_error', { planId, billing: cycle })
    } finally {
      setCheckoutLoadingKey('')
    }
  }

  function headerLink(to) {
    return (event) => {
      event.preventDefault()
      route.navigate(to)
    }
  }

  function goToPricing() {
    setBilling('annual')
    setSelectedPlan('pro')
    route.navigate('/#pricing')
    const scrollToRecommendedPlan = () =>
      document.querySelector('.lb-plan-card[data-popular="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    requestAnimationFrame(scrollToRecommendedPlan)
    window.setTimeout(scrollToRecommendedPlan, 120)
    window.setTimeout(scrollToRecommendedPlan, 420)
  }

  function renderHeader() {
    return (
      <header className={`lb-header${headerTight ? ' is-tight' : ''}`}>
        <div className="lb-header-inner">
          <a className="lb-brand" href="/" onClick={headerLink('/')}>
            <span className="lb-brand-mark" aria-hidden="true">
              <span />
            </span>
            <span>Ladybird Best</span>
          </a>
          <nav className="lb-nav" aria-label="Primary">
            <a href="/#readiness" onClick={headerLink('/#readiness')}>
              Readiness
            </a>
            <a href="/ladybird-browser" onClick={headerLink('/ladybird-browser')}>
              Browser
            </a>
            <a href="/ladybird-download" onClick={headerLink('/ladybird-download')}>
              Download guide
            </a>
            <a href="/#pricing" onClick={headerLink('/#pricing')}>
              Pricing
            </a>
          </nav>
          <button className="lb-button lb-button-soft lb-header-cta" type="button" onClick={goToPricing}>
            Choose Pro annual
          </button>
        </div>
      </header>
    )
  }

  function renderScanCard() {
    return (
      <section className="lb-scan-card" aria-label="Ladybird readiness workspace preview">
        <div className="lb-scan-top">
          <div>
            <p className="lb-eyebrow">Workspace preview</p>
            <h2>See what Flight Deck reviews before your team spends engineering time.</h2>
          </div>
          <span className="lb-live-dot">Pro annual</span>
        </div>

        <div className="lb-score-row">
          <div className="lb-score-ring" style={{ '--score': scan.score }}>
            <strong>{scan.score}</strong>
            <span>{scan.grade}</span>
          </div>
          <div>
            <p className="lb-result-title">{scan.urgency}</p>
            <p className="lb-muted">{scan.summary}</p>
          </div>
        </div>

        <div className="lb-check-grid">
          {scan.checks.map((check) => (
            <article className={`lb-check-card is-${check.status}`} key={check.label}>
              <span>{check.status}</span>
              <h3>{check.label}</h3>
              <p>{check.detail}</p>
            </article>
          ))}
        </div>

        <div className="lb-risk-panel">
          <div>
            <strong>What the paid workspace turns into action</strong>
            <p>Keep the first review narrow and attached to a revenue journey.</p>
          </div>
          <ul>
            {scan.risks.map((risk) => (
              <li key={risk}>{risk}</li>
            ))}
          </ul>
        </div>

        <div className="lb-next-actions">
          <button className="lb-button lb-button-red" type="button" onClick={goToPricing}>
            Choose annual Pro
          </button>
          <a href="/ladybird-browser" onClick={headerLink('/ladybird-browser')}>
            Read the browser guide
          </a>
        </div>
      </section>
    )
  }

  function renderHome() {
    const paymentSuccess = new URLSearchParams(route.search).get('payment') === 'success'

    return (
      <main className="lb-main">
        {paymentSuccess ? <div className="lb-success">Payment received. You are back on the homepage and the workspace setup can begin.</div> : null}

        <section className="lb-hero" id="readiness">
          <div className="lb-hero-copy">
            <p className="lb-eyebrow">Independent browser readiness for the Ladybird era</p>
            <h1>See whether your site is ready for Ladybird Browser before your users ask.</h1>
            <p className="lb-lede">
              Start with a monitored readiness workspace that turns standards, media, login, and checkout risk into a short
              action plan for a truly independent web engine.
            </p>
            <div className="lb-hero-actions">
              <button className="lb-button lb-button-red" type="button" onClick={goToPricing}>
                Choose Pro annual
              </button>
              <button
                className="lb-button lb-button-cream"
                type="button"
                onClick={() => route.navigate('/ladybird-browser')}
              >
                Read the browser guide
              </button>
            </div>
            <div className="lb-trust-row">
              <span>Pro selected by default</span>
              <span>Annual is 50% less</span>
              <span>Checkout opens in a popup</span>
            </div>
          </div>

          {renderScanCard()}
        </section>

        <section className="lb-proof-strip" aria-label="Site readiness proof">
          {proof.map((item) => (
            <article key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </article>
          ))}
        </section>

        <section className="lb-section lb-split">
          <div>
            <p className="lb-eyebrow">Why this matters</p>
            <h2>A new engine rewards sites that stayed close to the web platform.</h2>
          </div>
          <div className="lb-copy-stack">
            <p>
              Ladybird is compelling because it is not another wrapper around an incumbent browser engine. That makes it a clean
              test of whether your site depends on standards or on accidental compatibility.
            </p>
            <p>
              The fastest path is not a giant audit. It is one URL, one revenue journey, one short list of risks, and a checkout
              path that lets the team keep momentum while intent is fresh.
            </p>
          </div>
        </section>

        <section className="lb-section">
          <div className="lb-section-head">
            <p className="lb-eyebrow">What the workspace watches</p>
            <h2>Built for the browser questions that usually get discovered too late.</h2>
          </div>
          <div className="lb-feature-grid">
            {[
              ['Markup and headers', 'HTML shape, module scripts, security headers, redirects, and obvious engine assumptions.'],
              ['Checkout and login', 'Popups, success URLs, OAuth redirects, storage, and authenticated journey notes.'],
              ['Media readiness', 'Video, captions, fullscreen, protected playback, and streaming-risk separation.'],
              ['Project signal', 'A human-readable pulse on Ladybird Browser progress that affects your support plan.'],
            ].map(([title, body]) => (
              <article className="lb-feature-card" key={title}>
                <span aria-hidden="true" />
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        {renderPricing()}

        <section className="lb-section">
          <div className="lb-section-head">
            <p className="lb-eyebrow">Useful Ladybird guides</p>
            <h2>Clear answers for the searches people make before they trust a new browser story.</h2>
          </div>
          <div className="lb-guide-grid">
            {keywordPages.map((page) => (
              <a className="lb-guide-card" href={page.path} key={page.path} onClick={headerLink(page.path)}>
                <span>{page.eyebrow}</span>
                <strong>{page.h1}</strong>
                <p>{page.intent}</p>
              </a>
            ))}
          </div>
        </section>

        <section className="lb-section lb-source-note">
          <div>
            <p className="lb-eyebrow">Project respect</p>
            <h2>Independent workspace, official sources.</h2>
            <p>
              Ladybird Best is not affiliated with the official Ladybird Browser project. It helps teams prepare their own sites
              while pointing readers back to the source for project truth.
            </p>
          </div>
          <div className="lb-source-links">
            {officialLinks.map((link) => (
              <a href={link.href} target="_blank" rel="noreferrer" key={link.href}>
                {link.label}
              </a>
            ))}
          </div>
        </section>
      </main>
    )
  }

  function renderPricing() {
    return (
      <section className="lb-section lb-pricing" id="pricing">
        <div className="lb-pricing-head">
          <div>
            <p className="lb-eyebrow">Pricing</p>
            <h2>Flight Deck annual is selected because serious readiness takes more than one look.</h2>
            <p>Annual billing is the default and is 50% less than paying month to month.</p>
          </div>
          <div className="lb-toggle" role="group" aria-label="Billing cycle">
            <button type="button" data-active={billing === 'monthly'} onClick={() => setBilling('monthly')}>
              Monthly
            </button>
            <button type="button" data-active={billing === 'annual'} onClick={() => setBilling('annual')}>
              Annual - 50% less
            </button>
          </div>
        </div>
        <div className="lb-plan-grid">
          {plans.map((plan) => {
            const effective = billing === 'annual' ? plan.monthlyUsd * annualMultiplier : plan.monthlyUsd
            const loadingKey = `plan-${plan.id}-${billing}`
            return (
              <article className="lb-plan-card" data-popular={plan.popular ? 'true' : 'false'} key={plan.id}>
                {plan.popular ? <span className="lb-plan-badge">Default choice</span> : null}
                <h3>{plan.name}</h3>
                <p>{plan.tagline}</p>
                <div className="lb-price">
                  <strong>{formatMoney(effective)}</strong>
                  <span>/mo</span>
                  {billing === 'annual' ? <del>{formatMoney(plan.monthlyUsd)}</del> : null}
                </div>
                <small>{billing === 'annual' ? `${formatMoney(effective * 12)} billed annually` : 'Billed monthly'}</small>
                <ul>
                  {plan.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
                <button
                  className={plan.popular ? 'lb-button lb-button-red' : 'lb-button lb-button-dark'}
                  type="button"
                  onMouseEnter={() => setSelectedPlan(plan.id)}
                  onFocus={() => setSelectedPlan(plan.id)}
                  onClick={() => startCheckout(plan.id, billing, loadingKey)}
                  disabled={Boolean(checkoutLoadingKey)}
                >
                  {checkoutLoadingKey === loadingKey ? 'Opening checkout...' : `Checkout ${plan.label} ${billing}`}
                </button>
                {selectedPlan === plan.id ? <span className="lb-selected">Selected</span> : null}
              </article>
            )
          })}
        </div>
      </section>
    )
  }

  function renderKeywordPage(page) {
    return (
      <main className="lb-main">
        <article className="lb-article">
          <a className="lb-back-link" href="/" onClick={headerLink('/')}>
            Back to Ladybird Best
          </a>
          <p className="lb-eyebrow">{page.eyebrow}</p>
          <h1>{page.h1}</h1>
          <p className="lb-lede">{page.lede}</p>
          <div className="lb-intent-box">
            <strong>Best for</strong>
            <span>{page.intent}</span>
          </div>
          {page.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.bullets ? (
                <ul>
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
          <section>
            <h2>Quick answers</h2>
            <div className="lb-faq-grid">
              {page.faqs.map((faq) => (
                <article key={faq.question}>
                  <h3>{faq.question}</h3>
                  <p>{faq.answer}</p>
                </article>
              ))}
            </div>
          </section>
          <aside className="lb-article-cta">
            <div>
              <p className="lb-eyebrow">Next step</p>
              <h2>Choose the readiness plan while the context is fresh.</h2>
              <p>The fastest way to make this practical is to attach the review to the page your users actually land on.</p>
            </div>
            <button className="lb-button lb-button-red" type="button" onClick={goToPricing}>
              See recommended plan
            </button>
          </aside>
        </article>
      </main>
    )
  }

  function renderPrivacy() {
    return (
      <main className="lb-main">
        <article className="lb-article">
          <p className="lb-eyebrow">Privacy</p>
          <h1>Privacy Policy</h1>
          <p className="lb-lede">
            Ladybird Best keeps readiness work focused on public URLs and uses first-party events only to understand whether the
            product is working.
          </p>
          <section>
            <h2>Readiness reviews</h2>
            <p>
              Paid workspaces review public HTTP or HTTPS URLs and inspect reachable signals such as headers and markup hints. Do
              not submit private dashboards or URLs containing secrets.
            </p>
            <h2>Payments</h2>
            <p>Payments are handled through Creem hosted checkout. We receive payment metadata needed for fulfillment and support.</p>
            <h2>Measurement</h2>
            <p>We send simple first-party events such as page views, pricing intent, and checkout starts. We do not use third-party tracking cookies.</p>
          </section>
        </article>
      </main>
    )
  }

  function renderTerms() {
    return (
      <main className="lb-main">
        <article className="lb-article">
          <p className="lb-eyebrow">Terms</p>
          <h1>Terms of Service</h1>
          <p className="lb-lede">
            By using Ladybird Best, you agree to use public URLs responsibly, keep payment information accurate, and treat readiness
            results as planning support rather than a guarantee of future browser behavior.
          </p>
          <section>
            <h2>Service scope</h2>
            <p>Plans cover paid readiness reviews, monitored journey notes, browser-progress interpretation, and practical compatibility guidance.</p>
            <h2>Independent project</h2>
            <p>Ladybird Best is independent and is not affiliated with the official Ladybird Browser project.</p>
            <h2>Payments</h2>
            <p>Plan payment happens in a Creem hosted checkout popup and returns to the homepage after completion.</p>
          </section>
        </article>
      </main>
    )
  }

  function renderCheckoutOverlay() {
    if (!checkout) return null
    return (
      <div className="lb-checkout-backdrop" role="presentation">
        <section className="lb-checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
          <button className="lb-close" type="button" aria-label="Close checkout status" onClick={() => setCheckout(null)}>
            ×
          </button>
          {checkout.status === 'loading' ? (
            <>
              <p className="lb-eyebrow">Secure checkout</p>
              <h2 id="checkout-title">Opening Creem...</h2>
              <p>The payment window is being prepared. Keep this page open.</p>
              <div className="lb-loader" aria-hidden="true" />
            </>
          ) : checkout.status === 'popup' ? (
            <>
              <p className="lb-eyebrow">Secure checkout</p>
              <h2 id="checkout-title">Creem checkout is open.</h2>
              <p>Finish payment in the centered popup. This page stays in place and returns home after success.</p>
              <a className="lb-button lb-button-dark" href={checkout.checkoutUrl} target="_blank" rel="noreferrer">
                Reopen payment window
              </a>
            </>
          ) : (
            <>
              <p className="lb-eyebrow">Secure checkout</p>
              <h2 id="checkout-title">Checkout needs another try.</h2>
              <p>{checkout.error || 'The payment session could not be created.'}</p>
              <button
                className="lb-button lb-button-red"
                type="button"
                onClick={() => startCheckout(checkout.planId, checkout.billing, checkout.loadingKey)}
              >
                Try Creem checkout again
              </button>
            </>
          )}
        </section>
      </div>
    )
  }

  function renderNotFound() {
    return (
      <main className="lb-main">
        <section className="lb-centered">
          <p className="lb-eyebrow">404</p>
          <h1>That page flew off.</h1>
          <button className="lb-button lb-button-red" type="button" onClick={() => route.navigate('/')}>
            Return home
          </button>
        </section>
      </main>
    )
  }

  let body
  if (normalizedPath === '/') body = renderHome()
  else if (keywordPage) body = renderKeywordPage(keywordPage)
  else if (normalizedPath === '/privacy') body = renderPrivacy()
  else if (normalizedPath === '/terms') body = renderTerms()
  else if (normalizedPath === '/checkout/done') body = <CheckoutDoneBridge />
  else body = renderNotFound()

  return (
    <div className="lb-shell">
      <div className="lb-bg-orbit" aria-hidden="true" />
      {renderHeader()}
      {body}
      {renderCheckoutOverlay()}
      <footer className="lb-footer">
        <div>
          <strong>Ladybird Best</strong>
          <span>Independent readiness workspace for teams watching Ladybird Browser.</span>
        </div>
        <nav aria-label="Footer">
          <a href="/privacy" onClick={headerLink('/privacy')}>
            Privacy
          </a>
          <a href="/terms" onClick={headerLink('/terms')}>
            Terms
          </a>
          <a href="https://github.com/LadybirdBrowser/ladybird" target="_blank" rel="noreferrer">
            Official GitHub
          </a>
        </nav>
      </footer>
    </div>
  )
}
