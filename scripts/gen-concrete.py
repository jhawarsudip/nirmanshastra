#!/usr/bin/env python3
"""
Procedural concrete textures for NirmanShastra (no stock photos, so no licence to worry about).

Writes mean-grey, seamlessly tiling WebP files into public/v2/texture/. The CSS lays them over a token colour with
`background-blend-mode: overlay`, so one texture works on any palette (light, night, stage band).

  concrete-wet.webp   dark band texture: form-board seams, tie holes, bug holes, pour streaks, cold-joint lift lines, sheen
  concrete-dry.webp   light page texture: dust, pitting, faint board marks, efflorescence wisps (much quieter)

Re-roll with another seed:  python3 scripts/gen-concrete.py 7
Everything is imperfect on purpose. Real concrete is.
"""
import math
import os
import sys

import numpy as np
from PIL import Image

N = 1024
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'public', 'v2', 'texture')
PREVIEW = os.path.join(HERE, '..', '.next', 'ns-shots', 'tex')


def spectral(n, beta, rng, sx=1.0, sy=1.0):
    """Periodic noise with a 1/f^beta spectrum. A large sy makes features long along y (vertical streaks); a large sx makes them long along x."""
    fy = np.fft.fftfreq(n)[:, None] * sy * n
    fx = np.fft.fftfreq(n)[None, :] * sx * n
    f = np.sqrt(fx ** 2 + fy ** 2)
    f[0, 0] = 1
    amp = 1 / f ** (beta / 2)
    amp[0, 0] = 0
    a = np.real(np.fft.ifft2(np.fft.fft2(rng.standard_normal((n, n))) * amp))
    a -= a.mean()
    return a / a.std()


def blur(a, sigma):
    n = a.shape[0]
    f = np.fft.fftfreq(n)
    g = np.exp(-2 * (np.pi * sigma) ** 2 * (f[:, None] ** 2 + f[None, :] ** 2))
    return np.real(np.fft.ifft2(np.fft.fft2(a) * g))


def smooth1d(n, rng, sigma):
    a = rng.standard_normal(n)
    f = np.fft.fftfreq(n)
    a = np.real(np.fft.ifft(np.fft.fft(a) * np.exp(-2 * (np.pi * sigma) ** 2 * f ** 2)))
    a -= a.mean()
    return a / a.std()


def stamp(field, cx, cy, kern, amp):
    k = kern.shape[0]
    r = k // 2
    ys = (np.arange(k) - r + cy) % field.shape[0]
    xs = (np.arange(k) - r + cx) % field.shape[1]
    field[np.ix_(ys, xs)] += amp * kern


def hole_kernel(r):
    k = int(r * 4) | 1
    c = k // 2
    y, x = np.mgrid[0:k, 0:k]
    dx, dy = x - c, y - c
    core = np.exp(-((dx ** 2 + dy ** 2) / (r * r)) * 1.7)
    lip = np.exp(-(((dx - 0.9 * r) ** 2 + (dy - 0.9 * r) ** 2) / (0.85 * r) ** 2))
    return -core + 0.55 * np.clip(lip - 1.4 * core, 0, None)


def blob_kernel(r):
    k = int(r * 4) | 1
    c = k // 2
    y, x = np.mgrid[0:k, 0:k]
    return np.exp(-(((x - c) ** 2 + (y - c) ** 2) / (r * r)) * 1.3)


def boards(n, rng, width=256, seam=1.0, grain=0.02, tone=0.025):
    """Vertical form boards: seam grooves, per-board tone shift, fine wood-grain imprint, staggered end joints."""
    d = np.zeros((n, n))
    xs = np.arange(n)[None, :]
    nb = n // width
    g = spectral(n, 2.0, rng, sx=1.0, sy=10.0)
    for b in range(nb):
        x0 = b * width
        m = ((xs >= x0) & (xs < x0 + width)).astype(float)
        d += m * (rng.uniform(-tone, tone) + grain * g)
        dist = np.minimum(np.abs(xs - x0), n - np.abs(xs - x0))
        d += seam * (-0.11 * np.exp(-(dist / 1.5) ** 2) + 0.055 * np.exp(-((dist - 3.5) / 2.2) ** 2))
        # a staggered horizontal joint in this board
        yj = int(rng.integers(80, n - 80))
        ys = np.arange(n)[:, None]
        dy = np.minimum(np.abs(ys - yj), n - np.abs(ys - yj))
        d += m * seam * (-0.07 * np.exp(-(dy / 1.4) ** 2) + 0.03 * np.exp(-((dy - 3) / 2.0) ** 2))
    return d


def lift_lines(n, rng, ys, strength=1.0):
    """Cold joints between pours: a wavering dark line, a pale lip, and a damp stain beneath."""
    d = np.zeros((n, n))
    xs = np.arange(n)
    yy = np.arange(n)[:, None]
    for y0 in ys:
        wob = smooth1d(n, rng, 38) * 7 + smooth1d(n, rng, 8) * 1.6
        fade = np.clip(0.35 + 0.8 * smooth1d(n, rng, 50), 0.0, 1.0)
        dy = yy - (y0 + wob[None, :])
        dy = (dy + n / 2) % n - n / 2
        line = -0.07 * np.exp(-(dy / 2.0) ** 2) + 0.05 * np.exp(-((dy - 4.5) / 2.8) ** 2)
        stain = -0.075 * np.exp(-((dy - 30) / 28) ** 2) + 0.03 * np.exp(-((dy + 24) / 20) ** 2)
        d += strength * fade[None, :] * (line + stain * (0.6 + 0.4 * fade[None, :]))
    return d


def tie_holes(n, rng, pts, r=15, rust=0.05):
    """Form-tie cones: dark recess, pale lower lip, and a thin rust-stain trail running down."""
    d = np.zeros((n, n))
    ys, xs = np.mgrid[0:n, 0:n]
    for (cx, cy) in pts:
        cx += int(rng.integers(-4, 5))
        cy += int(rng.integers(-4, 5))
        dx = (xs - cx + n / 2) % n - n / 2
        dy = (ys - cy + n / 2) % n - n / 2
        rr = np.sqrt(dx ** 2 + dy ** 2)
        d += -0.46 * np.exp(-(rr / (r * 0.55)) ** 2) - 0.2 * np.exp(-((rr - r) / 3.2) ** 2) + 0.08 * np.exp(-((rr - r * 0.78) / 2.6) ** 2)
        d += 0.12 * np.exp(-(((dx - 3) ** 2 + (dy - r - 2) ** 2) / 45))
        trail = np.where(dy > 0, np.exp(-dy / (90 + 70 * rng.random())), 0)
        d += -rust * np.exp(-(dx / (3.5 + 2 * rng.random())) ** 2) * trail
    return d


def cracks(n, rng, count=3, amp=0.085):
    d = np.zeros((n, n))
    for _ in range(count):
        x, y = rng.uniform(0, n, 2)
        ang = rng.uniform(math.pi * 0.2, math.pi * 0.8)
        for _s in range(int(rng.integers(220, 420))):
            ang += rng.normal(0, 0.22)
            x = (x + math.cos(ang) * 1.6) % n
            y = (y + math.sin(ang) * 1.6) % n
            d[int(y), int(x)] += 1.0
    d = blur(d, 0.7)
    return -amp * d / d.max()


def sigmoid(x):
    return 1 / (1 + np.exp(-x))


def concrete(kind, seed):
    rng = np.random.default_rng(seed)
    wet = kind == 'wet'
    k = 1.0 if wet else 0.55  # how loudly the surface features speak (dry is quieter)

    # --- the body of the concrete: gentle colour drift, medium clouds, fine sand grain (kept modest so features read)
    mottle = spectral(N, 2.7, rng)
    cloud = spectral(N, 1.9, rng)
    fine = spectral(N, 1.1, rng)
    sand = spectral(N, 0.3, rng)
    L = 0.058 * mottle + 0.052 * cloud + 0.026 * fine + (0.04 if wet else 0.034) * sand

    # --- pour: rivulets where wet concrete ran down the form, plus bleed-water stains
    s1 = np.tanh(1.4 * spectral(N, 2.2, rng, sx=1.0, sy=7.0))
    s2 = np.tanh(1.3 * spectral(N, 1.4, rng, sx=1.0, sy=4.0))
    ridge = np.clip(np.abs(spectral(N, 1.2, rng, sx=1.0, sy=14.0)) - 1.5, 0, None)
    L += 0.04 * k * s1 + 0.022 * k * s2 - 0.03 * k * ridge
    bleed = sigmoid(3.2 * spectral(N, 2.4, rng, sx=1.0, sy=3.6) - 1.0)
    L += -0.05 * k * bleed

    # --- formwork and the marks it leaves: board seams, ply panel joints, lift lines, tie cones
    L += boards(N, rng, width=512, seam=1.05 * k, grain=0.006 * k + 0.001, tone=0.02 * k + 0.004)
    ys, = [np.arange(N)[:, None]]
    for yj in (0, 512):  # full-width ply panel joints
        dy = np.minimum(np.abs(ys - yj), N - np.abs(ys - yj))
        L += 1.0 * k * (-0.12 * np.exp(-(dy / 1.5) ** 2) + 0.055 * np.exp(-((dy - 3.5) / 2.0) ** 2))
    L += lift_lines(N, rng, [210, 585, 880] if wet else [330, 760], strength=1.15 * k)
    L += tie_holes(N, rng, [(128, 256), (640, 256), (384, 768), (896, 768)], r=21 if wet else 18, rust=0.10 * k)

    # --- air voids ("bug holes"): clustered where the mix was patchy, from pin-pricks up to thumbnail pits
    dens = sigmoid(1.5 * mottle + 0.8 * cloud - 0.1)
    holes = np.zeros((N, N))
    for _ in range(170 if wet else 140):
        for _try in range(40):
            x, y = int(rng.integers(0, N)), int(rng.integers(0, N))
            if rng.random() < dens[y, x]:
                break
        r = float(np.clip(rng.lognormal(math.log(3.4), 0.5), 1.5, 12.0))
        stamp(holes, x, y, hole_kernel(r), 0.55 * k + 0.1)
    L += holes

    # --- aggregate flecks, light and dark
    flecks = np.zeros((N, N))
    for _ in range(900):
        r = float(rng.uniform(0.9, 2.8))
        stamp(flecks, int(rng.integers(0, N)), int(rng.integers(0, N)), blob_kernel(r), rng.choice([-1, 1]) * rng.uniform(0.05, 0.12))
    L += (0.8 if wet else 0.6) * flecks

    L += cracks(N, rng, 3 if wet else 2, 0.11 * k + 0.02)

    if wet:
        # wet sheen: broad soft highlights where the surface still holds water, strongest along the rivulets
        sheen = np.clip(blur(spectral(N, 3.0, rng), 4) - 0.35, 0, None)
        sheen = sheen / (sheen.max() + 1e-6)
        L += 0.2 * sheen * (0.6 + 0.4 * s1)
    else:
        wisp = np.clip(spectral(N, 2.2, rng, sx=0.8, sy=3.3) - 0.8, 0, None)
        L += 0.09 * wisp / (wisp.max() + 1e-6)

    L = 0.5 + L
    # soft limit so no pixel reaches pure black or white (keeps text readable over the overlay)
    L = 0.5 + 0.5 * np.tanh((L - 0.5) * 1.5) / np.tanh(0.75)
    return np.clip(L, 0.04, 0.96)


def save(name, arr, quality):
    os.makedirs(OUT, exist_ok=True)
    img = Image.fromarray((arr * 255).astype(np.uint8)).convert('RGB')
    path = os.path.join(OUT, name)
    img.save(path, 'WEBP', quality=quality, method=6)
    os.makedirs(PREVIEW, exist_ok=True)
    img.save(os.path.join(PREVIEW, name.replace('.webp', '.preview.png')))
    print(f'{name}: mean {arr.mean():.3f} std {arr.std():.3f}  {os.path.getsize(path) / 1024:.0f} KB')


def _bez(pts):
    """Catmull-Rom through pts, as SVG cubic segments (smooth, organic, no kinks)."""
    d = ''
    for i in range(len(pts) - 1):
        p0 = pts[max(i - 1, 0)]
        p1, p2 = pts[i], pts[i + 1]
        p3 = pts[min(i + 2, len(pts) - 1)]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d += f' C{c1[0]:.1f},{c1[1]:.1f} {c2[0]:.1f},{c2[1]:.1f} {p2[0]:.1f},{p2[1]:.1f}'
    return d


def _boundary(rng, W, yb, lobes, sign):
    """Key points of a slumped-concrete edge. sign=+1 hangs down from yb (drip), sign=-1 rises up from yb (crest).
    Starts and ends exactly on yb so the strip tiles left to right without a seam."""
    pts = [(0.0, yb), (24.0, yb)]
    x = 24.0
    while x < W - 140:
        x += rng.uniform(26, 120)  # flat run
        pts.append((x, yb))
        tongue = rng.random() < 0.34
        w = rng.uniform(34, 56) if tongue else rng.uniform(90, 290)
        depth = rng.uniform(*lobes['tongue' if tongue else 'blob'])
        x0 = x
        shape = [(0.0, 0.0), (0.12, 0.5), (0.5, 1.0), (0.88, 0.55), (1.0, 0.0)] if not tongue else \
                [(0.0, 0.0), (0.16, 0.6), (0.5, 1.0), (0.84, 0.6), (1.0, 0.0)]
        for fx, fy in shape[1:]:
            pts.append((x0 + w * fx, yb + sign * depth * fy))
        x = x0 + w
    pts.append((x + 30, yb))
    pts.append((float(W), yb))
    return pts


def edge_svg(kind, seed, W=1440, H=80):
    rng = np.random.default_rng(seed)
    if kind == 'drip':
        yb = 17.0
        pts = _boundary(rng, W, yb, {'blob': (14, 40), 'tongue': (34, 62)}, +1)
        d = f'M0,0 V{yb}' + _bez(pts) + f' V0 Z'
    else:
        yb = 62.0
        pts = _boundary(rng, W, yb, {'blob': (8, 30), 'tongue': (14, 44)}, -1)
        d = f'M0,{H} V{yb}' + _bez(pts) + f' V{H} Z'
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" preserveAspectRatio="none">'
           f'<path d="{d}" fill="#000"/></svg>')
    path = os.path.join(OUT, f'edge-{kind}.svg')
    with open(path, 'w') as f:
        f.write(svg)
    print(f'edge-{kind}.svg: {os.path.getsize(path) / 1024:.1f} KB')


if __name__ == '__main__':
    seed = int(sys.argv[1]) if len(sys.argv) > 1 else 3
    save('concrete-wet.webp', concrete('wet', seed), 74)
    save('concrete-dry.webp', concrete('dry', seed + 100), 66)
    edge_svg('drip', seed + 7)
    edge_svg('crest', seed + 11)
