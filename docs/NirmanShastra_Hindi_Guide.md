# NirmanShastra: Hindi guide (SJ, 30 Oct 2026)

SJ's instruction: when someone picks Hindi at the start, the WHOLE site is Hindi: tool pages, calculators, inner pages, everything.
Devanagari script, with everyday site words allowed in English ("Hinglish"). He reviews the live Hindi pages afterwards.
PDFs, e-mails sent to customers and the admin screen stay English for now. Blog articles and the legal pages come last.

## 1. How the site is wired

- Every page lives under `app/[locale]/...`. English is at the plain address (`/about`), Hindi at `/hi/about`.
- Links: always `import { Link } from '@/i18n/navigation'` (and `useRouter`, `usePathname`, `redirect` from the same file). They add `/hi`
  by themselves. Never write `/hi/...` by hand, never build a language-prefixed href. Hash link to the home page: `href={{ pathname: '/', hash: 'pricing' }}`.
  Files with no language (`/llms.txt`, `/samples/x.pdf`, `/api/...`) use a plain `<a>`.
- A layout or page gets the language from `params`: `const { locale } = await params; setRequestLocale(locale)`.
  Every `layout.tsx` under `app/[locale]` already does this and passes `locale` to `<InnerShell locale={asLocale(locale)}>`. A server page that
  needs the language does the same two lines (see `app/[locale]/page.tsx`). A client component uses `useLocale()` from `next-intl`.
- Page title and description: each layout has `const HI: HiMeta = {}`. Fill in `title` and `description` (and `imageAlt`) with the Hindi text.
  Do NOT edit `lib/i18n/translated.ts`; the orchestrator lists a page there when its Hindi is finished (that is what turns on the
  hreflang pair, the /hi canonical address and the sitemap entry).
- JSON-LD in a layout (breadcrumb names, tool schema) is also per language: build the Hindi names for `/hi` pages.

## 2. Three ways to hold Hindi text. Use the one that fits.

1. **Copy that we write** (page text, field labels, buttons, help text): two objects with the same shape, the Hindi one typed as the
   English one so a missing key fails `tsc`:
   ```ts
   import type { Copy } from '@/lib/i18n/copy'
   const en = { title: 'Brick Calculator', note: 'No sign-in.' }
   const hi: typeof en = { title: 'ईंट कैलकुलेटर', note: 'साइन-इन की ज़रूरत नहीं।' }
   export const COPY: Copy<typeof en> = { en, hi }
   ```
   Server: `COPY[asLocale(locale)]`. Client: `const t = useCopy(COPY)` (`@/lib/i18n/use-copy`).
   Keep the copy next to the component, or in `lib/<area>/copy.ts` when several files share it.
   Existing bilingual data (`lib/v2/copy.ts`, `lib/v2/calculators.ts`, `lib/v2/content.ts`) uses `{ en, hi }` pairs and `pick(b, locale)`; reuse them.
2. **Data tables** (a list of fields, rules, glossary terms, FAQ entries): add the Hindi next to the English in the same record, or a parallel
   `hi` table keyed by the same id. Never let the two drift: key by id, not by position.
3. **Labels the SERVER sends** (paid report item names, table titles, notes, code-check text): the models in `lib/structopro-qty` and
   `lib/qty/*` return finished English strings that are frozen into each paid report. Do NOT touch the models. Look the string up at display time:
   `const t = useTr(DICT)` (`@/lib/i18n/use-tr`), then `t(row.item)`. A dictionary is `Record<english, hindi>`; a string with numbers or names in it uses
   `{0}`, `{1}` placeholders on both sides (see `lib/i18n/tr.ts`). Put dictionaries in `lib/i18n/labels/<name>.ts`. To collect the strings, run the
   model in a script over a spread of inputs and gather every distinct string (write that script in the scratchpad, not the repo). A string with no
   entry just shows in English, so cover everything you can find and report what you could not.

State dropdowns: `stateLabel(state, locale)` from `@/lib/i18n/states` for the label; the `value` stays the English name. City names stay as they are.

## 3. House style

- **Script**: Devanagari. Sentences in natural spoken Hindi (आप, not तू; polite imperative "कीजिए/चुनिए/डालिए"), short, no bureaucratic Sanskrit.
- **Everyday site words are transliterated into Devanagari, as the live Hindi home page does** (look at `lib/v2/copy.ts` and follow its choices):
  सीमेंट, स्टील, कंक्रीट, स्लैब, बीम, कॉलम, फुटिंग, प्लिंथ, लिंटल, प्लास्टर, टाइल, पेंट, पाइप, केबल, शटरिंग, कैलकुलेटर, टूल, रिपोर्ट, कोटेशन, रेट, प्लॉट, ग्राउंड फ़्लोर.
  Words with a plain Hindi form use it: ईंट, रेत, गिट्टी, तार, टंकी, नींव, नक्शा, मंज़िल, मात्रा, मसाला (mortar), सरिया (rebar bars).
  Cement is counted in बैग (as on the home page); keep a word the same everywhere on a page.
- **Stay Latin (never transliterate)**: brand and product names (NirmanShastra, StructurePro, MasonryPro, ElectricalPro, PlumbingPro, InteriorPro, VastuPro,
  Grand Total only as the Hindi form already used: ग्रैंड टोटल; Complete House Pack as कम्प्लीट हाउस पैक), IS-code names and numbers (IS 456:2000), concrete and
  steel grades (M25, Fe500, Fe500D), units (mm, m, kg, kN/m², sq ft is written वर्ग फ़ुट in sentences and `sq ft` in tight table columns, m² and m³ stay), abbreviations
  (RCC, PCC, TMT, OPC, PPC, GST, TDS, PF, ESI, BOQ, PDF, Excel, UPI, FAQ, OTP, AI), file names, e-mail addresses and URLs.
  The allow-list the scanner uses is `scripts/hindi-allowlist.txt`.
- **Numbers and money**: Latin digits (1, 2, 3), ₹ and Indian grouping (₹2,299; 1,25,000) exactly as the English page shows them. Never Devanagari digits.
  Never change a figure, a formula, a unit or an IS-code value. Hindi follows the English; it never "improves" it.
- **Meaning**: same facts, same claims, same caveats. Do not add a claim, a promise, a price, a testimonial, a rating or a number that the English page does not have.
  Legal and refund wording must say exactly what the English says.
- **Buttons and labels**: short. Hindi runs 20 to 35 % longer than English, so check every screen (section 5).
- **Dates**: `25 Oct 2026` becomes `25 अक्टूबर 2026`. Months: जनवरी फ़रवरी मार्च अप्रैल मई जून जुलाई अगस्त सितंबर अक्टूबर नवंबर दिसंबर.
- **Nukta**: write ज़ फ़ क़ ख़ ग़ where it is normally written (मज़दूरी, फ़ुट, क़ीमत, ख़ामी). Use ँ (chandrabindu) and ं (anusvara) as in standard Hindi (हिंदी, मात्राएँ).
- Do not translate: the `value` of any `<option>`, `<input>` or API field; CSS class names; analytics event names; anything sent to the server.

## 4. What you must not touch

Engines and models (`lib/structopro-qty/**` calculation files, `lib/qty/**` models, `app/[locale]/tools/*/*-engine.ts`, `structopro-engine.ts`, `structopro-ve-engine.ts`),
`lib/pdf/**`, `app/api/**`, e-mail templates, `lib/rates/**`, `lib/tool-pricing.ts`, `lib/policy.ts` (the orchestrator edits it), the styles that draw the poured edges
(`styles/v2/pour.css`, `components/v2/Pour.tsx`), `middleware.ts`, `i18n/**`, `lib/i18n/translated.ts`, `lib/i18n/paths.ts`, `lib/i18n/meta.ts`, `scripts/**` (read only), anything outside your group's files.
If a change outside your files is needed, say so in your report instead of making it.

## 5. How to check your work (all of it, before you report)

The dev server is already running at http://localhost:3111 and picks up your edits. Do NOT start another server and do NOT restart this one; if it is down, wait a minute and retry.
The machine has two CPUs and little spare memory: run `npx tsc --noEmit -p .` at most a few times, and one Playwright browser at a time.

1. `cd /home/claude/jhawarsudip/nirmanshastra && npx tsc --noEmit -p . 2>&1 | grep -v '^\.next/types'` shows no error in YOUR files (errors in other people's files are theirs).
2. English must be unchanged: open the English page before and after; its text and layout must not move. Compare with a screenshot at 1366 x 650.
3. Leftover scan: `python3 scripts/check-hindi-leftovers.py ROUTES.json http://localhost:3111` (see the script header) on each of your Hindi routes, desktop and `MOBILE=1`.
   Aim for 0 leftover. Use `CLICK='["button[aria-expanded=false]", ...]'` to open the folded parts first. Anything that really must stay Latin and is not on the
   allow-list: tell the orchestrator in your report (do not edit the allow-list).
4. Look at the Hindi page: screenshots at 1366 x 650 (desktop) and 390 x 844 (phone), light theme, consent banner hidden with injected CSS
   (`.ns-consent{display:none!important}`; do not accept analytics in tests). Check for overflow, clipped or overlapping text, a button whose label wraps badly,
   and a table that scrolls sideways where the English did not.
5. Pages with a wizard whose later steps need the database or the server calculation (sign-up, registration, "Calculate"): the cloud has no real Supabase, so those
   steps cannot be completed here. Do not try to use the production database or any real key. Instead, make a TEMPORARY proof page (for example `app/[locale]/zz-proof/page.tsx`)
   that renders the component with a sample payload produced by running the real model in-process, screenshot it in Hindi and English, then DELETE the proof page
   (`git status` must not show it) and `rm -rf .next/types/app/**/zz-proof` if tsc complains.
6. Never accept analytics consent, never submit a real form, never call a payment or e-mail route.
7. Report: files changed, what is translated, what is still English and why, any wording you were unsure of (list it so SJ can review), anything outside your files that needs
   a change, the leftover-scan result per route, and the screenshot paths. Do NOT commit; the orchestrator reviews and commits.

## 6. Pages and their status

`lib/i18n/translated.ts` lists the pages whose Hindi is finished. Until a page is listed, `/hi/<page>` shows the Hindi header and footer around its
(possibly English) body, and tells search engines to use the English address.
