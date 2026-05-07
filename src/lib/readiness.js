const sampleUrls = [
  'https://ladybird.org',
  'https://github.com/LadybirdBrowser/ladybird',
  'https://example.com/pricing',
]

export function getDefaultUrl() {
  return sampleUrls[0]
}

export function normalizeTargetUrl(value) {
  const trimmed = String(value || '').trim()
  if (!trimmed) throw new Error('Enter a public URL to scan.')
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  const url = new URL(withProtocol)
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only HTTP and HTTPS URLs can be scanned.')
  return url.toString()
}

export function analyzeUrlLocally(value) {
  const targetUrl = normalizeTargetUrl(value)
  const url = new URL(targetUrl)
  const host = url.hostname.toLowerCase()
  const path = url.pathname.toLowerCase()
  const isSecure = url.protocol === 'https:'
  const isApp = /app|dashboard|login|account|checkout|pricing|console|portal/.test(path)
  const isMedia = /video|watch|stream|movie|netflix|player|live/.test(`${host}${path}`)
  const isDocs = /docs|github|developer|api|reference/.test(`${host}${path}`)
  const isMarketing = /pricing|features|landing|home|product/.test(path)

  let score = 62
  if (isSecure) score += 10
  if (isDocs) score += 6
  if (isMarketing) score += 5
  if (isApp) score -= 4
  if (isMedia) score -= 12
  if (host.includes('github')) score += 3
  if (host.includes('netflix')) score -= 18
  score = Math.max(28, Math.min(96, score))

  const grade = score >= 82 ? 'Strong' : score >= 68 ? 'Promising' : score >= 52 ? 'Needs review' : 'High risk'
  const urgency =
    score >= 82
      ? 'Good candidate for a focused independent-browser smoke test.'
      : score >= 68
        ? 'Worth testing after a short standards and flow audit.'
        : score >= 52
          ? 'Review core journeys before promising support.'
          : 'Start with a narrow compatibility plan before broad rollout.'

  return {
    mode: 'local-preview',
    targetUrl,
    score,
    grade,
    urgency,
    checks: buildChecks({
      isSecure,
      isApp,
      isMedia,
      isDocs,
      hasCsp: false,
      hasHsts: false,
      hasModuleScripts: isDocs || isMarketing,
      hasHeavyMedia: isMedia,
      hasPaymentFlow: /checkout|pricing|billing|subscribe/.test(path),
      markupStatus: 'unknown',
    }),
    risks: buildRisks({ isApp, isMedia, hasCsp: false, hasHsts: false, hasPaymentFlow: /checkout|pricing|billing|subscribe/.test(path) }),
    nextSteps: buildNextSteps({ isApp, isMedia, isDocs, hasPaymentFlow: /checkout|pricing|billing|subscribe/.test(path) }),
    summary:
      'This quick preview uses URL shape and public context. The hosted workspace adds header, markup, flow, and recurring checks.',
  }
}

export function buildChecks(context) {
  return [
    {
      label: 'Standards surface',
      status: context.markupStatus === 'html' || context.hasModuleScripts ? 'pass' : 'watch',
      detail:
        context.markupStatus === 'html'
          ? 'HTML was reachable and can be reviewed for engine-neutral patterns.'
          : 'Scan could not fully inspect markup yet; start with a smoke test.',
    },
    {
      label: 'Secure delivery',
      status: context.isSecure && (context.hasHsts || context.hasCsp) ? 'pass' : context.isSecure ? 'watch' : 'risk',
      detail: context.isSecure
        ? 'HTTPS is present. HSTS and CSP make the independent-browser test path cleaner.'
        : 'HTTP delivery creates avoidable security and redirect noise.',
    },
    {
      label: 'App and checkout flows',
      status: context.hasPaymentFlow ? 'watch' : context.isApp ? 'watch' : 'pass',
      detail: context.hasPaymentFlow
        ? 'Payment, popup, and redirect behavior should be tested as one journey.'
        : context.isApp
          ? 'Authenticated app pages need a narrower test script than public content.'
          : 'Public pages are usually the easiest first target.',
    },
    {
      label: 'Media and DRM',
      status: context.hasHeavyMedia ? 'risk' : context.isMedia ? 'watch' : 'pass',
      detail: context.hasHeavyMedia
        ? 'Video, encrypted playback, or streaming hints need a separate media plan.'
        : 'No heavy media signal was detected in the first pass.',
    },
  ]
}

export function buildRisks(context) {
  const risks = []
  if (!context.hasCsp) risks.push('Add or tighten Content-Security-Policy before deeper browser testing.')
  if (!context.hasHsts) risks.push('Confirm HSTS and redirect behavior so protocol changes do not pollute results.')
  if (context.hasPaymentFlow) risks.push('Test checkout in a popup and same-tab fallback; payment flows are where small browser differences become expensive.')
  if (context.isApp) risks.push('Write a login-to-core-action script instead of testing a dashboard page in isolation.')
  if (context.isMedia) risks.push('Separate ordinary playback from DRM or streaming-service compatibility.')
  if (!risks.length) risks.push('Run a real crawl next; the first-pass signals look clean enough to move quickly.')
  return risks.slice(0, 4)
}

export function buildNextSteps(context) {
  const steps = ['Run a real browser smoke test for the top public page and one revenue-critical journey.']
  if (context.isDocs) steps.push('Track upstream Ladybird changes that affect docs, code blocks, navigation, and search pages.')
  if (context.hasPaymentFlow) steps.push('Verify popup handling, success return URLs, and third-party checkout scripts.')
  if (context.isMedia) steps.push('Create a separate media matrix for codecs, captions, fullscreen, and protected playback.')
  if (context.isApp) steps.push('Keep authentication, storage, and session refresh in the same test script.')
  steps.push('Move recurring monitoring to Pro annual so regressions do not hide between manual checks.')
  return steps.slice(0, 5)
}
