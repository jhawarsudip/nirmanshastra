# CLAUDE.md — NirmanShastra

## READ FIRST — EVERY SESSION
- Before any task, read docs/NirmanShastra_Build_Reference.md and docs/NirmanShastra_Design_Spec.md fully. Design Spec supersedes Section 3 of the build reference.
- IS-code values in Build Reference Section 8 are LOCKED. Never alter them from any other source.
- Calculation logic is PORTED from HTML apps in docs/ — never invented from scratch.
- PDFs use @react-pdf/renderer only. Never Puppeteer.
- Razorpay: server-side HMAC SHA256 only. Key Secret never client-side. Paid content revealed only after server verification.
- Vastu Gold #C9A84C in VastuPro only. Never in paid tools.
- IBM Plex Mono for IS clauses, formulas and code-like table numerals in `.ns-code` blocks; plain-language numbers on v4 pages use Mukta tabular figures.
- DESIGN v3 ("Warm Storybook", Oct 2026) was REJECTED by SJ on 24 Oct 2026. Its files (`components/v3`, `lib/v3`, `styles/v3`) are unused and kept on disk only; do not build on them.
- DESIGN v4 ("warm v2", 24-25 Oct 2026) is the HOMEPAGE and the inner-page direction: `app/[locale]/page.tsx` uses `components/v2/sections/*`; inner pages use `components/v2/inner/InnerShell.tsx` (header and footer shared with the homepage). Plain answers first, formulas behind a "Show the calculation" button. Copy is bilingual EN/HI on the homepage (`messages/*.json`, `lib/v2/copy.ts`); inner pages are English until the copy settles.
- QUANTITIES FIRST, RUPEES ONLY AT THE CUSTOMER'S OWN RATES (SJ, 24-25 Oct 2026; amended 26 Oct 2026, Group 9): the site computes quantities and supplies no rate, labour or contractor rate of its own in any calculation. Every paid report and the Grand Total has an optional, collapsed panel "Want this in rupees? Enter your local rates." (`components/v2/qty/RatesPanel.tsx`, logic in `lib/rates/*`): every box starts empty, the customer types their own rates, and the page shows material cost per item and a total labelled "Material cost at the rates you entered. Labour, transport and taxes are not included." The PDF carries the rupee table only if rates were typed and the customer asks for it; that PDF is a one-off download (not stored, not emailed) and typed rates are never saved. The "Typical: ₹… (ask your dealer)" hints come only from `lib/rates/hints.ts`, which SJ controls and dates; a hint is a guide and is never used in a calculation. Never add a default rate, a rate of your own, a labour figure or a "your house costs ₹X" figure. No rupee figure appears in a free tool result or in any result before payment. Every paid tool computes on the SERVER (`lib/<tool>-qty/*`), stores a free summary and a frozen paid payload, and reveals quantities only after payment verification. The Build Reference section 8 per-sq-ft thumb rules for the structure (0.4 bag, 4 kg per sq ft) are superseded by `lib/structopro-qty` with SJ's delegated sign-off (see project doc `website-quantity-only-decisions-2026-10-25`). `structopro-engine.ts` and `structopro-ve-engine.ts` stay locked and untouched; they are no longer used by any live page.
- DESIGN v2 ("Limewash & Laterite", Oct 2026) is the palette and type system under v4: tokens are `--ns-*` under the `.ns2` wrapper. Fonts as shipped in v4 (`lib/v2/fonts.ts`): Rozha One (display) and Mukta (body), both with Devanagari; numbers use tabular figures in Mukta on the homepage and IBM Plex Mono in `.ns-code` blocks. Never Inter/Playfair as a primary face on v2 pages. Hard offset shadows only; 0 px radius; no glassmorphism. Interactive widgets may only show numbers from Build Reference Section 8 or the engines, else label them illustrative.
- One task at a time. Verify locally, then commit to GitHub.

## TECH STACK
- Next.js 15 App Router + TypeScript + Tailwind CSS
- Supabase (PostgreSQL + Auth + RLS)
- Razorpay payments (server-side only)
- Resend emails
- @react-pdf/renderer for all PDFs
- Claude API for AI chatbox (build last)
- Vercel deployment

## BUILD ORDER
1. Project scaffold + design system
2. Supabase schema + lead capture
3. VastuPro (free tool, no payment)
4. StructoPro (first paid tool)
5. PDFs for both
6. Homepage
7. Remaining 4 tools
8. Admin dashboard
9. AI chatbox (last)

## NEVER DO
- Never expose RAZORPAY_KEY_SECRET to client
- Never reveal paid quantities before server HMAC verification
- Never use Puppeteer
- Never change IS code values in Section 8
- Never invent calculation logic — always port from docs/ HTML files


