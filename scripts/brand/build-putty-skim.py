#!/usr/bin/env python3
"""
Builds public/v2/texture/putty-skim.webp: ALTERNATIVE to the brushed putty (not used by the site): white wall putty, skim-coated (the light theme: header bar, the poured edges, the
sand render and limewash bands).

Real putty does not show brush strokes. It is a smooth, matte, slightly cloudy surface: broad, very shallow undulations
where the trowel passed, a fine sandy tooth, and a few pin-holes where air escaped. That is what this draws, as a
seamless 1024 x 384 tile of transparent dark / white marks that sits on top of any putty colour:

  - soft clouds (the skim coat is never perfectly flat),
  - wide, shallow, curved trowel sweeps with feathered edges (no ridges, no hairlines),
  - fine tooth,
  - a few pin-holes.

Lighting comes from that height map, from above. Seeded and deterministic. Needs numpy and Pillow.
"""
import os

import numpy as np
from PIL import Image

NW, NH = 1024, 384
OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'v2', 'texture', 'putty-skim.webp')
rng = np.random.default_rng(20261027)


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def filtered(sx, sy):
    """periodic noise stretched sx wide and sy tall"""
    w = rng.standard_normal((NH, NW))
    fx = np.fft.fftfreq(NW)[None, :]
    fy = np.fft.fftfreq(NH)[:, None]
    g = np.exp(-((fx * sx) ** 2 + (fy * sy) ** 2) * 0.5 * (2 * np.pi) ** 2)
    r = np.real(np.fft.ifft2(np.fft.fft2(w) * g))
    r -= r.mean()
    return r / (np.abs(r).max() + 1e-9)


X, Y = np.meshgrid(np.arange(NW, dtype=np.float64), np.arange(NH, dtype=np.float64))

# clouds + a little tooth
h = 0.80 * filtered(70, 46) + 0.45 * filtered(26, 20) + 0.18 * filtered(9, 8) + 0.07 * filtered(1.5, 1.5)

# wide, shallow, curved trowel sweeps: arcs of a big circle, soft on every side
for _ in range(26):
    cx, cy = rng.uniform(0, NW), rng.uniform(0, NH)
    rad = rng.uniform(140, 520)
    thick = rng.uniform(34, 96)
    a0 = rng.uniform(0, 2 * np.pi)
    span = rng.uniform(0.35, 0.95)
    amp = rng.uniform(0.18, 0.42) * rng.choice([-1, 1])
    for oy in (-NH, 0, NH):
        for ox in (-NW, 0, NW):
            dx, dy = X - cx - ox, Y - cy - oy
            d = np.hypot(dx, dy)
            ring = smoothstep(thick / 2, 0, np.abs(d - rad))
            ang = np.arctan2(dy, dx)
            da = np.abs((ang - a0 + np.pi) % (2 * np.pi) - np.pi)
            arc = smoothstep(span, span * 0.35, da)
            m = ring * arc
            if m.max() < 1e-3:
                continue
            h += amp * m

# light from above, a touch from the left; the response is deliberately gentle
gy = (np.roll(h, -1, axis=0) - np.roll(h, 1, axis=0)) / 2
gx = (np.roll(h, -1, axis=1) - np.roll(h, 1, axis=1)) / 2
shade = (gy + 0.35 * gx) * 7.0           # positive: faces down (shaded), negative: faces up (lit)
dark = np.clip(shade, 0, 1) ** 1.15 * 0.30
light = np.clip(-shade, 0, 1) ** 1.1 * 0.9

# pin-holes
pores = np.zeros((NH, NW))
for _ in range(46):
    x, y = int(rng.integers(0, NW)), int(rng.integers(0, NH))
    pores[y, x] += 1.0
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        pores[(y + dy) % NH, (x + dx) % NW] += 0.35
dark = np.clip(dark + np.clip(pores, 0, 1) * 0.20, 0, 0.5)

use_dark = dark >= light
rgb = np.zeros((NH, NW, 3), dtype=np.float32)
rgb[use_dark] = (132, 112, 90)           # warm, slightly brown: putty in its own shade
rgb[~use_dark] = (255, 255, 255)
a = np.where(use_dark, dark, light)
img = np.dstack([rgb, a * 255]).clip(0, 255).astype(np.uint8)
Image.fromarray(img, 'RGBA').save(OUT, 'WEBP', quality=50, alpha_quality=45, method=6)
print(os.path.basename(OUT), os.path.getsize(OUT) // 1024, 'KB')
