# NIRMANSHASTRA — FRONTEND DESIGN SPECIFICATION
## Version: Final v1 · June 2026 · Companion to NirmanShastra_Build_Reference.md

> **THIS FILE SUPERSEDES SECTION 3 (DESIGN SYSTEM) OF THE BUILD REFERENCE.**
> Everything else in the build reference — workflows, IS values, pricing, reports,
> cross-sell, database — is unchanged. Only the visual design is replaced by this spec.
>
> **HOW TO USE:** Keep this file beside the build reference. Whenever Cursor builds
> any UI, paste Section 9 (CURSOR DESIGN CONTRACT) at the top of the prompt.
> In any future Claude chat, upload this file — it wins over every earlier
> colour/font decision.

---

## 1. DESIGN THESIS

NirmanShastra must look like it was **drawn by a civil engineer**, not generated
by a website template. The visual world is the **Indian engineering working
drawing**: drafting paper, ink lines, dimension arrows, hatching conventions,
IS clause numbers, BOQ tables, site rubber stamps.

One sacred exception: **VastuPro** lives in gold-on-ink mandala territory.

- Technical layer (5 paid tools) = paper · ink · blueprint blue
- Sacred layer (VastuPro) = deep ink · gold

**Explicitly rejected:** the warm-cream background + terracotta accent +
Playfair Display fashion-serif combination. That palette (the one previously
locked in Build Reference Section 3) is the single most common AI/template
aesthetic on the internet. It is replaced in full by this spec. The brand
continuity survives through the Stamp Oxide CTA colour and the locked
Vastu Gold.

---

## 2. COLOUR TOKENS (named, final)

| Token | Hex | Use |
|---|---|---|
| **Sheet White** | `#F4F4F0` | Page ground. Cooler than cream — drafting paper, not latte. |
| **Iron Ink** | `#1E2227` | All text, rules, table lines, sheet frame. Blue-black drafting ink. Never use pure #000. |
| **Blueprint** | `#1F4E79` | The technical accent: links, active steps/tabs, IS-clause chips, chart bars, focus rings, selected states. |
| **Stamp Oxide** | `#8C3A22` | Primary CTA buttons and FAIL stamps ONLY. Never as section washes or backgrounds. (Successor of old brick #92400E — brand continuity lives here.) |
| **Marking Yellow** | `#D99A06` | Advisories, CPWD warning boxes, vertical-extension amber cards. Site marking paint. Always ink text on yellow fill — never yellow text. |
| **Approved Green** | `#14532D` | PASS states and success stamps. Unchanged from existing components. |
| **Vastu Gold** | `#C9A84C` | **VastuPro ONLY.** Canvas grid, Brahmasthan, compass, mandala, VastuPro accents. LOCKED — must match the canvas spec rgba(201,168,76,…). Never appears in the five paid tools. |

Neutral greys: derive from Iron Ink at 60% / 35% / 15% / 6% opacity over
Sheet White. No independent grey hexes — keeps the whole site "one ink."

---

## 3. TYPOGRAPHY — IBM PLEX SUPERFAMILY (Google Fonts, free)

One superfamily, four roles. This is the "drawn by one hand" coherence.

| Role | Font | Weights | Used for |
|---|---|---|---|
| Display | **IBM Plex Serif** | 600, 700 | H1–H3, report cover names, hero headline |
| Body & UI | **IBM Plex Sans** | 400, 500, 600 | All paragraphs, labels, buttons, nav |
| Data | **IBM Plex Mono** | 400, 500 | **EVERY number on the site**: quantities, ₹ rates, IS clauses, degrees, report IDs, dimensions, table numerals |
| Devanagari | **IBM Plex Sans Devanagari** | 400, 500 | Wordmark subline निर्माणशास्त्र, small section eyebrows |

**The Mono rule:** if a site engineer would write it on a drawing, it is set
in Plex Mono. No exceptions. This single rule does more for the "engineer-made"
feel than any colour choice.

Google Fonts import:
```
https://fonts.googleapis.com/css2?family=IBM+Plex+Serif:wght@600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans+Devanagari:wght@400;500&display=swap
```

**Drop Inter and Playfair Display everywhere** — layout.tsx, tailwind.config,
PDF templates.

Type scale: H1 40–56px / H2 28–32px / H3 20–22px (all Plex Serif),
body 15–16px Plex Sans, data 13–14px Plex Mono, eyebrows 11px Mono caps
with 0.08em tracking.

---

## 4. LAYOUT SYSTEM — "THE WORKING DRAWING SHEET"

1. **Sheet frame:** a 1px Iron Ink border inset ~16px around the viewport on
   desktop, like a drawing sheet margin. On mobile it collapses to single top
   and bottom rules.
2. **Grid-paper texture:** 8px square grid at 3–4% Iron Ink opacity on
   alternating sections (two CSS linear-gradients — no image files).
3. **Section headers as drawing labels:** mono eyebrow in Blueprint
   (`SHEET 02 · TOOLS` or `CL. 2.0 — SCOPE OF TOOLS`) above a Plex Serif
   title. Clause-style numbering is allowed and encouraged — the entire
   product is IS-clause-based, so the numbering encodes something true.
4. **Dimension-line dividers:** section separators are SVG dimension lines
   (arrowheads + extension ticks at each end) whose centre label is real
   content: `|◄—— 6 TOOLS · 1 PLATFORM ——►|`, `|◄—— ₹499 / REPORT ——►|`.
5. **Tables are BOQ tables:** 1px ink rules, header row in 11px Mono caps,
   numerals right-aligned in Mono. Zebra striping at 4% ink.
6. **Corners:** 0–2px radius on cards and sections (drawings have square
   corners). 6px ONLY on inputs and buttons, for touch usability.
7. **Shadows:** none, or at most `0 1px 0 rgba(30,34,39,.08)`. This is paper,
   not floating glass. No glassmorphism, no blur cards, no gradient meshes.

---

## 5. SIGNATURE ELEMENT — THE TITLE BLOCK

Every real engineering drawing carries a title block in the corner. It is
NirmanShastra's signature device, used in exactly three places:

**A. Homepage hero (right side, beside the headline):**
```
┌──────────────────────────────────────┐
│ PROJECT        YOUR HOME             │
│ DRG NO.        NS-001                │
│ DRAWN BY       NIRMANSHASTRA         │
│ CHECKED        IS 456 · 1077 · 732   │
│ AGAINST        · 1172 · 1893         │
│ SCALE          1:1 COST CERTAINTY    │
│ DATE           {live date}   REV A   │
└──────────────────────────────────────┘
```
Bordered grid, labels in 10px Mono caps at 60% ink, values in 13px Mono ink.
Headline beside it: **"Build With Certainty."** in Plex Serif 700, with the
Devanagari subline निर्माणशास्त्र beneath in Plex Sans Devanagari.

**B. Site footer:** the full-width title block — columns for Tools / Company /
Legal live inside its cells, with DRG NO., date, and REV in the end cell.

**C. Every PDF report cover:** the same title block, bottom-right, with the
client's project name as PROJECT and the report ID as DRG NO. This unifies
web and report into one drawing set.

**Motion (the only animation on the site):** on first load, the hero title
block border and one dimension line draw themselves once via
stroke-dashoffset (~700ms). Everything else is still. Honour
`prefers-reduced-motion` by skipping it entirely.

---

## 6. PER-APP MOTIFS — ENGINEERING HATCH CONVENTIONS

Each tool card and tool page header carries its own standard drawing symbol,
rendered as inline SVG line work in Iron Ink (Blueprint on hover):

| App | Motif |
|---|---|
| StructoPro | Concrete section hatch (aggregate dot-triangle) + column grid mark (C1) |
| MasonPro | Brick coursing hatch — 45° double diagonals (standard brick section symbol) |
| ElectroPro | Single-line-diagram glyphs — breaker circles on a line |
| PlumbPro | Riser line with trap symbol |
| InteriorPro | Floor tile grid hatch |
| VastuPro | Gold 16-spoke mandala on Iron Ink ground — the ONLY dark+gold surface |

Tool cards: Sheet White, 1px ink border, motif top-left, phase number as a
large Mono numeral (`P1`) at 8% ink behind the content, price bottom-right
in Mono. Free badge (VastuPro) in Approved Green; ₹499 chips in Blueprint.

---

## 7. STAMP BADGES — COMPLIANCE AS RUBBER STAMPS

IS compliance results render as rubber stamps, the way a site engineer
actually approves drawings:

- Double 1px border, slight −2° rotation, transparent fill
- Text in 10–11px Mono caps: `IS 456:2000 · CL 26.4 — PASS`
- PASS = Approved Green · ADVISORY = Marking Yellow (ink text on yellow) ·
  FAIL = Stamp Oxide
- Used in: IS compliance panels, results pages, PDF Page 3, vertical-extension
  safety check results

The CPWD warning box: Marking Yellow fill at 12%, 1px yellow border, ink text,
small ⚠ drawing-note triangle.

---

## 8. PAGE-LEVEL NOTES

- **Homepage:** hero (headline + title block) → dimension divider → problem
  strip (3 ink-line illustrations, not stock photos) → 6 tool cards on
  grid-paper section → free calculators as small "detail callouts" → IS code
  trust strip (clause chips in Blueprint) → pricing → title-block footer.
- **Tool wizards:** progress steps as numbered drawing revisions
  (REG → METHOD → DETAILS → RESULTS) in Mono; collapsed panels keep the
  existing "Using Pune Avg 2026 ✓" pattern but styled as drawing notes.
- **Results pages:** Grand Total in huge Plex Mono (a figure on a drawing,
  not a marketing number); blurred quantities keep existing blur mechanic;
  unlock card = Stamp Oxide CTA.
- **VastuPro exception:** page ground stays Sheet White, but the canvas panel,
  compass, and mandala sit on Iron Ink ground with Vastu Gold — sacred vs
  technical contrast. All existing canvas rgba values unchanged.
- **Mobile:** sheet frame → top/bottom rules; title block stacks to two
  columns; dimension dividers shrink to a centred label between short ticks.
- **Imagery:** no stock photography anywhere. Only ink line illustrations
  drawn in the hatch language above.

---

## 9. CURSOR DESIGN CONTRACT — PASTE THIS VERBATIM INTO CURSOR

```
DESIGN CONTRACT — NIRMANSHASTRA (do not deviate):

Aesthetic: Indian engineering working drawing. Drafting paper, ink lines,
dimension arrows, IS clause labels, BOQ tables, rubber stamps. No template
SaaS look, no stock photos, no glassmorphism, no gradients.

Colours (exact):
- Sheet White #F4F4F0 (page bg)
- Iron Ink #1E2227 (all text/lines/borders; never #000)
- Blueprint #1F4E79 (links, active states, IS clause chips, charts)
- Stamp Oxide #8C3A22 (primary CTA buttons + FAIL stamps only; never washes)
- Marking Yellow #D99A06 (warnings/advisories; ink text on yellow only)
- Approved Green #14532D (pass states)
- Vastu Gold #C9A84C (VastuPro pages ONLY; never in paid tools)
Greys = Iron Ink at 60/35/15/6% opacity. 

Fonts (Google Fonts): IBM Plex Serif 600/700 for headings; IBM Plex Sans
400/500/600 for body/UI; IBM Plex Mono 400/500 for EVERY number, ₹ rate,
IS clause, report ID, and table numeral; IBM Plex Sans Devanagari for the
निर्माणशास्त्र wordmark subline. Remove Inter and Playfair Display.

Layout: 1px Iron Ink sheet-frame border inset 16px around viewport (desktop);
faint 8px grid-paper texture (3-4% ink) on alternating sections; section
headers = mono Blueprint eyebrow ("SHEET 02 · TOOLS") + Plex Serif title;
section dividers = SVG dimension lines with real content as the label;
all data tables styled as BOQ tables (ink rules, mono right-aligned numerals).
Corners 0-2px (6px on inputs/buttons only). Shadows flat (max 0 1px 0 8% ink).

Signature: engineering title block (PROJECT / DRG NO / DRAWN BY / CHECKED
AGAINST / SCALE / DATE / REV) used in hero, footer, and PDF covers. One
animation only: title block + one dimension line self-draw on first load
(stroke-dashoffset, ~700ms); respect prefers-reduced-motion.

Per-app SVG motifs: StructoPro concrete hatch; MasonPro 45° brick hatch;
ElectroPro single-line diagram; PlumbPro riser+trap; InteriorPro tile grid;
VastuPro gold 16-spoke mandala on Iron Ink.

Compliance badges = rubber stamps: double 1px border, −2° rotation, mono caps
("IS 456:2000 · CL 26.4 — PASS"), green/yellow/oxide by status.
```

---

## 10. CROSS-CHECK CORRECTIONS TO THE BUILD REFERENCE (verified June 2026)

1. **IS values verified present and final** in NirmanShastra_Build_Reference.md
   Section 8 — each exactly once (single source of truth): M20 = 8.07 bags/m³;
   internal plaster 0.078 bags/sqm; ceiling plaster 0.042; column steel 196.25
   kg/m³; footing 39.25; plinth/beam 117.75; modular 9" = 100 bricks/sqm,
   4.5" = 50; mortar dry factor 1.1 vs concrete 1.54; masonry start 60–90 days
   after pour; Vastu Gold #C9A84C locked.
2. **PDF engine contradiction — RULING:** the build reference says "Puppeteer"
   in 4 places (Section 2 line 46, post-payment flow, P0, P7), but the final
   recorded architecture decision was **@react-pdf/renderer**. The ruling is
   **@react-pdf/renderer everywhere.** Reason: Vercel serverless has a 50MB
   function limit; headless Chrome needs fragile workarounds; react-pdf is
   pure JS and serverless-safe. When reading the build reference, mentally
   replace every "Puppeteer" with "@react-pdf/renderer". SVG report drawings
   render via react-pdf primitives (Svg, Path, Rect, Text).
3. **VastuPro engine:** pure TypeScript ray-casting point-in-polygon — no
   Shapely, no Python. Confirmed final.
4. **Source file warning:** StructoPro_v3_CLEAN.html is NOT stored in this
   workspace (only ElectroPro v1/v2, InteriorPro v1, MasonPro v1/v2,
   PlumbPro v1 are). It is the porting source for the flagship tool — keep
   your own copy backed up (device + Google Drive + GitHub once created).
5. **This file supersedes only Section 3** of the build reference. All
   workflows, reports, IS values, pricing, emails, and cross-sell copy
   are unchanged.

*End of design specification. Final v1 — June 2026.*
