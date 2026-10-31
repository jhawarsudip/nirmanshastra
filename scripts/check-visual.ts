/*
  Group 7 check: the first screen.
    - the header's poured lip: every page starts below it (one token, --ns-lip), on the homepage and on every inner page
    - the hero headline is plain text in one block, in the server markup, and nothing starts it hidden
    - the plumb-line intro (an opaque sheet over the whole first screen) never runs on a phone, and its picture is not preloaded
    - fonts: Rozha One (headline) preloaded with font-display: swap; Mukta cut to the three weights used; no stray preloads
    - the header's links, "Log in" and "Start free" never wrap onto a second line
  The real timings (Slow 4G, mobile) are measured in a browser; this guards the code that makes them true.
  Run: npx tsx --tsconfig tsconfig.json scripts/check-visual.ts
*/
import { readFileSync } from 'fs'

let failed = 0
const ok = (c: boolean, w: string) => { if (c) console.log(`  ok   ${w}`); else { failed++; console.log(`  FAIL ${w}`) } }
const read = (p: string) => readFileSync(p, 'utf8')

const base = read('styles/v2/base.css')
const hero = read('styles/v2/hero.css')
const inner = read('styles/v2/inner.css')
const chrome = read('styles/v2/chrome.css')
const heroTsx = read('components/v2/sections/Hero.tsx')
const fonts = read('lib/v2/fonts.ts')
const init = read('lib/v2/init.ts')
const plumb = read('components/v2/PlumbLoad.tsx')
const rootLayout = read('app/layout.tsx')

console.log('The header lip')
ok(/--ns-lip:\s*calc\(clamp\(54px, 5\.1vw, 104px\) \* \.87 \+ 10px\)/.test(base), '--ns-lip is defined from the lip height (54-104px tile, 87% reach, +10px)')
ok(/@media \(max-width: 899px\) \{ \.ns2 \{ --ns-lip: calc\(clamp\(48px, 12vw, 84px\) \* \.81 \+ 10px\); \} \}/.test(base), '--ns-lip under 900px is defined from the narrow lip (48-84px tile, 81% reach, +10px)')
const lipTile = read('styles/v2/pour.css')
ok(/\.ns2 \.ns-pour--lip \{ --pour-h: clamp\(54px, 5\.1vw, 104px\)/.test(lipTile), 'the token matches the lip height in pour.css')
ok(/@media \(max-width: 899px\) \{ \.ns2 \.ns-pour--lip \{ --pour-h: clamp\(48px, 12vw, 84px\)/.test(lipTile), 'the narrow token matches the narrow lip height in pour.css')
ok(/\.ns-hero \{ padding-top: max\(clamp\(26px, 4\.4vw, 70px\), var\(--ns-lip\)\)/.test(hero), 'desktop hero starts below the lip')
ok(/#main \.ns-hero__top \{ order: -5; margin: var\(--ns-lip\) /.test(hero), 'phone hero starts below the lip')
ok(/\.ns-i-page \{ padding-block: max\(clamp\(22px, 3\.2vw, 44px\), var\(--ns-lip\)\)/.test(inner), 'every inner page starts below the lip')

console.log('The headline')
const h1 = /<h1[\s\S]*?<\/h1>/.exec(heroTsx)?.[0] ?? ''
ok(h1.includes('id="ns-h1"') && h1.includes('pick(HERO.h1a, loc)') && h1.includes('pick(HERO.h1b, loc)'), 'the h1 renders both headline lines from the copy file (server markup)')
ok(!/ns-wipe|ns-rise|style=|opacity|hidden/.test(h1), 'the h1 carries no entrance class, inline style or hidden state')
ok(!/ns-hero-wipe|clip-path/.test(hero.replace(/\/\*[\s\S]*?\*\//g, '')), 'the hero stylesheet has no clip-path or wipe that could hide the headline')
ok(!/\.ns-hero__h1[^{]*\{[^}]*opacity\s*:\s*0/.test(hero), 'no rule starts the headline at opacity 0')
ok(/'use client'/.test(heroTsx) && !/useEffect|useState/.test(h1), 'the headline does not wait for client code')

console.log('The plumb-line intro')
ok(/matchMedia\('\(max-width: 700px\)'\)\.matches/.test(init), 'the init script skips the intro on a phone')
ok(!/\bpriority\b/.test(plumb.replace(/\/\*[\s\S]*?\*\//g, '')), "the intro's picture is not preloaded")

console.log('Fonts')
ok(/Rozha_One\(\{[^}]*preload: true[^}]*display: 'swap'|Rozha_One\(\{[^}]*display: 'swap'[^}]*preload: true/.test(fonts), 'Rozha One (headline) is preloaded with font-display: swap')
ok(/Rozha_One\(\{ subsets: \['latin'\]/.test(fonts), 'only the Latin headline file is preloaded')
ok(/Mukta\(\{[^}]*weight: \['400', '600', '700'\]/.test(fonts) && /Mukta\(\{[^}]*display: 'swap'/.test(fonts), 'Mukta is three weights, 400 / 600 / 700, with swap')
ok(/IBM_Plex_Mono\(\{[^}]*preload: false/.test(rootLayout.replace(/\n/g, ' ')), 'IBM Plex Mono is not preloaded')
const used = new Set<string>()
for (const f of ['base', 'chrome', 'hero', 'inner', 'sections', 'closing', 'content', 'plain', 'story', 'vastu', 'results', 'calc', 'founder']) {
  for (const m of read(`styles/v2/${f}.css`).matchAll(/font-weight:\s*(\d{3})/g)) used.add(m[1])
}
ok([...used].every(w => ['400', '500', '600', '700', '800'].includes(w)), `the stylesheets only ask for weights the family can serve or round to (${[...used].sort().join(', ')})`)

console.log('The header')
ok(/\.ns-nav > a, \.ns-nav > button, \.ns-header__login, \.ns-header__cta \{ white-space: nowrap; \}/.test(chrome), 'links, Log in and Start free never wrap')
ok(/@media \(min-width: 1200px\) and \(max-width: 1439px\)/.test(chrome), 'a tighter header for 1200-1439 px')

console.log(failed ? `\n${failed} FAILED` : '\nAll checks passed')
process.exit(failed ? 1 : 0)
