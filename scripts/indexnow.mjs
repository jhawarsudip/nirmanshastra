#!/usr/bin/env node
// IndexNow submission for nirmanshastra.in (Bing, Yandex, Seznam, Naver, Yep and others
// share submissions). DRY RUN by default: prints what would be sent. Nothing leaves your
// machine until you pass --submit, and you should only do that AFTER the site is
// deployed, because IndexNow fetches the key file from the live site.
//
//   node scripts/indexnow.mjs            # dry run: list the URLs
//   node scripts/indexnow.mjs --submit   # POST them to api.indexnow.org
//
// The key is not a secret: it must be publicly readable at /<key>.txt (public/e57faccc002c3d1e5abc2a4225ae2193.txt).

const HOST = 'www.nirmanshastra.in'
const KEY = 'e57faccc002c3d1e5abc2a4225ae2193'
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`
const SITEMAP = `https://${HOST}/sitemap.xml`
const submit = process.argv.includes('--submit')

const xml = await (await fetch(SITEMAP)).text()
const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
console.log(`${urlList.length} URLs from ${SITEMAP}`)

const keyRes = await fetch(KEY_LOCATION)
const keyBody = keyRes.ok ? (await keyRes.text()).trim() : ''
if (keyBody !== KEY) {
  console.error(`Key file not live yet at ${KEY_LOCATION} (status ${keyRes.status}). Deploy first.`)
  if (submit) process.exit(1)
}
if (!submit) { urlList.forEach((u) => console.log('  ' + u)); console.log('\nDry run only. Re-run with --submit after deploying.'); process.exit(0) }

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList }),
})
console.log('IndexNow response:', res.status, res.statusText, '(200 or 202 = accepted)')
