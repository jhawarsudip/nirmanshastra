#!/usr/bin/env python3
"""
Builds public/v2/texture/slurry.webp: wet concrete that has just been poured (the dark theme: header bar, poured edges
and the dark bands). The older concrete-wet.webp is cast concrete that has set (pitted, dry); this is the opposite:

  - runs and streaks that follow the direction of the flow (vertical),
  - damp patches: broad, darker, uneven (wet concrete is darker than dry),
  - a fine sandy grain,
  - air bubbles that rose to the surface and are still shining.

A seamless 1024 x 512 greyscale tile laid on the page colour with `background-blend-mode: overlay` (50 % grey changes
nothing). Seeded and deterministic. Needs numpy and Pillow.
"""
import os

import numpy as np
from PIL import Image

NW, NH = 1024, 512
OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'v2', 'texture', 'slurry.webp')
rng = np.random.default_rng(20261026)


def filtered(sx, sy):
    w = rng.standard_normal((NH, NW))
    fx = np.fft.fftfreq(NW)[None, :]
    fy = np.fft.fftfreq(NH)[:, None]
    g = np.exp(-((fx * sx) ** 2 + (fy * sy) ** 2) * 0.5 * (2 * np.pi) ** 2)
    r = np.real(np.fft.ifft2(np.fft.fft2(w) * g))
    r -= r.mean()
    return r / (np.abs(r).max() + 1e-9)


flow = 0.55 * filtered(1.8, 95) + 0.35 * filtered(5, 150) + 0.25 * filtered(0.9, 40)
damp = filtered(46, 70)
damp = np.clip(damp, -1, 1)
patch = -np.clip(damp, 0, 1) ** 1.2          # darker where it is wetter
grain = filtered(1.0, 1.0)
grain2 = filtered(2.6, 2.6)

sheen = filtered(20, 48)                                       # glossy reflections: soft, tall, uneven
sheen = np.clip(sheen * 1.6, 0, 1) ** 1.6
g = 0.5 + 0.10 * flow + 0.20 * patch + 0.045 * grain + 0.04 * grain2 + 0.03 * damp + 0.20 * sheen

# air bubbles: a dark dimple with a bright rim on the side facing the light
yy, xx = np.mgrid[0:NH, 0:NW].astype(np.float64)
for _ in range(34):
    cx, cy, r = rng.uniform(0, NW), rng.uniform(0, NH), rng.uniform(1.8, 5.2)
    for oy in (-NH, 0, NH):
        for ox in (-NW, 0, NW):
            dx, dy = xx - cx - ox, yy - cy - oy
            if abs(ox) + abs(oy) and (np.abs(dx).min() > r * 3 and np.abs(dy).min() > r * 3):
                continue
            d = np.hypot(dx, dy)
            sel = d < r * 3
            if not sel.any():
                continue
            dimple = np.exp(-((d / r) ** 2) * 1.6)
            rim = np.exp(-(((d - r * 1.05) / (r * 0.55)) ** 2)) * np.clip((-dx - dy) / (d + 1e-6) * -1, 0, 1)
            g = g - 0.28 * dimple + 0.30 * rim * (d < r * 2.4)

g = np.clip(g, 0.08, 0.95)
img = Image.fromarray((g * 255 + 0.5).astype(np.uint8), 'L')
img.save(OUT, 'WEBP', quality=72, method=6)
print(os.path.basename(OUT), os.path.getsize(OUT) // 1024, 'KB')
