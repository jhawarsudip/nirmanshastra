#!/usr/bin/env python3
"""
Builds the "poured" edges that hang under the header and between page sections (components/v2/Pour.tsx).

Every join gets its own tile, so no two joins look alike. A tile is a WebP that repeats sideways (the left and right
ends meet exactly) and carries two things:

  alpha  the shape of the poured edge (soft, 1 px wide antialiasing; melts into its own section along the top)
  RGB    grey "lighting" for that shape: 50 % grey = no change, darker = shaded, lighter = wet glint. The page lays it
         over the material with `background-blend-mode: hard-light`, so the same tile works as wet concrete at night,
         white putty by day and sand render in between.

How the shape is made: the edge is a signed-distance field. A wavy / lobed / scalloped / ragged edge line (one style
per join) is the body; every run (drip) is a chain of discs with a thin neck, a flare where it leaves the body and a
round bead at its tip, merged into the body with a smooth minimum so the joins are curved (a meniscus) instead of
pasted-on. Runs start where the edge sags lowest, because that is where real material gathers. The thickness of the
material is a rounded profile of the depth under the surface, plus a bead along the free edge; the lighting comes from
that height map (diffuse + a tight and a broad specular + a little sky reflection).

Seeded, so re-running gives the same files.   Needs numpy and Pillow.
Run:  python3 scripts/brand/build-pour-edges.py > /tmp/pour.log
"""
import math
import os
import random

import numpy as np
from PIL import Image

OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'v2', 'texture')
W = 1800

# light comes from the upper left and a little in front
_L = np.array([-0.26, -0.86, 0.50])
_L = _L / np.linalg.norm(_L)
_HALF = _L + np.array([0, 0, 1.0])
_HALF = _HALF / np.linalg.norm(_HALF)


# ---------------------------------------------------------------------------------------------------------- helpers
def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def smin(a, b, k):
    """polynomial smooth minimum: a union with a rounded inside corner of size k"""
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0, 1)
    return b * (1 - h) + a * h - k * h * (1 - h)


def pnoise(rnd, kmin, kmax, alpha=1.0):
    """1-D noise over the tile width that wraps exactly (whole cycles only); roughly -1..1"""
    x = np.arange(W) * 2 * np.pi / W
    out = np.zeros(W)
    for k in range(kmin, kmax + 1):
        out += (k ** -alpha) * rnd.uniform(0.3, 1.0) * np.sin(k * x + rnd.uniform(0, 2 * np.pi))
    m = np.abs(out).max()
    return out / m if m > 0 else out


def blur_x(a, sigma):
    """wrap-around gaussian blur along x (a is 1-D or 2-D, last axis = x)"""
    n = int(sigma * 3)
    k = np.exp(-0.5 * (np.arange(-n, n + 1) / sigma) ** 2)
    k /= k.sum()
    out = np.zeros_like(a)
    for i, w in zip(range(-n, n + 1), k):
        out += w * np.roll(a, i, axis=-1)
    return out


def blur_y(a, sigma):
    n = int(sigma * 3)
    k = np.exp(-0.5 * (np.arange(-n, n + 1) / sigma) ** 2)
    k /= k.sum()
    out = np.zeros_like(a)
    for i, w in zip(range(-n, n + 1), k):
        out += w * np.roll(a, i, axis=0)
    return out


def lobes(rnd, n, amp, s0, s1, lo=0.45):
    xs = np.arange(W)
    y = np.zeros(W)
    for _ in range(n):
        cx, d, sg = rnd.uniform(0, W), rnd.uniform(lo, 1.0) * amp, rnd.uniform(s0, s1)
        for off in (-W, 0, W):
            y += d * np.exp(-((xs - cx - off) ** 2) / (2 * sg * sg))
    return y


def waves(rnd, n, kmin, kmax, amp):
    xs = np.arange(W) * 2 * np.pi / W
    y = np.zeros(W)
    for _ in range(n):
        y += rnd.uniform(0.4, 1.0) * amp / math.sqrt(n) * np.sin(rnd.randint(kmin, kmax) * xs + rnd.uniform(0, 6.2832))
    return y


# ----------------------------------------------------------------------------------------------- edge line per style
def edge_line(style, rnd, base):
    """y of the free edge for every x (before runs are added)"""
    xs = np.arange(W)
    s = style['edge']
    if s == 'slump':      # heavy, uneven lobes that have slumped under their own weight
        y = lobes(rnd, style.get('n', 9), style.get('amp', 30), 36, 92) + waves(rnd, 3, 3, 11, 9) + 1.4 * pnoise(rnd, 40, 140, 1.0)
    elif s == 'blob':     # a few big round sags
        y = lobes(rnd, style.get('n', 6), style.get('amp', 46), 50, 118) + waves(rnd, 2, 4, 9, 6) + lobes(rnd, 10, 8, 14, 30)
    elif s == 'ripple':   # long smooth swells with a fine ripple riding on them
        y = waves(rnd, 5, 4, 16, 16) + lobes(rnd, 3, 16, 120, 220) + 1.8 * pnoise(rnd, 60, 220, 0.9)
    elif s == 'scallop':  # overlapping trowel swipes: each one a shallow arc, meeting its neighbour in a notch
        widths, tot = [], 0.0
        while tot < W:
            w = rnd.uniform(style.get('wmin', 80), style.get('wmax', 210))
            widths.append(w)
            tot += w
        sc = W / tot
        y = np.zeros(W)
        x0 = 0.0
        for w in widths:
            w *= sc
            h = rnd.uniform(style.get('hmin', 10), style.get('hmax', 30))
            tilt = rnd.uniform(-0.3, 0.3) * h
            m = (xs >= x0) & (xs < x0 + w)
            u = np.clip((xs - x0) / w, 0, 1)
            y[m] = (h * np.power(np.clip(1 - (2 * u - 1) ** 2, 0, 1), 0.6) + tilt * (2 * u - 1))[m]
            x0 += w
        y = blur_x(y, 2.2) + waves(rnd, 2, 3, 8, 5)
    elif s == 'ragged':   # crumbly, torn: fractal noise with small chips knocked out
        y = 15 * pnoise(rnd, 5, 240, 0.85) + waves(rnd, 2, 3, 8, 8)
        for _ in range(style.get('chips', 30)):
            c, wd, a = rnd.uniform(0, W), rnd.uniform(14, 64), rnd.uniform(5, 13) * rnd.choice([-1, 1])
            y += a * (smoothstep(c - 1.5, c + 1.5, xs) - smoothstep(c + wd - 1.5, c + wd + 1.5, xs))
    elif s == 'fingers':  # fairly even body; the interest is in the long runs
        y = lobes(rnd, 7, style.get('amp', 16), 26, 62) + waves(rnd, 3, 3, 10, 6) + 1.2 * pnoise(rnd, 40, 140, 1.0)
    elif s == 'smear':    # long lazy waves, dragged sideways
        y = waves(rnd, 4, 2, 7, 18) + lobes(rnd, 5, 20, 90, 170) + 1.0 * pnoise(rnd, 30, 90, 1.1)
    elif s == 'lip':      # the fine edge under the header
        y = lobes(rnd, 12, 11, 22, 56) + waves(rnd, 3, 5, 18, 4) + 0.9 * pnoise(rnd, 60, 200, 1.0)
    else:                 # 'plain'
        y = waves(rnd, 4, 3, 12, 14)
    y = y - y.min()
    return base + y


# ------------------------------------------------------------------------------------------------------------- runs
def place_runs(rnd, ye, n, min_gap, pairs=0.0):
    """x positions for the runs; they favour the lowest points of the edge, where material gathers.
    Some runs get a companion a few pixels away: the two merge at the root, as neighbouring runs do."""
    lo, hi = float(ye.min()), float(ye.max())
    span = max(hi - lo, 1.0)
    xs, tries = [], 0
    while len(xs) < n and tries < 4000:
        tries += 1
        x = rnd.uniform(70, W - 70)
        if any(abs(x - o) < min_gap for o in xs):
            continue
        if rnd.random() < math.exp((ye[int(x)] - hi) / (0.42 * span)):
            xs.append(x)
            if rnd.random() < pairs and x + 24 < W - 70:
                xs.append(x + rnd.uniform(9, 17))
    return sorted(xs)


def add_run(sdf, ye, rnd, x0, spec, H):
    yb = float(ye[int(x0) % W])
    w = rnd.uniform(*spec['w'])
    rn = w / 2
    bulb = rnd.uniform(*spec['bulb'])
    flare = rnd.uniform(*spec['flare'])
    drift = rnd.uniform(*spec['drift'])
    wob = rnd.uniform(0.4, spec.get('wob', 2.0)) * rnd.choice([-1, 1])
    wf = rnd.uniform(0.7, 2.0)
    room = H - 8 - yb - rn * bulb * 1.35
    L = spec['L'][0] + (spec['L'][1] - spec['L'][0]) * (rnd.random() ** spec.get('pw', 0.7))
    if rnd.random() < spec.get('stub', 0.0):          # a short stub: material that only just started to run
        L = rnd.uniform(6, 26)
        bulb = min(bulb, 1.25)
    L = max(8.0, min(L, room))
    y0 = yb - 12
    ytip = yb + L
    n = max(10, int((ytip - y0) / max(0.8, rn * 0.3)))
    t = np.linspace(0, 1, n)
    ys = y0 + t * (ytip - y0)
    xsn = x0 + drift * (t * t * (3 - 2 * t)) + wob * np.sin(2 * np.pi * wf * t) * t
    dist = ys - y0
    r = rn * (1 + (flare - 1) * np.exp(-np.maximum(dist - 12, 0) / (0.8 * w + 5)))
    rb = rn * bulb
    r = r + (rb - rn) * np.exp(-(((ys - ytip) / (0.95 * rb + 4)) ** 2)) * (ys > ytip - 3.5 * rb)
    pinch = spec.get('pinch', 0.22) * np.exp(-(((ys - (ytip - 2.7 * rb)) / (1.3 * rb + 2)) ** 2))
    r = r * (1 - pinch)
    rmax = float(r.max())
    pad = rmax + abs(drift) + abs(wob) + 8
    xa, xb = int(x0 - pad), int(x0 + pad) + 1
    ya, yb2 = max(0, int(y0 - rmax - 4)), min(H, int(ytip + rb + 20))
    X, Y = np.meshgrid(np.arange(xa, xb), np.arange(ya, yb2))
    d = np.full(X.shape, 1e9)
    for cx, cy, rr in zip(xsn, ys, r):
        d = np.minimum(d, np.hypot(X - cx, Y - cy) - rr)
    # a bead that has just let go
    if rnd.random() < spec.get('drop', 0.3) and ytip + rb + 20 < H - 6:
        gy = ytip + rb + rnd.uniform(5, 12)
        rr = rb * rnd.uniform(0.38, 0.62)
        d = np.minimum(d, np.hypot(X - xsn[-1], Y - gy) - rr)
        if rnd.random() < 0.5:   # and a thin string still joining it up
            d = np.minimum(d, np.hypot(X - xsn[-1], np.maximum(np.abs(Y - (ytip + rb * 0.4 + (gy - ytip - rb) * 0.5)) - (gy - ytip - rb) * 0.5, 0)) - 0.8)
    sub = sdf[ya:yb2, xa:xb]
    sdf[ya:yb2, xa:xb] = smin(sub, d[: sub.shape[0], : sub.shape[1]], spec.get('k', 11.0))


# ----------------------------------------------------------------------------------------------------------- render
def render(seed, H, fade, style, rim, base, runs, spec, relief=1.0, streak=1.0, gloss=1.0, min_gap=40, edge=None, plan=None):
    """edge: a ready-made edge line (used by the header lip); plan: [(x, spec)] explicit runs instead of random ones"""
    rnd = random.Random(seed)
    ye = edge(rnd) if edge is not None else edge_line(style, rnd, base)
    # distance below the edge line (approximate, corrected for slope)
    slope = (np.roll(ye, -1) - np.roll(ye, 1)) / 2.0
    cosv = 1.0 / np.sqrt(1 + slope ** 2)
    Y = np.arange(H, dtype=np.float64)[:, None]
    sdf = (Y - ye[None, :]) * cosv[None, :]
    # runs
    if plan is not None:
        for x0, sp in plan:
            add_run(sdf, ye, rnd, x0, sp, H)
    elif runs:
        for x0 in place_runs(rnd, ye, runs, min_gap, spec.get('pairs', 0.0)):
            add_run(sdf, ye, rnd, x0, spec, H)
    # coverage (antialiased), then melt into the section along the top
    alpha = np.clip(0.5 - 0.9 * sdf, 0, 1)
    top = smoothstep(0, fade, Y)
    alpha = alpha * top
    # height of the material: rounded profile + a bead along the free edge + faint flow marks
    depth = np.maximum(-sdf, 0)
    t = np.clip(depth / rim, 0, 1)
    h = 0.62 * rim * (1 - (1 - t) ** 2)               # contact angle of about 50 degrees, then flat
    h += 0.20 * rim * np.exp(-(((depth - 1.15 * rim) / (0.9 * rim)) ** 2))
    fl = blur_x(pnoise(rnd, 20, 150, 0.9), 2.4)
    h += streak * 0.55 * fl[None, :] * smoothstep(8, 70, depth) * top
    h = blur_y(blur_x(h, 1.15), 1.15)
    gx = (np.roll(h, -1, axis=1) - np.roll(h, 1, axis=1)) / 2
    gy = (np.roll(h, -1, axis=0) - np.roll(h, 1, axis=0)) / 2
    nx, ny, nz = -gx * relief, -gy * relief, np.ones_like(h)
    inv = 1.0 / np.sqrt(nx * nx + ny * ny + nz * nz)
    nx, ny, nz = nx * inv, ny * inv, nz * inv
    diff = nx * _L[0] + ny * _L[1] + nz * _L[2] - _L[2]
    nh = np.clip(nx * _HALF[0] + ny * _HALF[1] + nz * _HALF[2], 0, 1)
    spec_t = nh ** 90
    spec_b = nh ** 14
    sky = np.clip(-ny, 0, 1) ** 1.4
    diff = np.where(diff > 0, diff * 0.9, diff * 0.36)          # the shaded side is softer than the lit side
    grey = 0.5 + diff + gloss * (0.62 * spec_t + 0.20 * spec_b + 0.08 * sky)
    grey = np.where(alpha > 0.002, grey, 0.5)
    grey = np.clip(grey, 0.36, 0.97)
    return grey, alpha, ye


def save_tile(name, grey, alpha):
    g = (grey * 255 + 0.5).astype(np.uint8)
    a = (alpha * 255 + 0.5).astype(np.uint8)
    img = Image.fromarray(np.dstack([g, g, g, a]), 'RGBA')
    path = os.path.join(OUT, name + '.webp')
    img.save(path, 'WEBP', quality=80, alpha_quality=90, method=6)
    print(name, os.path.getsize(path) // 1024, 'KB', flush=True)


# ---------------------------------------------------------------------------------------------- the joins, one each
THIN = dict(w=(3.5, 7.5), bulb=(1.5, 2.2), flare=(1.6, 2.8), drift=(-7, 7), wob=3.2, L=(30, 150), pw=0.8, pinch=0.3, drop=0.5, k=8, stub=0.22, pairs=0.22)
FAT = dict(w=(16, 30), bulb=(1.1, 1.4), flare=(1.4, 2.0), drift=(-9, 9), wob=2.6, L=(30, 120), pw=0.7, pinch=0.15, drop=0.15, k=15, stub=0.1, pairs=0.15)
MIX = dict(w=(7, 22), bulb=(1.2, 1.7), flare=(1.5, 2.3), drift=(-9, 9), wob=3.0, L=(24, 140), pw=0.6, pinch=0.22, drop=0.3, k=11, stub=0.2, pairs=0.2)

SEAMS = {
    # n: (seed, style, runs, spec, extra)
    1:  (11, dict(edge='scallop', wmin=90, wmax=230, hmin=10, hmax=26), 4,  dict(MIX, L=(18, 60), w=(6, 12)), dict(base=50)),
    2:  (23, dict(edge='slump', n=9, amp=32), 7,  dict(FAT, L=(40, 130), w=(18, 32)), dict(base=52, rim=12)),
    3:  (37, dict(edge='fingers', amp=16), 17, dict(MIX, L=(26, 150), w=(8, 26), pw=0.5), dict(base=50)),
    4:  (41, dict(edge='ripple'), 6,  dict(THIN, L=(26, 90), w=(5, 9)), dict(base=50)),
    5:  (59, dict(edge='blob', n=6, amp=48), 5,  dict(MIX, L=(14, 50), w=(7, 16), bulb=(1.3, 1.8)), dict(base=44, rim=13)),
    6:  (73, dict(edge='ragged', chips=34), 6,  dict(MIX, L=(10, 46), w=(7, 15), flare=(1.3, 1.8), drop=0.0), dict(base=54, rim=8, relief=1.25)),
    7:  (89, dict(edge='fingers', amp=10), 40, dict(THIN, L=(22, 140), w=(4, 9), pw=0.9), dict(base=48, min_gap=22)),
    8:  (97, dict(edge='smear'), 6,  dict(MIX, L=(40, 150), w=(6, 14), pw=0.4), dict(base=48)),
    9:  (107, dict(edge='slump', n=5, amp=22), 4,  dict(FAT, L=(70, 150), w=(24, 38), pw=0.4), dict(base=46, rim=14)),
    10: (113, dict(edge='slump', n=11, amp=36), 12, dict(MIX, L=(40, 148), w=(10, 28), pw=0.45), dict(base=52, rim=12)),
    11: (127, dict(edge='scallop', wmin=60, wmax=150, hmin=8, hmax=20), 3, dict(MIX, L=(14, 44), w=(6, 11)), dict(base=46)),
    12: (131, dict(edge='blob', n=8, amp=36), 6, dict(MIX, L=(20, 70), w=(8, 18)), dict(base=46, rim=12)),
}

LIP = dict(edge='lip')


def build_all():
    os.makedirs(OUT, exist_ok=True)
    H, fade = 220, 26
    for n, (seed, style, runs, spec, ex) in SEAMS.items():
        ex = dict(ex)
        base = ex.pop('base')
        rim = ex.pop('rim', 10)
        grey, alpha, _ = render(seed, H, fade, style, rim, base, runs, spec, **ex)
        save_tile(f'pour-{n}', grey, alpha)
    # the lip under the header: shallower and finer
    spec = dict(w=(5, 16), bulb=(1.25, 1.9), flare=(1.5, 2.4), drift=(-7, 7), wob=2.6, L=(10, 104), pw=0.55, pinch=0.22, drop=0.35, k=8, stub=0.25, pairs=0.25)
    grey, alpha, _ = render(401, 150, 14, LIP, 7, 30, 11, spec, min_gap=52)
    save_tile('lip-1', grey, alpha)


# ------------------------------------------------------------------------------------- the header lip, second version
# SJ, 31 Oct 2026: "make the dripping a little less in size ... don't make it so low ... drip more in the corners and
# not much in the middle ... keep the civil engineering style". The first lip (lip-1) hung eleven runs, up to about
# 100 px, evenly along the whole bar. This one is a thin screeded edge along the middle, a few small beads, and the
# weeping gathers at the two ends of the bar, like slurry collecting at the corners of formwork: the longest runs at
# the very corner, shorter and finer towards the middle, then nothing. It does not repeat: the tile is stretched to
# the width of the screen (pour.css), so the corners stay corners at every width. lip-2-w is for screens from 900 px
# up, lip-2-n for phones and small tablets (a narrower picture, fewer runs).
LIP2_RUN = dict(w=(11, 24), bulb=(1.25, 1.8), flare=(1.5, 2.3), drift=(-5, 5), wob=2.2, pinch=0.24, drop=0.0, k=8, stub=0.0, pairs=0.0)


def lip2_corner(Wt, corner):
    """1 at the two ends of the bar, falling to 0 towards the middle"""
    u = np.arange(Wt) / (Wt - 1.0)
    return np.clip(np.exp(-((u / corner) ** 2)) + np.exp(-(((1 - u) / corner) ** 2)), 0, 1)


def lip2_edge(rnd, Wt, base, corner, mid=0.6):
    """an edge that is uneven all the way along (nowhere ruled): sags of every size, a little crumble on top; heavier and
    lower towards the two ends (mid = how much of that unevenness the middle keeps); flat only in the last few pixels so the lighting does not wrap"""
    xs = np.arange(Wt)
    cw = lip2_corner(Wt, corner)
    gentle = waves(rnd, 4, 3, 16, 3.4) + 1.1 * pnoise(rnd, 24, 190, 0.95)
    sags = lobes(rnd, int(Wt / 62), 11.0, 8, 44) * (mid + (1 - mid) * cw)
    y = gentle + sags
    y = y - y.min()
    ends = smoothstep(0, 30, xs) * smoothstep(0, 30, (Wt - 1) - xs)
    return base + y * ends


def lip2_plan(rnd, ye, Wt, corner, anchors, mean_mid, mean_cor, lmax_mid, lmax_cor, min_gap, wscale=1.0):
    """[(x, spec)]: the anchors are the longest runs at the corners (fraction of width, length, thickness); everything else is
    random: irregular spacing (closer at the ends), each run starts at a local low point of the edge, lengths run from stubs to
    drips (short in the middle, long at the corners), some come in pairs that merge at the root, a few let go of a bead"""
    cw = lip2_corner(Wt, corner)
    plan, used = [], []
    for f, L, wsc in anchors:
        x = f * Wt
        sp = dict(LIP2_RUN, L=(L, L), w=(LIP2_RUN['w'][0] * wsc * wscale, LIP2_RUN['w'][1] * wsc * wscale), drop=0.55 if L > 55 else 0.0)
        plan.append((x, sp)); used.append(x)
    x = rnd.uniform(60, 120)
    while x < Wt - 60:
        c = float(cw[int(x)])
        # snap to the lowest point of the edge within a short reach: material gathers there
        lo, hi = int(max(40, x - 26)), int(min(Wt - 40, x + 26))
        xs_ = lo + int(np.argmax(ye[lo:hi + 1]))
        c = float(cw[xs_])
        if all(abs(xs_ - u) >= min_gap for u in used):
            lmax = lmax_mid + (lmax_cor - lmax_mid) * c ** 0.9
            L = 5 + (lmax - 5) * (rnd.random() ** (1.25 - 0.45 * c))
            if c < 0.3 and rnd.random() < 0.17:                    # the odd long one in the middle, as real runs are
                L = rnd.uniform(0.75, 1.0) * lmax_mid * 1.7
            wsc = rnd.uniform(0.55, 1.15) * (0.85 + 0.35 * c) * wscale
            sp = dict(LIP2_RUN, L=(L, L), w=(LIP2_RUN['w'][0] * wsc, LIP2_RUN['w'][1] * wsc), drop=0.4 if L > 34 else 0.0)
            plan.append((float(xs_), sp)); used.append(xs_)
            if rnd.random() < 0.22 + 0.15 * c:                      # a neighbour that merges into it at the root
                x2 = xs_ + rnd.uniform(12, 22) * rnd.choice([-1, 1]) * wscale
                if 50 < x2 < Wt - 50 and all(abs(x2 - u) >= 9 for u in used if abs(u - xs_) > 1):
                    sp2 = dict(sp, L=(L * rnd.uniform(0.3, 0.7),) * 2, w=(LIP2_RUN['w'][0] * wsc * 0.6, LIP2_RUN['w'][1] * wsc * 0.65), drop=0.0)
                    plan.append((x2, sp2)); used.append(x2)
        step = rnd.uniform(0.4, 1.9) * (mean_mid + (mean_cor - mean_mid) * c)
        if rnd.random() < 0.14:
            step *= rnd.uniform(1.6, 2.6)                           # a longer clear stretch now and then
        x += max(step, min_gap * 0.8)
    return sorted(plan, key=lambda p: p[0])


def build_lip2():
    global W
    keep = W
    Ht, fade = 120, 9
    # wide: screens from 900 px up (aspect 20:1 at the size the page draws it)
    W = 2400
    rw = random.Random(7102)
    ye_w = lip2_edge(random.Random(52), W, 22, 0.15, 0.78)
    anchors_w = [(0.030, 46, 1.0), (0.057, 62, 1.15), (0.095, 33, 0.9), (0.953, 40, 1.0), (0.921, 58, 1.15), (0.884, 30, 0.9)]
    plan = lip2_plan(rw, ye_w, W, 0.15, anchors_w, 112, 58, 21, 60, 28)
    grey, alpha, _ = render(52, Ht, fade, None, 7, 0, 0, LIP2_RUN, edge=lambda r: lip2_edge(r, W, 22, 0.15, 0.78), plan=plan)
    print('wide runs:', len(plan), flush=True)
    save_tile('lip-2-w', grey, alpha)
    # narrow: phones (aspect 8:1): fewer, a little heavier runs, shorter
    W = 960
    rn = random.Random(7103)
    ye_n = lip2_edge(random.Random(53), W, 26, 0.22, 0.78)
    anchors_n = [(0.070, 42, 1.0), (0.145, 50, 1.1), (0.930, 36, 1.0), (0.855, 46, 1.1)]
    plan = lip2_plan(rn, ye_n, W, 0.22, anchors_n, 66, 44, 16, 48, 24, 0.9)
    grey, alpha, _ = render(53, Ht, fade, None, 7, 0, 0, LIP2_RUN, edge=lambda r: lip2_edge(r, W, 26, 0.22, 0.78), plan=plan)
    print('narrow runs:', len(plan), flush=True)
    save_tile('lip-2-n', grey, alpha)
    W = keep


if __name__ == '__main__':
    build_all()
    build_lip2()
