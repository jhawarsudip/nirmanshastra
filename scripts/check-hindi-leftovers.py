"""
Which words are still English on a Hindi page?   (SJ, 30 Oct 2026: the whole site in Hindi, Devanagari, with everyday
site words allowed in English.)

Opens each route in a real browser and lists every piece of visible text (and every aria-label, placeholder, title, alt)
that still has an English word in it, after setting aside the allow-list in scripts/hindi-allowlist.txt (brand names, IS codes,
grades, units, abbreviations, a few everyday site words), numbers, and anything marked lang="en" (the EN switch, quotes of an IS clause).

Needs the site running (npm run dev, or a build on localhost) and: pip install playwright.
  python3 scripts/check-hindi-leftovers.py ROUTES.json [BASE_URL]
ROUTES.json is a list of paths, e.g. ["/hi", "/hi/about", "/hi/tools/brick-calculator"].
Env:  MOBILE=1 for a 390 px screen.  CLICK='["selector", ...]' to click things first (open every "Show the calculation").
Exit code 1 if anything is left. A page "passes" when it prints "0 leftover".
"""
import asyncio, json, os, re, sys
from pathlib import Path
from playwright.async_api import async_playwright

ROUTES = json.load(open(sys.argv[1]))
BASE = sys.argv[2] if len(sys.argv) > 2 else 'http://localhost:3000'
MOBILE = bool(os.environ.get('MOBILE'))
CLICK = json.loads(os.environ.get('CLICK', '[]'))
ALLOW = {l.strip().lower() for l in Path(__file__).with_name('hindi-allowlist.txt').read_text(encoding='utf8').splitlines()
         if l.strip() and not l.startswith('#')}

COLLECT = """() => {
  const out = []
  const skip = 'script,style,noscript,.ns-sr,nextjs-portal,.ns-code,[data-nextjs-toast],.ns-consent,.ns-lang'
  // marked English on purpose (the EN switch, a quoted IS clause), but not <html lang="en">, which covers every page
  const english = el => { const g = el.closest('[lang]'); return !!g && g.tagName !== 'HTML' && g.getAttribute('lang') === 'en' }
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  while (w.nextNode()) {
    const n = w.currentNode, t = n.nodeValue.replace(/\\s+/g, ' ').trim()
    if (!t) continue
    const el = n.parentElement
    if (!el || el.closest(skip) || english(el)) continue
    out.push({ kind: 'text', t, tag: el.tagName.toLowerCase(), cls: (el.className && el.className.toString().slice(0, 40)) || '' })
  }
  for (const el of document.querySelectorAll('[aria-label],[placeholder],[title],img[alt]')) {
    if (el.closest(skip) || english(el)) continue
    for (const a of ['aria-label', 'placeholder', 'title', 'alt']) {
      const v = el.getAttribute(a)
      if (v && v.trim()) out.push({ kind: a, t: v.trim(), tag: el.tagName.toLowerCase(), cls: '' })
    }
  }
  return out
}"""

WORD = re.compile(r"[A-Za-z][A-Za-z'’\-]*")

def offenders(text: str):
    # set aside IS codes (IS 456:2000, IS 13920), grades (M25, Fe500, Fe 500D), numbers with units, URLs and e-mail addresses
    s = re.sub(r"\bIS\s?\d[\d:\-–/ ()A-Za-z]*", " ", text)
    s = re.sub(r"https?://\S+|www\.\S+|\S+@\S+", " ", s)
    s = re.sub(r"\b(M|Fe|CM|SP|BS|ASTM|ISO|EN)\s?\d+[A-Za-z]*\b", " ", s)
    bad = []
    for w in WORD.findall(s):
        base = w.strip("'’-").lower()
        if len(base) < 3: continue
        parts = re.split(r"[-’']", base)
        if all((p in ALLOW) or len(p) < 3 for p in parts): continue
        if base.rstrip('s') in ALLOW: continue
        bad.append(w)
    return bad

async def main():
    total = 0
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 844} if MOBILE else {'width': 1280, 'height': 900})
        await ctx.add_init_script("try{localStorage.setItem('ns-consent','denied')}catch(e){}")
        for route in ROUTES:
            page = await ctx.new_page()
            await page.goto(BASE + route, wait_until='networkidle', timeout=180000)
            await page.wait_for_timeout(1200)
            for sel in CLICK:
                for el in await page.query_selector_all(sel):
                    try: await el.click(timeout=1500)
                    except Exception: pass
                await page.wait_for_timeout(300)
            items = await page.evaluate(COLLECT)
            seen, left = set(), []
            for it in items:
                bad = offenders(it['t'])
                if bad and it['t'] not in seen:
                    seen.add(it['t']); left.append((it, bad))
            total += len(left)
            print(f"{route}: {len(left)} leftover")
            for it, bad in left[:int(os.environ.get('SHOW', '60'))]:
                print(f"   [{it['kind']}] {it['t'][:110]!r}   <- {', '.join(sorted(set(bad)))[:60]}")
            await page.close()
        await b.close()
    print(f"\nTOTAL leftover: {total}")
    sys.exit(1 if total else 0)

asyncio.run(main())
