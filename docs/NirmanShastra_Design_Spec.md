# NIRMANSHASTRA — FRONTEND DESIGN SPECIFICATION
## Version: v2 · October 2026 · "Limewash & Laterite" · Companion to NirmanShastra_Build_Reference.md

> **THIS FILE SUPERSEDES SECTION 3 (DESIGN SYSTEM) OF THE BUILD REFERENCE AND THE JUNE 2026 DESIGN SPEC v1
> ("working drawing sheet" / Plex Serif / Blueprint blue / Sheet White).**
> Everything else in the build reference (workflows, IS values, pricing, reports, cross-sell, database) is unchanged.
> Source of truth for the art direction: `design-v2-art-direction-and-asset-pack.md` (claude.ai Project "NirmanShastra").

**Rollout status (branch `redesign-v2`):** Stage 1 = homepage (`app/[locale]`) only. The new tokens are scoped
under the `.ns2` wrapper and `--ns-*` custom properties, so tool wizards, blog, reports and auth keep the old dark
tokens until Stage 2. Do not edit `:root` tokens in `globals.css` for v2.

---

## 1. DESIGN THESIS

A building site at first light, drawn the way an engineer draws it. Warm lime-plaster paper, laterite red-brown,
oxidised-copper verdigris, warm black ink, real material close-ups. It is a drawing board and a site with live numbers
on it, not a "premium dark tech" site.

**Rules that keep it designed rather than generated**
- Real materials, not gradients. Large surfaces are flat colour, paper grain or a material photograph.
- Drafting conventions are the animation language: heavy line = cut, thin = beyond, dashed = hidden, long-short = centreline.
  Hatches: concrete = dots and small triangles, brick = 45° lines, earth = short diagonal ticks, steel = dense 45° lines.
  All drawn in code and animated by "drawing themselves".
- Numbers are always IBM Plex Mono (locked rule in CLAUDE.md).
- No glassmorphism, glow, purple/blue gradients, emoji, or stock icon packs. Icons are drafted at 1.5 px stroke.
- Shapes: 0 px radius on blocks, 2 px on inputs. Shadows are hard offsets only (3px 3px 0 ink). Never blurred.
- Photos: overcast or dawn light, slightly desaturated, fine grain. No HDR.

## 2. COLOUR TOKENS

**Light "Limewash"**: `--ns-bg #EFE7D8` · `--ns-bg-2 #E6DCC8` · `--ns-paper #F7F2E7` · `--ns-ink #1C1B19` ·
`--ns-ink-2 #4A453D` · `--ns-laterite #A5462B` · `--ns-laterite-deep #8F3A22` · `--ns-verdigris #1F4B47` ·
`--ns-concrete #BDB8AE` · `--ns-hair rgba(28,27,25,.14)`

**Dark "Night site"**: bg `#171512` · bg-2 `#1F1C18` · paper `#26221D` · text `#EFE7D8` · muted `#B9B0A0` ·
laterite `#D2694A` · verdigris `#4F9A92` · concrete `#8A857B` · hair `rgba(239,231,216,.14)`

**Stage sections** (dark feature bands in both themes): bg `#14322F`, chalk `#EFE7D8`. Laterite on stage is 3.8:1,
so it is for large type and graphics only; small text on stage is chalk.

**Tool accents** (wayfinding; light / dark): StructurePro `#1F4B47` / `#4F9A92` · MasonryPro `#A5462B` / `#D2694A` ·
ElectricalPro turmeric `#C98A0B` / `#E0A524` (fill or stripe ONLY, never text) · PlumbingPro `#2F5D8C` / `#6F9AD0` ·
InteriorPro `#7B3F5A` / `#C27A98` · VastuPro gold `#C9A84C` (VastuPro ONLY, per CLAUDE.md).

Contrast (WCAG AA 4.5:1): ink on limewash 14.0 · laterite 4.9 · laterite-deep 6.1 · verdigris 7.9 · chalk on stage 11.2.

## 3. TYPOGRAPHY

| Role | Font | Weights | Use |
|---|---|---|---|
| Display | Big Shoulders Display | 800, 900 | H1/H2, giant numerals, kickers; UPPERCASE, +0.02em, leading 0.9 |
| Text / UI | Instrument Sans | 400, 500, 600 | body 17–18 px / 1.6, buttons, nav, labels |
| Numbers | IBM Plex Mono | 400, 500 | EVERY number, rate, IS clause, table numeral |
| Hindi | Hind | 700 display, 400/500 text | through `:lang(hi)`; Big Shoulders has no Devanagari |

H1: `clamp(56px, 11vw, 190px)`, uppercase, 900. Never Inter, Space Grotesk, Roboto or system-ui as a primary face.

## 4. INTERACTION LANGUAGE

Plumb-line load (once per session, <900 ms) · CAD cursor (desktop, fine pointer) · Hero Section Cut (sliders drive
live quantities from locked Section 8 values + engine rates) · Five Disciplines (pinned horizontal scroll on desktop,
native swipe shelf on touch) · Exploded structure L01–L07 · Rebar Cage Builder · Brick Bond Wall · Mix Lab ·
Quote Checker teaser (real engine) · Tool Finder · Surveyor's-tape marquee · Section-cut page transition ·
Plate buttons · Foundation footer · Day/Night work-lamp toggle (View Transition) · Calm toggle · Level-staff scroll progress.

**Guardrails:** `prefers-reduced-motion` and the Calm toggle disable the cursor, pinned scroll, scroll-linked transforms
and all keyframes. Mobile gets the same content, with touch-native equivalents. WebGL: none in Stage 1. Images through
`next/image` (AVIF/WebP). LCP target < 2.5 s on throttled 4G. Every number shown by an interactive widget must come from
locked Build Reference Section 8 values or the StructurePro engine; anything else is labelled "illustrative".

## 5. COMPONENT LANGUAGE

- **Plate button:** laterite block, paper text, hard 3px/3px ink offset shadow; press translates 3px and collapses the
  shadow; hover slides a level bubble across the label; focus ring 3px verdigris, offset 3px.
- **Plate (card):** paper fill, 1px ink hairline, hard offset shadow, taped corners when it carries a photograph.
- **Eyebrow:** IBM Plex Mono 11–12 px caps, +0.12em, e.g. `SHEET 03 · FIVE DISCIPLINES`.
- **BOQ table:** 1px ink rules, 11px Mono caps header, right-aligned Mono numerals, zebra at 4% ink.
- **Stamp:** double border, −2° rotation, mono caps (`IS 456:2000 · CL 26.4 — PASS`); PASS verdigris, ADVISORY turmeric
  fill with ink text, FAIL laterite.
- **Hatch library (`styles/v2.css` + `components/v2/Hatch.tsx`):** concrete, brick, earth, steel, murum, rock.

## 6. PAGE NOTES

- **Homepage order:** header → Section Cut hero → tape marquee → problems → exploded structure → Five Disciplines
  (stage) → build-it-yourself lab (rebar, brick, mix) → Quote Checker + Tool Finder → how it works → comparison →
  IS codes → pricing → toolkits + free calculators → dealers → foundation footer.
- **SEO/i18n:** all copy stays in `messages/en.json` / `hi.json` (and the existing inline bilingual strings). H1 and
  H2s stay server-rendered. JSON-LD stays in the root layout. Hindi uses `:lang(hi)` fonts (Hind).
- **VastuPro exception:** gold appears only on the VastuPro plate and inside the VastuPro tool.
- **Imagery:** AI-made plates are allowed (M05, M10, M12, P01–P06, O01–O10) per the asset pack; diagrams and hatches
  are drawn in code; L01–L07 are code-built isometric layers (see `design-v2-layers-code-build.md`).

## 7. CROSS-CHECK CORRECTIONS TO THE BUILD REFERENCE (carried over from v1, still valid)

1. IS values verified present and final in Build Reference Section 8 (M20 = 8.07 bags/m³; internal plaster 0.078
   bags/sqm; ceiling plaster 0.042; column steel 196.25 kg/m³; footing 39.25; plinth/beam 117.75; slab 78.50;
   modular 9" = 100 bricks/sqm, 4.5" = 50; mortar dry factor 1.1 vs concrete 1.54; Vastu Gold #C9A84C locked).
2. PDF engine: **@react-pdf/renderer everywhere**. Mentally replace every "Puppeteer" in the build reference.
3. VastuPro engine: pure TypeScript ray-casting point-in-polygon.
4. StructoPro_v3_CLEAN.html is not stored in the workspace; keep your own backup.
5. This file supersedes only the visual design. Workflows, reports, IS values, pricing, emails, cross-sell are unchanged.

*End of design specification. v2 — October 2026.*
