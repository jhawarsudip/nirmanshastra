"""
Does ordinary text start BELOW the drips of the join above it?   (SJ, 29 Oct 2026: "the text should be a little below the dripping point".)

For every poured join on the home page this finds the lowest pixel the drips (and their soft shadow) paint, at their slowest-creep maximum,
and the top of the first line of text under it, and fails when the gap is smaller than MIN_GAP, or when any line of text touches a drip at all.
The yellow tape under the hero (.ns-tape) is meant to run behind the drips and is not counted. The header's own drips are not tested here.

Needs the site running (npm run dev, or a build on localhost) and: pip install playwright numpy pillow.
  python3 scripts/check-drip-clearance.py [BASE_URL]
  SIZES="1440x900:1,390x844:0"  width x height : 1 = motion on (the pinned Eight steps), 0 = reduced motion   (default: the matrix below)
  MIN_GAP=16                    pixels between the lowest drip and the top of the first line
  ROUTE=/hi                     the Hindi home page (longer lines, so the pinned Eight steps sits differently)
The result must be "all clear". Run it after changing pour.css, Pour.tsx, a section's top padding or the order of the home page sections.
"""
import asyncio, io, os, sys
import numpy as np
from PIL import Image
from playwright.async_api import async_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:3000'
MIN_GAP = int(os.environ.get('MIN_GAP', '16'))
ROUTE = os.environ.get('ROUTE', '/')          # '/hi' for the Hindi home page
SIZES = [(s.split(':')[0], s.split(':')[1] == '1') for s in os.environ.get(
    'SIZES', '1920x1080:1,1440x900:1,1440x900:0,1366x650:1,1280x720:1,1024x768:1,768x1024:1,390x844:1,390x844:0').split(',')]

HIDE = ('nextjs-portal,[data-nextjs-toast],[role="dialog"][aria-label*="nalytics" i],.ns-toast{display:none!important}'
        '.ns-pour--lip{visibility:hidden!important}.ns-pour{animation:none!important;transform:scaleY(1.05)!important}')
COLLECT = """()=>{const out=[];const sx=scrollX,sy=scrollY,vw=innerWidth;const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
 while(w.nextNode()){const n=w.currentNode;const t=n.nodeValue.replace(/\\s+/g,' ').trim();if(!t)continue;const el=n.parentElement;if(!el)continue;
  if(el.closest('script,style,noscript,svg,.ns-sr,nextjs-portal,.ns-pour,.ns-tape,header,.ns-header'))continue;
  if(!el.checkVisibility({opacityProperty:true,visibilityProperty:true}))continue;
  const r=document.createRange();r.selectNodeContents(n);
  const clipped=(rc)=>{for(let a=el;a&&a!==document.body;a=a.parentElement){const c=getComputedStyle(a);if(c.overflowX==='visible'&&c.overflowY==='visible')continue;const ar=a.getBoundingClientRect();
     if((c.overflowY!=='visible'&&(rc.bottom<=ar.top+1||rc.top>=ar.bottom-1))||(c.overflowX!=='visible'&&(rc.right<=ar.left+1||rc.left>=ar.right-1)))return true}return false};
  for(const rc of r.getClientRects()){if(rc.width<6||rc.height<8)continue;if(clipped(rc))continue;const x=rc.left+sx;if(x>vw-2||x+rc.width<2)continue;
   out.push({x,y:rc.top+sy,w:rc.width,h:rc.height,t:t.slice(0,48)})}}
 return {lines:out,pours:[...document.querySelectorAll('.ns-pour:not(.ns-pour--lip)')].map(e=>{const r=e.getBoundingClientRect();const cs=getComputedStyle(e);
   const pj=parseFloat(cs.getPropertyValue('--pour-j'))||r.height*.118;return {top:r.top+sy,h:r.height,pj,sec:(e.parentElement.id||e.parentElement.className).toString().slice(0,34)}})}}"""
arr = lambda b: np.array(Image.open(io.BytesIO(b)).convert('RGB'))

async def main():
    bad = 0
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for size, motion in SIZES:
            W, VH = (int(v) for v in size.split('x'))
            ctx = await b.new_context(viewport={'width': W, 'height': VH}, reduced_motion='no-preference' if motion else 'reduce')
            page = await ctx.new_page(); await page.route('**/api/**', lambda r: r.abort())
            await page.goto(BASE + ROUTE, wait_until='domcontentloaded', timeout=120000); await page.wait_for_timeout(1200)
            H = await page.evaluate('document.documentElement.scrollHeight'); y = 0
            while y < H:
                await page.evaluate('y=>scrollTo(0,y)', y); await page.wait_for_timeout(70); y += 650
                H = max(H, await page.evaluate('document.documentElement.scrollHeight'))
            await page.evaluate('scrollTo(0,0)'); await page.add_style_tag(content=HIDE)
            last, same = -1, 0
            for _ in range(40):                                   # the page grows while its lazy parts load: wait until it stops
                hh = await page.evaluate('document.documentElement.scrollHeight'); same = same + 1 if hh == last else 0; last = hh
                if same >= 4: break
                await page.wait_for_timeout(500)
            n = len((await page.evaluate(COLLECT))['pours'])
            print(f'--- {size} {"motion" if motion else "reduced motion"}', flush=True)
            for i in range(n):
                d = await page.evaluate(COLLECT); lines = sorted(d['lines'], key=lambda r: r['y']); pr = d['pours'][i]
                if pr['h'] < 1: continue                          # the two phone-only carriers are hidden on a wide screen
                y0 = max(0, int(pr['top']) - 6); y1 = int(pr['top'] + pr['h'] * 1.12) + 40
                clip = {'x': 0, 'y': y0, 'width': W, 'height': y1 - y0}
                A = arr(await page.screenshot(full_page=True, clip=clip, animations='disabled'))
                await page.evaluate("()=>{let s=document.getElementById('zz-hide');if(!s){s=document.createElement('style');s.id='zz-hide';s.textContent='.ns-pour{visibility:hidden!important}';document.head.appendChild(s)}s.disabled=false}")
                await page.wait_for_timeout(120)
                B = arr(await page.screenshot(full_page=True, clip=clip, animations='disabled'))
                await page.evaluate("()=>{document.getElementById('zz-hide').disabled=true}"); await page.wait_for_timeout(120)
                A3 = arr(await page.screenshot(full_page=True, clip=clip, animations='disabled'))
                # a drip pixel is one that is the same in both shots with the drips on and different with them off; anything that moves on its own
                # (a script-driven animation) differs between the two shots with the drips on, so it is not counted
                d = lambda x, y: np.abs(x.astype(int) - y.astype(int)).sum(axis=2) > 24
                diff = d(A, B) & d(A3, B) & ~d(A, A3)
                rows = np.where(diff.any(axis=1))[0]
                boundary = pr['top'] + pr['pj']
                low = (y0 + int(rows.max())) if len(rows) else None
                if low is None or low - boundary <= 0:
                    print(f"  {pr['sec']:<22} no drip is visible here"); continue
                touch = []
                for ln in lines:
                    ya, yb = int(ln['y']) - y0, int(ln['y'] + ln['h']) - y0
                    if yb < 0 or ya >= diff.shape[0]: continue
                    xa, xb = max(0, int(ln['x'])), min(W, int(ln['x'] + ln['w']))
                    sub = diff[max(0, ya):yb, xa:xb]
                    if sub.size and sub.sum() >= 20 and sub.sum() / sub.size >= .02: touch.append(ln['t'])
                below = [ln for ln in lines if ln['y'] >= pr['top'] - 2 and ln['y'] < pr['top'] + pr['h'] * 3]
                ft = below[0] if below else None
                gap = None if ft is None else round(ft['y'] - low)
                ok = not touch and (gap is None or gap >= MIN_GAP)
                bad += 0 if ok else 1
                print(f"  {'ok  ' if ok else 'FAIL'} {pr['sec']:<22} lowest drip {round(low - boundary):>4}px below the join, first line {('-' if ft is None else round(ft['y'] - boundary)):>4}px, gap {gap}px"
                      + (f'  TOUCHING: {touch[:3]}' if touch else '') + ('' if ok else f"  first line: {ft['t']!r}" if ft else ''), flush=True)
            await ctx.close()
        await b.close()
    print('\nall clear' if not bad else f'\n{bad} join(s) have text on, or too close under, a drip')
    sys.exit(1 if bad else 0)

asyncio.run(main())
