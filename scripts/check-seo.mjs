#!/usr/bin/env node
// Pre- and post-deploy SEO / AEO check. No dependencies, no writes, GET/HEAD only.
//
//   node scripts/check-seo.mjs                     # checks http://localhost:3100
//   node scripts/check-seo.mjs https://www.nirmanshastra.in
//
// 1. Every AI / search crawler user agent gets 200 on the key URLs.
// 2. robots.txt names each AI bot with Allow: / and keeps private routes disallowed.
// 3. Every sitemap URL returns 200 and passes on-page checks (title, description,
//    canonical, one h1, og:image, quick answer + FAQ where required, alt text).
// 4. Every JSON-LD block parses and has the properties its @type needs, FAQ questions
//    appear in the visible page text, and there is no invented rating or review.
// Exit code 1 if anything fails.

const BASE = (process.argv[2] || 'http://localhost:3100').replace(/\/$/, '')
const PROD_ORIGINS = ['https://www.nirmanshastra.in', 'https://nirmanshastra.in']

const BOTS = {
  GPTBot: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.1; +https://openai.com/gptbot',
  'OAI-SearchBot': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot',
  'ChatGPT-User': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot',
  ClaudeBot: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)',
  'Claude-SearchBot': 'Claude-SearchBot/1.0',
  'Claude-User': 'Claude-User/1.0',
  PerplexityBot: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)',
  'Perplexity-User': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Perplexity-User/1.0; +https://perplexity.ai/perplexity-user)',
  Googlebot: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  GoogleOther: 'GoogleOther',
  Bingbot: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
  Applebot: 'Mozilla/5.0 (Applebot/0.1; +http://www.apple.com/go/applebot)',
  CCBot: 'CCBot/2.0 (https://commoncrawl.org/faq/)',
  'meta-externalagent': 'meta-externalagent/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)',
  DuckAssistBot: 'DuckAssistBot/1.0; (+http://duckduckgo.com/duckassistbot.html)',
}
const ROBOTS_BOTS = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'GoogleOther', 'Applebot', 'Applebot-Extended', 'Bingbot', 'CCBot', 'meta-externalagent', 'DuckAssistBot']
const PRIVATE = ['/admin', '/api', '/account', '/auth', '/reports']
const KEY_URLS = ['/', '/llms.txt', '/llms-full.txt', '/tools/brick-calculator', '/blog/bricks-per-sq-ft']

let failures = 0
const fail = (m) => { failures++; console.log('  FAIL ' + m) }
const warnings = []
const warn = (m) => warnings.push(m)
const ok = (m) => console.log('  ok   ' + m)
const toLocal = (u) => { for (const o of PROD_ORIGINS) if (u.startsWith(o)) return BASE + u.slice(o.length); return u }

async function get(url, ua) {
  return fetch(url, { redirect: 'manual', headers: ua ? { 'user-agent': ua } : {} })
}

// ── 1. crawler user agents ─────────────────────────────────────────────────
async function checkBots() {
  console.log('\n[1] Crawler user agents → ' + KEY_URLS.join('  '))
  let bad = 0
  for (const [name, ua] of Object.entries(BOTS)) {
    const codes = []
    for (const p of KEY_URLS) {
      const r = await get(BASE + p, ua)
      codes.push(r.status)
      if (r.status !== 200) { bad++; fail(`${name} ${p} → ${r.status}${r.headers.get('location') ? ' → ' + r.headers.get('location') : ''}`) }
    }
    if (codes.every((c) => c === 200)) ok(`${name.padEnd(20)} ${codes.join(' ')}`)
  }
  return bad
}

// ── 2. robots.txt ──────────────────────────────────────────────────────────
async function checkRobots() {
  console.log('\n[2] robots.txt')
  const t = await (await get(BASE + '/robots.txt')).text()
  const groups = []
  let cur = null
  for (const raw of t.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) { cur = null; continue }
    const [k, ...rest] = line.split(':'); const v = rest.join(':').trim()
    if (/^user-agent$/i.test(k)) { if (!cur) { cur = { agents: [], allow: [], disallow: [] }; groups.push(cur) } cur.agents.push(v) }
    else if (cur && /^allow$/i.test(k)) cur.allow.push(v)
    else if (cur && /^disallow$/i.test(k)) cur.disallow.push(v)
  }
  for (const b of ROBOTS_BOTS) {
    const g = groups.find((x) => x.agents.some((a) => a.toLowerCase() === b.toLowerCase()))
    if (!g) { fail(`${b} has no named group`); continue }
    if (!g.allow.includes('/')) fail(`${b} group lacks "Allow: /"`)
    const missing = PRIVATE.filter((p) => !g.disallow.includes(p))
    if (missing.length) fail(`${b} group is missing Disallow for ${missing.join(', ')}`)
  }
  const star = groups.find((x) => x.agents.includes('*'))
  if (!star) fail('no "*" group'); else if (PRIVATE.some((p) => !star.disallow.includes(p))) fail('"*" group missing a private Disallow')
  if (!/^sitemap:\s*https?:\/\//im.test(t)) fail('no Sitemap line')
  if (failures === 0) ok(`${ROBOTS_BOTS.length} named bots allowed, private routes disallowed, Sitemap present`)
}

// ── helpers for page checks ────────────────────────────────────────────────
const strip = (h) => h.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ')
const norm = (s) => s.replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim().toLowerCase()
const attr = (tag, a) => (tag.match(new RegExp(a + '="([^"]*)"', 'i')) || [])[1]
function jsonLd(html) {
  const out = []
  for (const m of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    try { out.push(JSON.parse(m[1])) } catch (e) { out.push({ __error: e.message }) }
  }
  const nodes = []
  const walk = (n) => { if (Array.isArray(n)) n.forEach(walk); else if (n && typeof n === 'object') { if (n['@graph']) walk(n['@graph']); else nodes.push(n) } }
  out.forEach(walk)
  return nodes
}
const REQ = {
  Organization: ['name', 'url', 'logo'],
  WebSite: ['name', 'url'],
  BreadcrumbList: ['itemListElement'],
  FAQPage: ['mainEntity'],
  HowTo: ['name', 'step'],
  WebApplication: ['name', 'applicationCategory', 'offers'],
  SoftwareApplication: ['name', 'applicationCategory', 'offers'],
  Product: ['name', 'offers'],
  Article: ['headline', 'datePublished', 'dateModified', 'author', 'publisher'],
  ItemList: ['itemListElement'],
  DefinedTermSet: ['name', 'hasDefinedTerm'],
  CollectionPage: ['name'],
  Blog: ['name'],
}
function validateNode(n, text, loc) {
  const t = n['@type']; const types = Array.isArray(t) ? t : [t]
  const errs = []
  for (const ty of types) {
    for (const k of REQ[ty] || []) if (n[k] == null || (Array.isArray(n[k]) && !n[k].length)) errs.push(`${ty} missing ${k}`)
    if (ty === 'BreadcrumbList') (n.itemListElement || []).forEach((it, i) => { if (it.position !== i + 1 || !it.name || !(it.item || it['@id'])) errs.push(`Breadcrumb item ${i + 1} malformed`) })
    if (ty === 'FAQPage') (n.mainEntity || []).forEach((q) => {
      if (q['@type'] !== 'Question' || !q.name || !q.acceptedAnswer?.text) errs.push('FAQ item malformed')
      else if (!text.includes(norm(q.name))) errs.push(`FAQ question not visible on page: "${q.name.slice(0, 50)}"`)
    })
    if (ty === 'HowTo') (n.step || []).forEach((s, i) => { if (!s.text && !s.name) errs.push(`HowTo step ${i + 1} empty`) })
    if (['WebApplication', 'SoftwareApplication', 'Product'].includes(ty)) {
      const offers = [].concat(n.offers || [])
      offers.forEach((o) => { if (o.price == null || o.priceCurrency !== 'INR') errs.push('offer needs price + priceCurrency INR') })
    }
    if (ty === 'Article') {
      const a = n.author; const au = Array.isArray(a) ? a[0] : a
      if (!au || au['@type'] !== 'Organization') errs.push('Article author must be the Organization')
    }
    if (ty === 'AggregateRating' || ty === 'Review') errs.push(`${ty} must not appear (no invented ratings)`)
  }
  if (n.aggregateRating || n.review) errs.push('aggregateRating/review must not appear')
  return errs.map((e) => `${loc}: ${e}`)
}

// ── 3 + 4. pages ───────────────────────────────────────────────────────────
async function checkPages() {
  console.log('\n[3/4] Sitemap pages: on-page checks and JSON-LD')
  const xml = await (await get(BASE + '/sitemap.xml')).text()
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => toLocal(m[1]))
  console.log(`  ${urls.length} URLs in sitemap`)
  const typeCount = {}
  const seenTitles = new Map()
  const seenDescs = new Map()
  let pageFails = 0
  for (const u of urls) {
    const path = u.replace(BASE, '') || '/'
    const r = await get(u, BOTS.GPTBot)
    if (r.status !== 200) { fail(`${path} → ${r.status}`); pageFails++; continue }
    const html = await r.text()
    const text = norm(strip(html))
    const errs = []
    const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]
    if (!title) errs.push('no <title>'); else if (title.length > 75) warn(`${path}  title ${title.length} chars: ${title.replace(/\s+/g, ' ').trim().slice(0, 70)}…`)
    if (title && /\|\s*NirmanShastra\s*\|\s*NirmanShastra\s*$/i.test(title.replace(/&amp;/g, '&').trim())) errs.push('brand repeated twice in <title>')
    if (title) {
      const k = norm(title)
      if (seenTitles.has(k)) errs.push(`duplicate <title> (also on ${seenTitles.get(k)})`); else seenTitles.set(k, path)
    }
    const desc = (html.match(/<meta[^>]+name="description"[^>]*>/i) || [''])[0]
    if (!attr(desc, 'content')) errs.push('no meta description')
    else {
      const k = norm(attr(desc, 'content'))
      if (seenDescs.has(k)) errs.push(`duplicate meta description (also on ${seenDescs.get(k)})`); else seenDescs.set(k, path)
    }
    const canon = (html.match(/<link[^>]+rel="canonical"[^>]*>/i) || [''])[0]
    if (!attr(canon, 'href')) errs.push('no canonical')
    const h1 = (html.match(/<h1[\s>]/gi) || []).length
    if (h1 !== 1) errs.push(`${h1} h1 tags`)
    if (!/property="og:image"/i.test(html)) errs.push('no og:image')
    const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0])
    imgs.forEach((i) => { if (!/\balt=/i.test(i)) errs.push('img without alt attribute') })
    const needsQA = /^\/(tools\/(bar-bending|water-tank|concrete-mix|brick|wire-size|ra-bill|concrete-cube|daily-wage|finish-tier|earned-value)|blog\/.+)/.test(path)
    if (needsQA) {
      const qi = html.search(/aria-label="Quick answer"/)
      if (qi < 0) errs.push('no quick-answer box')
      else {
        // The answer is the first <p> in the box that is not the "Quick answer · question" label line.
        const ps = [...html.slice(qi, qi + 4000).matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => norm(strip(m[1])))
        const ans = ps.find((t) => t && !/^quick answer\b/i.test(t))
        const words = ans ? ans.split(/\s+/).filter(Boolean).length : 0
        if (!ans) errs.push('quick-answer box has no answer paragraph')
        else if (words < 40 || words > 60) errs.push(`quick answer is ${words} words (spec: 40–60)`)
      }
      if (!/<details/.test(html) && !/Frequently asked|data-faq/.test(html)) errs.push('no visible FAQ')
    }
    if (/^\/tools\/(structopro|masonpro|electropro|plumbpro|interiorpro|grand-total)$/.test(path) && !/About this report/.test(html)) errs.push('paid-tool explainer missing')
    const nodes = jsonLd(html)
    if (nodes.some((n) => n.__error)) errs.push('JSON-LD parse error')
    nodes.filter((n) => !n.__error).forEach((n) => {
      ;[].concat(n['@type'] || []).forEach((t) => (typeCount[t] = (typeCount[t] || 0) + 1))
      errs.push(...validateNode(n, text, 'JSON-LD'))
    })
    if (path !== '/hi' && !nodes.some((n) => [].concat(n['@type']).includes('BreadcrumbList')) && path !== '/')
      errs.push('inner page has no BreadcrumbList')
    if (errs.length) { pageFails++; fail(`${path}\n         ` + [...new Set(errs)].join('\n         ')) }
  }
  if (!pageFails) ok(`all ${urls.length} pages pass`)
  console.log('  JSON-LD types seen: ' + Object.entries(typeCount).sort().map(([k, v]) => `${k}×${v}`).join('  '))
}

;(async () => {
  console.log('Checking ' + BASE)
  await checkBots()
  await checkRobots()
  await checkPages()
  if (warnings.length) {
    console.log(`\n${warnings.length} WARNING(S) (not failures):`)
    warnings.forEach((w) => console.log('  warn ' + w))
  }
  console.log(failures ? `\n${failures} FAILURE(S)` : '\nALL CHECKS PASSED')
  process.exit(failures ? 1 : 0)
})().catch((e) => { console.error(e); process.exit(2) })
