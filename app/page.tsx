import Link from 'next/link'

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────

const IS_CODES = [
  'IS 456:2000', 'IS 1786:2008', 'IS 1893:2016', 'IS 13920:2016',
  'IS 1077:1992', 'IS 12894:2002', 'IS 2185:2005', 'IS 2212:1991',
  'IS 1661:1972', 'IS 2645:2003', 'IS 4326:1993', 'IS 732:2019',
  'IS 694:2010',  'IS 8828:2007', 'IS 3043:2018', 'IS 1172:1993',
  'IS 1742:1983', 'IS 1904:2016', 'IS 2911:2010', 'IS 875:2015',
  'IS 2250:1981', 'IS 383:2016',  'IS 269:2015',  'IS 2547:1976',
  'NBC 2016',
]

const TOOLS = [
  {
    phase: 'P0', name: 'VastuPro',    tagline: 'Vastu Compliance',
    desc:  'Complete 33-room Vastu check with zone scoring, remedies, and free PDF report.',
    price: 'FREE', free: true,  href: '/tools/vastu-pro',
  },
  {
    phase: 'P1', name: 'StructoPro',  tagline: 'RCC Structure Cost',
    desc:  'Foundations, columns, beams, slabs per IS 456:2000. M20 / M25 / M30 grades.',
    price: '₹499', free: false, href: '/tools/structopro',
  },
  {
    phase: 'P2', name: 'MasonPro',    tagline: 'Masonry & Plaster',
    desc:  'All 8 wall types — brick, AAC, hollow block — plaster and waterproofing per IS 1077:1992.',
    price: '₹499', free: false, href: '/tools/masonpro',
  },
  {
    phase: 'P3', name: 'ElectroPro',  tagline: 'Electrical',
    desc:  'Wiring, DB panels, earthing per IS 732:2019. Circuit-by-circuit breakdown.',
    price: '₹499', free: false, href: '/tools/electropro',
  },
  {
    phase: 'P4', name: 'PlumbPro',    tagline: 'Plumbing',
    desc:  'Water supply, drainage, sanitary fixtures per IS 1172:1993. Tank sizing included.',
    price: '₹499', free: false, href: '/tools/plumbpro',
  },
  {
    phase: 'P5', name: 'InteriorPro', tagline: 'Interior Finishing',
    desc:  'Flooring, kitchen, paint, false ceiling across Basic / Standard / Premium / Luxury.',
    price: '₹499', free: false, href: '/tools/interiorpro',
  },
]

const PROBLEMS = [
  {
    no: '01',
    heading: 'Contractors quote without IS codes',
    body: 'Most residential estimates use thumb rules and verbal norms, not IS 456 or IS 732. You have no standardised baseline to verify against.',
  },
  {
    no: '02',
    heading: 'Quantity inflation is invisible',
    body: 'Inflated brick counts, wrong mortar ratios, oversized pipe diameters — all buried inside a single lump-sum figure. A detailed breakdown would expose them instantly.',
  },
  {
    no: '03',
    heading: 'Five phases, zero unified picture',
    body: 'Structure, masonry, electrical, plumbing, interior — five contractors, five quotations, no reconciled total and no way to track where the budget went.',
  },
]

const STEPS = [
  {
    rev: 'REV A',
    heading: 'Answer plain questions',
    body: 'No engineering degree required. IS codes run silently in the background. Rates pre-filled from city databases.',
  },
  {
    rev: 'REV B',
    heading: 'See IS compliance live',
    body: 'Every estimate auto-checks against 25 IS codes. Green / amber / red badges appear as you fill in project details.',
  },
  {
    rev: 'REV C',
    heading: 'Unlock exact quantities',
    body: 'Pay ₹499. See cement bags, steel kg, wire metres, pipe lengths, brick counts — line by line with labour costs.',
  },
  {
    rev: 'REV D',
    heading: 'Compare your contractor',
    body: 'Paste their quote. Get a line-by-line comparison showing exactly where it diverges from the IS-code baseline.',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// SVG MOTIFS — per-app engineering hatch conventions
// ─────────────────────────────────────────────────────────────────────────────

function StructoHatch() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <circle cx="10" cy="12" r="2.5" fill="currentColor" opacity=".65" />
      <circle cx="27" cy="25" r="2"   fill="currentColor" opacity=".45" />
      <circle cx="36" cy="13" r="2.5" fill="currentColor" opacity=".65" />
      <circle cx="15" cy="34" r="2"   fill="currentColor" opacity=".45" />
      <circle cx="32" cy="37" r="1.5" fill="currentColor" opacity=".35" />
      <line x1="22" y1="0"  x2="22" y2="44" stroke="currentColor" strokeWidth=".8" opacity=".35" />
      <line x1="0"  y1="22" x2="44" y2="22" stroke="currentColor" strokeWidth=".8" opacity=".35" />
      <text x="24" y="11" fontSize="7" fill="currentColor" fontFamily="monospace" opacity=".8">C1</text>
    </svg>
  )
}

function MasonHatch() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <line x1="0"  y1="0"  x2="44" y2="44" stroke="currentColor" strokeWidth="1.2" opacity=".5" />
      <line x1="0"  y1="11" x2="33" y2="44" stroke="currentColor" strokeWidth="1.2" opacity=".5" />
      <line x1="11" y1="0"  x2="44" y2="33" stroke="currentColor" strokeWidth="1.2" opacity=".5" />
      <line x1="44" y1="0"  x2="0"  y2="44" stroke="currentColor" strokeWidth="1"   opacity=".4" />
      <line x1="44" y1="11" x2="11" y2="44" stroke="currentColor" strokeWidth="1"   opacity=".4" />
      <line x1="33" y1="0"  x2="0"  y2="33" stroke="currentColor" strokeWidth="1"   opacity=".4" />
    </svg>
  )
}

function ElectroGlyph() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <line x1="0"  y1="22" x2="44" y2="22" stroke="currentColor" strokeWidth="1.5" opacity=".45" />
      <circle cx="13" cy="22" r="6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="31" cy="22" r="6" stroke="currentColor" strokeWidth="1.5" />
      <line x1="13" y1="16" x2="13" y2="8"  stroke="currentColor" strokeWidth="1"   opacity=".7" />
      <line x1="31" y1="16" x2="31" y2="8"  stroke="currentColor" strokeWidth="1"   opacity=".7" />
      <line x1="10" y1="8"  x2="16" y2="8"  stroke="currentColor" strokeWidth="1"   opacity=".55" />
      <line x1="28" y1="8"  x2="34" y2="8"  stroke="currentColor" strokeWidth="1"   opacity=".55" />
    </svg>
  )
}

function PlumbRiser() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <line x1="22" y1="0"  x2="22" y2="18" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12,18 Q12,37 22,37 Q32,37 32,18" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <line x1="32" y1="37" x2="32" y2="44" stroke="currentColor" strokeWidth="1.5" />
      <line x1="8"  y1="18" x2="36" y2="18" stroke="currentColor" strokeWidth="1"   opacity=".5" />
    </svg>
  )
}

function InteriorTile() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <rect x="1"  y="1"  width="19" height="19" stroke="currentColor" strokeWidth="1" />
      <rect x="24" y="1"  width="19" height="19" stroke="currentColor" strokeWidth="1" />
      <rect x="1"  y="24" width="19" height="19" stroke="currentColor" strokeWidth="1" />
      <rect x="24" y="24" width="19" height="19" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}

function VastuMandala() {
  const spokes = Array.from({ length: 16 }, (_, i) => {
    const rad = (i * 22.5 - 90) * (Math.PI / 180)
    return {
      x2: parseFloat((22 + 18 * Math.cos(rad)).toFixed(2)),
      y2: parseFloat((22 + 18 * Math.sin(rad)).toFixed(2)),
    }
  })
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true"
      style={{ background: '#1E2227' }}>
      {spokes.map((s, i) => (
        <line key={i} x1="22" y1="22" x2={s.x2} y2={s.y2}
          stroke="#C9A84C" strokeWidth=".9" opacity=".9" />
      ))}
      <circle cx="22" cy="22" r="5"  stroke="#C9A84C" strokeWidth="1"  fill="none" />
      <circle cx="22" cy="22" r="18" stroke="#C9A84C" strokeWidth=".8" fill="none" opacity=".5" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function DimDivider({ label, animated = false }: { label: string; animated?: boolean }) {
  const INK = '#1E2227'
  return (
    <div className="flex items-center gap-4 px-6 md:px-12">
      {/* left arm */}
      <div className="flex flex-1 items-center">
        <div style={{ width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderRight: `7px solid ${INK}`, flexShrink: 0 }} />
        <div style={{ flex: 1, height: 1, background: INK }} className={animated ? 'animate-dim-line' : ''} />
        <div style={{ width: 1, height: 10, background: INK, flexShrink: 0 }} />
      </div>
      {/* label */}
      <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: INK, letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      {/* right arm */}
      <div className="flex flex-1 items-center">
        <div style={{ width: 1, height: 10, background: INK, flexShrink: 0 }} />
        <div style={{ flex: 1, height: 1, background: INK }} />
        <div style={{ width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: `7px solid ${INK}`, flexShrink: 0 }} />
      </div>
    </div>
  )
}

function SectionHeader({ clause, title }: { clause: string; title: string }) {
  return (
    <div className="space-y-1">
      <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: '#1F4E79', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {clause}
      </p>
      <h2 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 'clamp(22px,3vw,30px)', fontWeight: 700, color: '#1E2227', lineHeight: 1.2 }}>
        {title}
      </h2>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// HOMEPAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {
  const today = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })

  const titleRows: [string, string][] = [
    ['PROJECT',          'YOUR HOME'],
    ['DRG NO.',          'NS-001'],
    ['DRAWN BY',         'NIRMANSHASTRA'],
    ['CHECKED AGAINST',  'IS 456 · 1077 · 732 · 1172 · 1893'],
    ['SCALE',            '1:1 COST CERTAINTY'],
    ['DATE',             `${today}   REV A`],
  ]

  return (
    <main className="sheet-frame min-h-screen" style={{ background: '#F4F4F0' }}>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="px-6 md:px-12 pt-14 pb-12 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

        {/* Left — headline */}
        <div className="space-y-7">
          <div>
            <h1 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 'clamp(38px,5vw,56px)', fontWeight: 700, color: '#1E2227', lineHeight: 1.08, letterSpacing: '-0.01em' }}>
              Build With Certainty.
            </h1>
            <p style={{ fontFamily: 'var(--font-plex-devanagari)', fontSize: 16, color: 'rgba(30,34,39,0.5)', marginTop: 6 }}>
              निर्माणशास्त्र
            </p>
          </div>

          <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 15, color: 'rgba(30,34,39,0.72)', lineHeight: 1.7, maxWidth: 500 }}>
            India&rsquo;s first IS-code construction cost estimation platform.
            Know exact material quantities, catch contractor inflation, and build your home
            with engineering certainty — phase by phase.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/tools/vastu-pro"
              style={{ background: '#14532D', color: '#F4F4F0', fontFamily: 'var(--font-plex-mono)', fontSize: 13, padding: '11px 22px', borderRadius: 6, display: 'inline-block', textDecoration: 'none', letterSpacing: '0.02em' }}
            >
              Start Free — VastuPro
            </Link>
            <a
              href="#pricing"
              style={{ border: '1px solid #1E2227', color: '#1E2227', fontFamily: 'var(--font-plex-mono)', fontSize: 13, padding: '11px 22px', borderRadius: 6, display: 'inline-block', textDecoration: 'none', background: 'transparent', letterSpacing: '0.02em' }}
            >
              See Pricing ↓
            </a>
          </div>

          {/* Stats */}
          <div className="flex gap-10 pt-2" style={{ borderTop: '1px solid rgba(30,34,39,0.1)', paddingTop: 20 }}>
            {[['25', 'IS Codes'], ['6', 'Tools'], ['₹499', 'Per Report'], ['₹2,999', 'Bundle']].map(([val, label]) => (
              <div key={label}>
                <div style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 20, fontWeight: 500, color: '#1E2227' }}>{val}</div>
                <div style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 11, color: 'rgba(30,34,39,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Engineering title block */}
        <div className="flex justify-center lg:justify-end">
          <div
            className="hero-title-block"
            style={{ border: '1px solid #1E2227', fontFamily: 'var(--font-plex-mono)', display: 'inline-block' }}
          >
            <table style={{ borderCollapse: 'collapse', minWidth: 340 }}>
              <tbody>
                {titleRows.map(([label, value], i) => (
                  <tr key={label} style={i > 0 ? { borderTop: '1px solid #1E2227' } : {}}>
                    <td style={{ borderRight: '1px solid #1E2227', padding: '8px 14px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(30,34,39,0.55)', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                      {label}
                    </td>
                    <td style={{ padding: '8px 14px', fontSize: 13, color: '#1E2227', verticalAlign: 'top' }}>
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── DIMENSION DIVIDER ────────────────────────────────────────────── */}
      <div className="py-3">
        <DimDivider label="SHEET 01 · THE PROBLEM" animated />
      </div>

      {/* ── PROBLEM SECTION ──────────────────────────────────────────────── */}
      <section className="grid-paper px-6 md:px-12 py-14">
        <div className="max-w-7xl mx-auto space-y-10">
          <SectionHeader clause="CL. 1.0 — WHY BUDGETS FAIL" title="The three problems no contractor will tell you" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PROBLEMS.map((p) => (
              <div key={p.no} style={{ border: '1px solid #1E2227', padding: '24px', background: '#F4F4F0', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 10, right: 14, fontFamily: 'var(--font-plex-mono)', fontSize: 56, color: 'rgba(30,34,39,0.05)', fontWeight: 500, lineHeight: 1, userSelect: 'none' }}>
                  {p.no}
                </div>
                <h3 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 18, fontWeight: 600, color: '#1E2227', marginBottom: 12, lineHeight: 1.3 }}>
                  {p.heading}
                </h3>
                <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 14, color: 'rgba(30,34,39,0.68)', lineHeight: 1.7 }}>
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DIMENSION DIVIDER ────────────────────────────────────────────── */}
      <div className="py-3">
        <DimDivider label="SHEET 02 · 6 TOOLS · 1 PLATFORM" />
      </div>

      {/* ── TOOLS SECTION ────────────────────────────────────────────────── */}
      <section className="px-6 md:px-12 py-14">
        <div className="max-w-7xl mx-auto space-y-10">
          <SectionHeader clause="CL. 2.0 — SCOPE OF TOOLS" title="Every phase of your construction, estimated" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {TOOLS.map((tool) => (
              <Link key={tool.name} href={tool.href} style={{ textDecoration: 'none' }}>
                <article
                  style={{
                    border: `1px solid ${tool.free ? '#C9A84C' : '#1E2227'}`,
                    padding: '20px',
                    background: '#F4F4F0',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    minHeight: 220,
                    cursor: 'pointer',
                  }}
                >
                  {/* Phase watermark */}
                  <span style={{ position: 'absolute', top: 6, right: 12, fontFamily: 'var(--font-plex-mono)', fontSize: 52, color: 'rgba(30,34,39,0.05)', fontWeight: 500, lineHeight: 1, userSelect: 'none' }}>
                    {tool.phase}
                  </span>

                  {/* Motif */}
                  <div style={{ color: tool.free ? '#C9A84C' : '#1E2227', width: 44, height: 44, flexShrink: 0 }}>
                    {tool.phase === 'P0' && <VastuMandala />}
                    {tool.phase === 'P1' && <StructoHatch />}
                    {tool.phase === 'P2' && <MasonHatch />}
                    {tool.phase === 'P3' && <ElectroGlyph />}
                    {tool.phase === 'P4' && <PlumbRiser />}
                    {tool.phase === 'P5' && <InteriorTile />}
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: '#1F4E79', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
                      {tool.tagline}
                    </p>
                    <h3 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 20, fontWeight: 700, color: '#1E2227', marginBottom: 8 }}>
                      {tool.name}
                    </h3>
                    <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 13, color: 'rgba(30,34,39,0.63)', lineHeight: 1.65 }}>
                      {tool.desc}
                    </p>
                  </div>

                  {/* Price chip */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontFamily: 'var(--font-plex-mono)',
                      fontSize: 12,
                      padding: '3px 9px',
                      border: `1px solid ${tool.free ? '#14532D' : '#1F4E79'}`,
                      color: tool.free ? '#14532D' : '#1F4E79',
                      letterSpacing: '0.04em',
                    }}>
                      {tool.price}
                    </span>
                    <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'rgba(30,34,39,0.35)' }}>
                      {tool.phase} ›
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>

          {/* Bundle strip */}
          <div style={{ border: '1px solid #1E2227', padding: '18px 24px', background: '#F4F4F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: '#1F4E79', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
                COMPLETE BUNDLE — ALL 5 PAID TOOLS
              </p>
              <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 14, color: 'rgba(30,34,39,0.68)' }}>
                StructoPro · MasonPro · ElectroPro · PlumbPro · InteriorPro
                {' '}&mdash; saves{' '}
                <span style={{ fontFamily: 'var(--font-plex-mono)' }}>₹1,496</span> vs buying separately
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 28, fontWeight: 500, color: '#1E2227' }}>₹2,999</span>
              <Link
                href="/tools/structopro"
                style={{ background: '#8C3A22', color: '#F4F4F0', fontFamily: 'var(--font-plex-mono)', fontSize: 13, padding: '10px 20px', borderRadius: 6, textDecoration: 'none', whiteSpace: 'nowrap' }}
              >
                Get Bundle →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── DIMENSION DIVIDER ────────────────────────────────────────────── */}
      <div className="grid-paper py-3">
        <DimDivider label="SHEET 03 · 4 STEPS TO CERTAINTY" />
      </div>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="grid-paper px-6 md:px-12 py-14">
        <div className="max-w-7xl mx-auto space-y-10">
          <SectionHeader clause="CL. 3.0 — PROCESS" title="How NirmanShastra works" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((step) => (
              <div key={step.rev} style={{ borderTop: '2px solid #1F4E79', paddingTop: 16 }}>
                <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: '#1F4E79', letterSpacing: '0.06em', marginBottom: 10 }}>
                  {step.rev}
                </p>
                <h3 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 17, fontWeight: 600, color: '#1E2227', marginBottom: 10, lineHeight: 1.3 }}>
                  {step.heading}
                </h3>
                <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 13, color: 'rgba(30,34,39,0.65)', lineHeight: 1.7 }}>
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DIMENSION DIVIDER ────────────────────────────────────────────── */}
      <div className="py-3">
        <DimDivider label="CHECKED AGAINST 25 IS CODES" />
      </div>

      {/* ── IS CODE TRUST STRIP ──────────────────────────────────────────── */}
      <section className="px-6 md:px-12 py-12">
        <div className="max-w-7xl mx-auto space-y-8">
          <SectionHeader clause="CL. 4.0 — CODE COMPLIANCE" title="Every calculation backed by Bureau of Indian Standards" />

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {IS_CODES.map((code) => (
              <span
                key={code}
                style={{
                  fontFamily: 'var(--font-plex-mono)',
                  fontSize: 11,
                  padding: '4px 10px',
                  border: '1px solid #1F4E79',
                  color: '#1F4E79',
                  letterSpacing: '0.04em',
                  background: 'transparent',
                  display: 'inline-block',
                }}
              >
                {code}
              </span>
            ))}
          </div>

          <div style={{ border: '1px solid rgba(31,78,121,0.25)', padding: '14px 18px', background: 'rgba(31,78,121,0.04)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 14, color: '#1F4E79', flexShrink: 0 }}>ⓘ</span>
            <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 13, color: 'rgba(30,34,39,0.68)', lineHeight: 1.65, margin: 0 }}>
              IS code values in NirmanShastra are verified against BIS publications and locked at source.
              Every material quantity, mix ratio, and structural parameter traces back to a specific IS clause.
              M20 is <span style={{ fontFamily: 'var(--font-plex-mono)' }}>1:1.5:3</span> (not{' '}
              <span style={{ fontFamily: 'var(--font-plex-mono)' }}>1:2:4</span>). Dry volume factor for
              concrete is <span style={{ fontFamily: 'var(--font-plex-mono)' }}>1.54</span>. For mortar:{' '}
              <span style={{ fontFamily: 'var(--font-plex-mono)' }}>1.1</span>. These are not negotiable.
            </p>
          </div>
        </div>
      </section>

      {/* ── DIMENSION DIVIDER ────────────────────────────────────────────── */}
      <div className="grid-paper py-3">
        <DimDivider label="₹499 / REPORT · ₹2,999 / BUNDLE" />
      </div>

      {/* ── PRICING SECTION ──────────────────────────────────────────────── */}
      <section id="pricing" className="grid-paper px-6 md:px-12 py-14">
        <div className="max-w-7xl mx-auto space-y-10">
          <SectionHeader clause="CL. 5.0 — PRICING · LAUNCH 2026" title="Simple, report-by-report pricing" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Tier 1 — VastuPro FREE */}
            <div style={{ border: '1px solid #14532D', padding: '28px', background: '#F4F4F0', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: '#14532D', letterSpacing: '0.07em', marginBottom: 6 }}>PHASE 0 — LEAD MAGNET</p>
                <h3 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 22, fontWeight: 700, color: '#1E2227', marginBottom: 6 }}>VastuPro</h3>
                <div style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 40, fontWeight: 500, color: '#14532D', lineHeight: 1 }}>FREE</div>
                <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 12, color: 'rgba(30,34,39,0.5)', marginTop: 4 }}>forever · no payment required</p>
              </div>
              <ul style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  'Vastu compliance analysis',
                  '33 room types supported',
                  '16-zone Vastu Mandala',
                  'Score + remedies',
                  'Full PDF report',
                  'IS 4326:1993 seismic warnings',
                ].map(f => (
                  <li key={f} style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 13, color: 'rgba(30,34,39,0.68)', display: 'flex', gap: 8 }}>
                    <span style={{ color: '#14532D', fontWeight: 700, flexShrink: 0 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link
                href="/tools/vastu-pro"
                style={{ display: 'block', textAlign: 'center', border: '1px solid #14532D', color: '#14532D', fontFamily: 'var(--font-plex-mono)', fontSize: 13, padding: '11px', borderRadius: 6, textDecoration: 'none', letterSpacing: '0.03em' }}
              >
                Start Free →
              </Link>
            </div>

            {/* Tier 2 — Per Report ₹499 */}
            <div style={{ border: '1px solid #1E2227', padding: '28px', background: '#F4F4F0', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: '#1F4E79', letterSpacing: '0.07em', marginBottom: 6 }}>PER REPORT · ANY PAID TOOL</p>
                <h3 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 22, fontWeight: 700, color: '#1E2227', marginBottom: 6 }}>Single Tool</h3>
                <div style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 40, fontWeight: 500, color: '#1E2227', lineHeight: 1 }}>₹499</div>
                <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 12, color: 'rgba(30,34,39,0.5)', marginTop: 4 }}>per report · StructoPro to InteriorPro</p>
              </div>
              <ul style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  'Exact material quantities',
                  'Itemised cost breakdown',
                  'IS code compliance panel',
                  'CPWD labour cost calculator',
                  'Contractor quote comparison',
                  'PDF report with SVG drawings',
                ].map(f => (
                  <li key={f} style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 13, color: 'rgba(30,34,39,0.68)', display: 'flex', gap: 8 }}>
                    <span style={{ color: '#1F4E79', fontWeight: 700, flexShrink: 0 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link
                href="/tools/structopro"
                style={{ display: 'block', textAlign: 'center', background: '#8C3A22', color: '#F4F4F0', fontFamily: 'var(--font-plex-mono)', fontSize: 13, padding: '11px', borderRadius: 6, textDecoration: 'none', letterSpacing: '0.03em' }}
              >
                Start with StructoPro →
              </Link>
            </div>

            {/* Tier 3 — Bundle ₹2,999 */}
            <div style={{ border: '2px solid #1E2227', padding: '28px', background: '#F4F4F0', display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>
              <div style={{ position: 'absolute', top: -1, right: 18, background: '#8C3A22', color: '#F4F4F0', fontFamily: 'var(--font-plex-mono)', fontSize: 10, padding: '3px 10px', letterSpacing: '0.05em' }}>
                BEST VALUE
              </div>
              <div>
                <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: '#8C3A22', letterSpacing: '0.07em', marginBottom: 6 }}>COMPLETE BUNDLE · ALL 5 PAID TOOLS</p>
                <h3 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 22, fontWeight: 700, color: '#1E2227', marginBottom: 6 }}>Full Platform</h3>
                <div style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 40, fontWeight: 500, color: '#1E2227', lineHeight: 1 }}>₹2,999</div>
                <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 12, color: 'rgba(30,34,39,0.5)', marginTop: 4 }}>
                  saves <span style={{ fontFamily: 'var(--font-plex-mono)' }}>₹1,496</span> vs buying individually
                </p>
              </div>
              <ul style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  'StructoPro + MasonPro',
                  'ElectroPro + PlumbPro',
                  'InteriorPro',
                  'All quantities across all phases',
                  'Cross-phase contractor comparison',
                  'Grand Total Report (₹999) free',
                ].map(f => (
                  <li key={f} style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 13, color: 'rgba(30,34,39,0.68)', display: 'flex', gap: 8 }}>
                    <span style={{ color: '#8C3A22', fontWeight: 700, flexShrink: 0 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link
                href="/tools/structopro"
                style={{ display: 'block', textAlign: 'center', background: '#8C3A22', color: '#F4F4F0', fontFamily: 'var(--font-plex-mono)', fontSize: 13, padding: '11px', borderRadius: 6, textDecoration: 'none', letterSpacing: '0.03em' }}
              >
                Get Bundle →
              </Link>
            </div>
          </div>

          {/* Fine print */}
          <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'rgba(30,34,39,0.4)', letterSpacing: '0.03em' }}>
            Launch pricing valid Jun 2026. Prices increase to ₹999 / ₹799 / ₹699 from Month 4. Never discount below launch price.
          </p>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid #1E2227', background: '#1E2227', marginTop: 0 }}>
        {/* Title block grid */}
        <div className="max-w-7xl mx-auto" style={{ borderLeft: '1px solid rgba(244,244,240,0.1)', borderRight: '1px solid rgba(244,244,240,0.1)' }}>
          <div className="grid grid-cols-2 md:grid-cols-4" style={{ borderBottom: '1px solid rgba(244,244,240,0.1)' }}>

            {/* Tools column */}
            <div style={{ padding: '28px 24px', borderRight: '1px solid rgba(244,244,240,0.1)' }}>
              <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, color: 'rgba(244,244,240,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>TOOLS</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {TOOLS.map(t => (
                  <Link key={t.name} href={t.href} style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 13, color: 'rgba(244,244,240,0.65)', textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {t.name}
                    <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: t.free ? '#14532D' : 'rgba(244,244,240,0.35)' }}>
                      {t.free ? 'FREE' : '₹499'}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Company column */}
            <div style={{ padding: '28px 24px', borderRight: '1px solid rgba(244,244,240,0.1)' }}>
              <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, color: 'rgba(244,244,240,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>COMPANY</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[['About', '#'], ['Contact', '#'], ['Blog', '#'], ['Careers', '#']].map(([label, href]) => (
                  <a key={label} href={href} style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 13, color: 'rgba(244,244,240,0.65)', textDecoration: 'none' }}>{label}</a>
                ))}
              </div>
            </div>

            {/* Legal column */}
            <div style={{ padding: '28px 24px', borderRight: '1px solid rgba(244,244,240,0.1)' }}>
              <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, color: 'rgba(244,244,240,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>LEGAL</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[['Privacy Policy', '#'], ['Terms of Use', '#'], ['Disclaimer', '#'], ['IS Codes Used', '#']].map(([label, href]) => (
                  <a key={label} href={href} style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 13, color: 'rgba(244,244,240,0.65)', textDecoration: 'none' }}>{label}</a>
                ))}
              </div>
            </div>

            {/* DRG block — the signature title block cell */}
            <div style={{ padding: '28px 24px' }}>
              <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, color: 'rgba(244,244,240,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>DRG BLOCK</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  ['PROJECT', 'NIRMANSHASTRA'],
                  ['DRG NO.', 'NS-001'],
                  ['DATE', today],
                  ['REV', 'A'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, color: 'rgba(244,244,240,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase', minWidth: 58, flexShrink: 0 }}>{k}</span>
                    <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'rgba(244,244,240,0.8)' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom strip */}
          <div style={{ padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <span style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 14, color: '#F4F4F0', fontWeight: 600 }}>NirmanShastra</span>
              <span style={{ fontFamily: 'var(--font-plex-devanagari)', fontSize: 11, color: 'rgba(244,244,240,0.4)', marginLeft: 8 }}>निर्माणशास्त्र</span>
            </div>
            <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: 'rgba(244,244,240,0.35)', letterSpacing: '0.04em' }}>
              Estimates are for budgeting reference only. Not for structural approval without licensed engineer.
            </p>
            <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: 'rgba(244,244,240,0.35)', letterSpacing: '0.04em' }}>
              © {new Date().getFullYear()} NirmanShastra
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
