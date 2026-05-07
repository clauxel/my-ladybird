import assert from 'node:assert/strict'
import test from 'node:test'

import { keywordPages } from '../src/content/keyword-pages.js'

const requiredPages = new Map([
  ['/ladybird-github', /Ladybird GitHub/i],
  ['/ladybird-where-to-watch', /Ladybird where to watch/i],
  ['/ladybug-or-ladybird', /Ladybug or ladybird/i],
  ['/ladybird-swift', /Ladybird Swift/i],
  ['/ladybird-browser', /Ladybird Browser/i],
  ['/ladybird-os', /Ladybird OS/i],
  ['/ladybird-download', /Ladybird download/i],
  ['/ladybird-netflix', /Ladybird Netflix/i],
])

test('all requested useful Ladybird pages exist', () => {
  assert.equal(keywordPages.length, requiredPages.size)

  for (const [path, pattern] of requiredPages) {
    const page = keywordPages.find((item) => item.path === path)
    assert.ok(page, `missing ${path}`)
    assert.match(`${page.title} ${page.h1} ${page.lede}`, pattern)
    assert.ok(page.sections.length >= 2)
    assert.ok(page.faqs.length >= 2)
  }
})

test('public page copy avoids exposing the build brief', () => {
  const visibleCopy = JSON.stringify(keywordPages)
  const forbidden = [/SEO/i, /keyword/i, /曝光量/, /点击率/, /转化/, /requirements/i]

  for (const pattern of forbidden) {
    assert.doesNotMatch(visibleCopy, pattern)
  }
})
