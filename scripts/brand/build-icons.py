#!/usr/bin/env python3
"""
Builds every raster that carries the NirmanShastra mark from the supplied logo
(public/brand/real/mark-*-fine-640.webp, transparent, no background).

    python3 scripts/brand/build-icons.py

Writes:
  public/icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png
  public/favicon-32.png, app/favicon.ico
  public/brand/real/mark-dark-256.png   (transparent, for the PDF header band)
  public/og-image.png                   (1200 x 630 link preview)

Tile = warm black with the cream colourway of the mark. The OG card = limewash
with the dark-ink colourway. Fonts for the OG card come from public/fonts.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
REAL = ROOT / 'public' / 'brand' / 'real'
PUB = ROOT / 'public'
FONTS = PUB / 'fonts'

TILE = (28, 27, 25)          # warm black
LIME = (243, 238, 226)       # --ns-bg
INK = (42, 30, 22)           # --ns-ink
LATERITE = (181, 80, 45)
MUTED = (91, 84, 75)

mark_dark = Image.open(REAL / 'mark-dark-fine-640.webp').convert('RGBA')    # cream ring + gold, for dark grounds
mark_light = Image.open(REAL / 'mark-light-fine-640.webp').convert('RGBA')  # ink ring + gold, for light grounds


def fit(mark: Image.Image, width: int) -> Image.Image:
    h = round(width * mark.height / mark.width)
    m = mark.resize((width, h), Image.LANCZOS)
    if width <= 64:
        m = m.filter(ImageFilter.UnsharpMask(radius=0.8, percent=60, threshold=0))
    return m


def tile(size: int, mark_frac: float, radius_frac: float, alpha: bool = True) -> Image.Image:
    """Square tile with the cream mark centred. radius_frac 0 = full bleed (maskable / apple-touch)."""
    ss = 4
    big = size * ss
    if radius_frac > 0:
        mask = Image.new('L', (big, big), 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, big - 1, big - 1), radius=int(big * radius_frac), fill=255)
        mask = mask.resize((size, size), Image.LANCZOS)
    else:
        mask = Image.new('L', (size, size), 255)
    base = Image.new('RGBA', (size, size), TILE + (255,))
    m = fit(mark_dark, round(size * mark_frac))
    base.alpha_composite(m, ((size - m.width) // 2, (size - m.height) // 2))
    base.putalpha(mask)
    return base if alpha else base.convert('RGB')


# App icons
tile(512, 0.78, 0.225).save(PUB / 'icon-512.png', optimize=True)
tile(192, 0.78, 0.225).save(PUB / 'icon-192.png', optimize=True)
tile(512, 0.62, 0).save(PUB / 'icon-maskable-512.png', optimize=True)         # inside the 80 percent safe circle
tile(180, 0.76, 0, alpha=False).save(PUB / 'apple-touch-icon.png', optimize=True)

# Favicons: bigger mark, smaller margin, because a tab is 16 px
fav = {s: tile(s, 0.90, 0.20) for s in (16, 32, 48)}
fav[32].save(PUB / 'favicon-32.png', optimize=True)
fav[48].save(ROOT / 'app' / 'favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48)], append_images=[fav[16], fav[32]])

# PDF header band (charcoal): the cream mark on its own, no tile
fit(mark_dark, 256).save(REAL / 'mark-dark-256.png', optimize=True)

# Open Graph card, limewash ground
W, H = 1200, 630
og = Image.new('RGB', (W, H), LIME)
d = ImageDraw.Draw(og)
d.rectangle((24, 24, W - 25, H - 25), outline=(216, 207, 189), width=2)
m = fit(mark_light, 330)
og.paste(m, (110, (H - m.height) // 2 - 6), m)
def font_fit(name: str, text: str, size: int, max_w: int) -> ImageFont.FreeTypeFont:
    """Largest size <= `size` at which `text` fits in max_w pixels."""
    while size > 12:
        f = ImageFont.truetype(str(FONTS / name), size)
        if d.textlength(text, font=f) <= max_w:
            return f
        size -= 1
    return ImageFont.truetype(str(FONTS / name), 12)


x, max_w = 500, 640
T1, T2 = 'NirmanShastra', 'Material quantities for Indian homes'
B1, B2 = 'Worked out to the Indian Standards: structure,', 'masonry, electrical, plumbing and interior.'
f_title = font_fit('IBMPlexSerif-Bold.ttf', T1, 92, max_w)
f_sub = font_fit('IBMPlexSans-Medium.ttf', T2, 40, max_w)
f_body = font_fit('IBMPlexSans-Regular.ttf', B1, 27, max_w)
f_mono = ImageFont.truetype(str(FONTS / 'IBMPlexMono-Regular.ttf'), 28)
d.text((x, 186), T1, font=f_title, fill=INK)
d.text((x, 292), T2, font=f_sub, fill=INK)
d.text((x, 354), B1, font=f_body, fill=MUTED)
d.text((x, 392), B2, font=f_body, fill=MUTED)
d.rectangle((x, 450, x + 90, 454), fill=LATERITE)
d.text((x, 478), 'nirmanshastra.in', font=f_mono, fill=INK)
og.save(PUB / 'og-image.png', optimize=True)
print('built')
