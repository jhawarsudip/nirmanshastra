"""
Is any text hidden by the poured edges (drips) or the band masks?   (SJ, 29 Oct 2026: no text may be blocked, on any page.)

Needs the site running (npm run dev, or a build on localhost) and: pip install playwright numpy pillow.
  python3 scripts/check-text-at-rest.py OUT_DIR ROUTES.json light,dark desktop,mobile [BASE_URL]
ROUTES.json is a list of paths, e.g. ["/", "/faq", "/tools/structopro"]. Set CREEP=1 to stretch every poured edge to its
slowest-creep maximum (5% longer, pour.css) so a drip that only touches text for a moment is caught too.
"""
import asyncio, io, json, os, sys, time
import numpy as np
from PIL import Image
from playwright.async_api import async_playwright

BASE = sys.argv[5] if len(sys.argv) > 5 else 'http://localhost:3000'
OUT = sys.argv[1]
ROUTES = json.load(open(sys.argv[2]))
VPS = {'desktop': (1280, 900), 'mobile': (390, 844)}
THEMES = sys.argv[3].split(',')
VPSEL = sys.argv[4].split(',')

RED = """*{color:#e60000!important;-webkit-text-fill-color:#e60000!important;text-shadow:none!important;caret-color:#e60000!important}
nextjs-portal,[data-nextjs-toast],[role="dialog"][aria-label*="nalytics" i],.ns-toast{display:none!important}"""
NOPOUR = ".ns-pour{visibility:hidden!important}"
NOMASK = ".ns-stage--drip,.ns-stage--crest,[class*='ns-stage']{-webkit-mask:none!important;mask:none!important}"

COLLECT = """() => {
  const out = []; const sx = scrollX, sy = scrollY, vw = innerWidth;
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) {
    const n = w.currentNode; const t = n.nodeValue.replace(/\\s+/g, ' ').trim(); if (!t) continue;
    const el = n.parentElement; if (!el) continue;
    if (el.closest('script,style,noscript,svg,.ns-sr,[aria-hidden="true"],nextjs-portal')) continue;
    if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true, contentVisibilityAuto: true })) continue;
    const r = document.createRange(); r.selectNodeContents(n);
    for (const rc of r.getClientRects()) {
      if (rc.width < 6 || rc.height < 8) continue;
      const x = rc.left + sx; if (x > vw - 2 || x + rc.width < 2) continue;
      out.push({ x, y: rc.top + sy, w: rc.width, h: rc.height, t: t.slice(0, 70), hdr: !!el.closest('header,.ns-header') });
    }
  }
  return out;
}"""

def red_count(img, x, y, w, h):
    H, W = img.shape[:2]
    x0, y0 = max(0, int(x)), max(0, int(y)); x1, y1 = min(W, int(x + w) + 1), min(H, int(y + h) + 1)
    if x1 <= x0 or y1 <= y0: return 0
    c = img[y0:y1, x0:x1]
    return int(((c[..., 0] > 200) & (c[..., 1] < 90) & (c[..., 2] < 90)).sum())

async def shot(page, height):
    parts = []
    y = 0
    while y < height:
        h = min(6000, height - y)
        b = await page.screenshot(full_page=True, clip={'x': 0, 'y': y, 'width': page.viewport_size['width'], 'height': h}, animations='disabled')
        parts.append(np.array(Image.open(io.BytesIO(b)).convert('RGB')))
        y += h
    return np.concatenate(parts, axis=0)

async def main():
    import os
    rf = f"{OUT}/results-{'-'.join(THEMES)}-{'-'.join(VPSEL)}.json"
    results = [r for r in (json.load(open(rf)) if os.path.exists(rf) else []) if 'error' not in r]
    done = {(r['route'], r['vp'], r['theme']) for r in results}
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for vpn in VPSEL:
            vw, vh = VPS[vpn]
            ctx = await b.new_context(viewport={'width': vw, 'height': vh}, reduced_motion='reduce', device_scale_factor=1)
            page = await ctx.new_page()
            await page.route('**/api/**', lambda r: r.abort())
            for theme in THEMES:
                for route in ROUTES:
                    if (route, vpn, theme) in done: continue
                    t0 = time.time()
                    try:
                        await page.goto(BASE + route, wait_until='domcontentloaded', timeout=120000)
                        await page.wait_for_timeout(900)
                        await page.evaluate("t => document.documentElement.setAttribute('data-ns-theme', t)", theme)
                        H = await page.evaluate('document.documentElement.scrollHeight')
                        y = 0
                        while y < H:
                            await page.evaluate('y => window.scrollTo(0, y)', y); await page.wait_for_timeout(70); y += 650
                            H = max(H, await page.evaluate('document.documentElement.scrollHeight'))
                        await page.evaluate('window.scrollTo(0,0)'); await page.wait_for_timeout(500)
                        await page.add_style_tag(content=RED)
                        if os.environ.get('CREEP'): await page.add_style_tag(content='.ns-pour:not(.ns-pour--lip){transform:scaleY(1.05)!important;transform-origin:50% 0!important}')
                        await page.wait_for_timeout(250)
                        H = await page.evaluate('document.documentElement.scrollHeight')
                        rects = await page.evaluate(COLLECT)
                        A = await shot(page, H)
                        h1 = await page.add_style_tag(content=NOPOUR); await page.wait_for_timeout(150)
                        B = await shot(page, H)
                        h2 = await page.add_style_tag(content=NOMASK); await page.wait_for_timeout(150)
                        C = await shot(page, H)
                        bad = []
                        for r in rects:
                            a, bb, cc = (red_count(M, r['x'], r['y'], r['w'], r['h']) for M in (A, B, C))
                            if bb >= 12 and (bb - a) / bb >= 0.10:
                                bad.append({'by': 'poured edge', 'lost': round((bb - a) / bb, 2), **r})
                            elif cc >= 12 and (cc - a) / cc >= 0.10:
                                bad.append({'by': 'band mask', 'lost': round((cc - a) / cc, 2), **r})
                        results.append({'route': route, 'vp': vpn, 'theme': theme, 'lines': len(rects), 'height': H, 'bad': bad, 'secs': round(time.time() - t0, 1)})
                        print(f"{vpn:7} {theme:5} {route:48} lines={len(rects):4} bad={len(bad)}", flush=True)
                        if bad:
                            tag = f"{vpn}-{theme}-{route.strip('/').replace('/', '_') or 'home'}"
                            Image.fromarray(A).save(f"{OUT}/{tag}-A.png")
                    except Exception as e:
                        results.append({'route': route, 'vp': vpn, 'theme': theme, 'error': str(e)[:200]})
                        print(f"{vpn:7} {theme:5} {route:48} ERROR {str(e)[:100]}", flush=True)
                    json.dump(results, open(rf, 'w'))
            await ctx.close()
        await b.close()
asyncio.run(main())
