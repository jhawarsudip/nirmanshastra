"""
Mid-scroll check: with the page scrolled, are any lines of text partly covered by the header's drips?
Needs the site running and: pip install playwright numpy pillow.
  python3 scripts/check-text-scrolled.py "/,/faq,/tools/structopro" label [BASE_URL]
Since 29 Oct 2026 the drips are drawn back into the bar once the page scrolls (Header.tsx, pour.css), so every count must be 0.
"""
import asyncio, io, json, sys
import numpy as np
from PIL import Image
from playwright.async_api import async_playwright
BASE=sys.argv[3] if len(sys.argv)>3 else 'http://localhost:3000'
ROUTES=sys.argv[1].split(','); TAG=sys.argv[2]
VPS={'desktop':(1280,900),'mobile':(390,844)}
RED='''*{color:#e60000!important;-webkit-text-fill-color:#e60000!important;text-shadow:none!important;caret-color:#e60000!important}
nextjs-portal,[data-nextjs-toast],[role="dialog"][aria-label*="nalytics" i],.ns-toast{display:none!important}'''
COLLECT="""()=>{const out=[];const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
 while(w.nextNode()){const n=w.currentNode;const t=n.nodeValue.replace(/\\s+/g,' ').trim();if(!t)continue;const el=n.parentElement;if(!el)continue;
  if(el.closest('script,style,noscript,svg,.ns-sr,[aria-hidden="true"],header,.ns-header,nextjs-portal'))continue;
  if(!el.checkVisibility({opacityProperty:true,visibilityProperty:true}))continue;
  const r=document.createRange();r.selectNodeContents(n);
  for(const rc of r.getClientRects()){if(rc.width<6||rc.height<8)continue;if(rc.bottom<0||rc.top>innerHeight)continue;if(rc.left>innerWidth-2||rc.right<2)continue;out.push({x:rc.left,y:rc.top,w:rc.width,h:rc.height,t:t.slice(0,60)})}}
 return out}"""
def red_count(img,x,y,w,h):
    H,W=img.shape[:2];x0,y0=max(0,int(x)),max(0,int(y));x1,y1=min(W,int(x+w)+1),min(H,int(y+h)+1)
    if x1<=x0 or y1<=y0:return 0
    c=img[y0:y1,x0:x1];return int(((c[...,0]>200)&(c[...,1]<90)&(c[...,2]<90)).sum())
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for vpn,(w,h) in VPS.items():
            ctx=await b.new_context(viewport={'width':w,'height':h},reduced_motion='reduce'); page=await ctx.new_page()
            await page.route('**/api/**',lambda r:r.abort())
            for route in ROUTES:
                await page.goto(BASE+route,wait_until='domcontentloaded',timeout=120000); await page.wait_for_timeout(1200)
                H=await page.evaluate('document.documentElement.scrollHeight'); await page.add_style_tag(content=RED)
                tot=0; pos_bad=0; examples=[]; positions=list(range(150,min(H-h,9000),400))
                for y in positions:
                    await page.evaluate('y=>scrollTo(0,y)',y); await page.wait_for_timeout(450)
                    rects=await page.evaluate(COLLECT)
                    A=np.array(Image.open(io.BytesIO(await page.screenshot(animations='disabled'))).convert('RGB'))
                    st=await page.add_style_tag(content='.ns-pour--lip{visibility:hidden!important}'); await page.wait_for_timeout(120)
                    B=np.array(Image.open(io.BytesIO(await page.screenshot(animations='disabled'))).convert('RGB'))
                    await page.evaluate('e=>e.remove()',st)
                    n=0
                    for r in rects:
                        if r['y']>260: continue
                        a,bb=red_count(A,r['x'],r['y'],r['w'],r['h']),red_count(B,r['x'],r['y'],r['w'],r['h'])
                        if bb>=12 and (bb-a)/bb>=0.10: n+=1; examples.append((y,r['t'],round((bb-a)/bb,2)))
                    tot+=n; pos_bad+= 1 if n else 0
                print(f"{vpn:7} {route:40} stops tested={len(positions):3}  stops with covered text={pos_bad:3}  lines covered in total={tot:3}  e.g. {examples[:2]}",flush=True)
            await ctx.close()
        await b.close()
asyncio.run(main())
