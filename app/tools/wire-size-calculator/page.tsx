'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  CIRCUIT_SPECS,
  CIRCUIT_ORDER,
  calculate,
  type CircuitType,
} from './wire-size-engine'

// ── Design tokens — matte dark system, matches the tool pages (brick / water-tank / bbs) ──
const MONO = 'var(--font-plex-mono)'
const SANS = 'var(--font-plex-sans)'
const SERIF = 'var(--font-plex-serif)'
const INK = '#F4F4F0'
const INK_65 = 'rgba(244,244,240,0.65)'
const INK_45 = 'rgba(244,244,240,0.45)'
const INK_35 = 'rgba(244,244,240,0.35)'
const SURF = '#171717'
const BSUB = 'rgba(255,255,255,0.08)'
const BLUEPRINT = '#1F4E79'
const OXIDE = '#8C3A22'

// ── Small presentational helpers ───────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: MONO, fontSize: 11, color: BLUEPRINT, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
      {children}
    </p>
  )
}

function ISChip({ code }: { code: string }) {
  return (
    <span style={{ fontFamily: MONO, fontSize: 10, color: INK_65, border: `1px solid ${BLUEPRINT}`, borderRadius: 2, padding: '3px 7px', letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
      {code}
    </span>
  )
}

function num(n: number, dp: number) {
  return n.toLocaleString('en-IN', { minimumFractionDigits: dp, maximumFractionDigits: dp })
}

// ── Page ────────────────────────────────────────────────────────────────────────

export default function WireSizeCalculatorPage() {
  const [circuit, setCircuit] = useState<CircuitType>('lighting')

  const result = useMemo(() => calculate(circuit), [circuit])
  const spec = CIRCUIT_SPECS[circuit]

  // Field styling
  const labelStyle: React.CSSProperties = { fontFamily: MONO, fontSize: 10, color: INK_45, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }
  const fieldStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    background: 'rgba(244,244,240,0.06)',
    border: `1px solid ${BSUB}`,
    color: INK,
    padding: '11px 12px',
    fontSize: 14,
    fontFamily: MONO,
    borderRadius: 6,
    outline: 'none',
  }

  return (
    <main className="sheet-frame" style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      <section className="px-6 md:px-16 lg:px-24 pt-16 pb-10">
        <div style={{ maxWidth: 860 }}>
          <Eyebrow>Free Calculator · IS 732:2019 · No Login</Eyebrow>
          <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(34px,5vw,52px)', fontWeight: 700, color: INK, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 20 }}>
            Wire Size Calculator
          </h1>
          <p style={{ fontFamily: SANS, fontSize: 17, color: INK_65, lineHeight: 1.7, maxWidth: 720 }}>
            Pick the circuit and get the right cable gauge before you buy the wire. Indian wiring is
            sized by the <strong style={{ color: INK, fontWeight: 600 }}>role of the circuit</strong>,
            not by guessing wattage — so this tool uses the same categorical table as our ElectroPro
            estimator: the{' '}
            <strong style={{ color: INK, fontWeight: 600 }}>IS 732:2019 Cl 6.2 minimum cross-sections</strong>{' '}
            of 1.5, 2.5, 4.0, 6.0 and 10.0 sqmm. Permanently free — nothing to unlock, no sign-in.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 22 }}>
            {['IS 732:2019', 'IS 694:2010', 'IS 3043:2018'].map((c) => (
              <ISChip key={c} code={c} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CALCULATOR ────────────────────────────────────────────────────────── */}
      <section className="px-6 md:px-16 lg:px-24 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ alignItems: 'start' }}>

          {/* INPUT CARD */}
          <div style={{ background: SURF, border: `1px solid ${BSUB}`, borderRadius: 2, padding: '28px' }}>
            <p style={{ fontFamily: MONO, fontSize: 10, color: INK_35, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>
              Circuit Type
            </p>

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle} htmlFor="ws-circuit">What are you wiring?</label>
              <select
                id="ws-circuit"
                value={circuit}
                onChange={(e) => setCircuit(e.target.value as CircuitType)}
                style={{ ...fieldStyle, appearance: 'none' }}
              >
                {CIRCUIT_ORDER.map((c) => (
                  <option key={c} value={c} style={{ background: '#1a1a1a', color: '#fff' }}>
                    {CIRCUIT_SPECS[c].use} — {CIRCUIT_SPECS[c].label}
                  </option>
                ))}
              </select>
              <p style={{ fontFamily: SANS, fontSize: 12.5, color: INK_45, lineHeight: 1.6, marginTop: 10 }}>
                {spec.examples}
              </p>
            </div>

            {/* Circuit type list — visual reference */}
            <p style={{ fontFamily: MONO, fontSize: 10, color: INK_35, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 22, marginBottom: 10 }}>
              All five categories
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {CIRCUIT_ORDER.map((c) => {
                const s = CIRCUIT_SPECS[c]
                const active = c === circuit
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCircuit(c)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      textAlign: 'left',
                      cursor: 'pointer',
                      background: active ? 'rgba(31,78,121,0.18)' : 'rgba(244,244,240,0.03)',
                      border: `1px solid ${active ? BLUEPRINT : BSUB}`,
                      borderRadius: 2,
                      padding: '10px 12px',
                      color: INK,
                    }}
                  >
                    <span style={{ fontFamily: SANS, fontSize: 13, color: active ? INK : INK_65 }}>{s.use}</span>
                    <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color: active ? INK : INK_45, whiteSpace: 'nowrap' }}>{s.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* RESULT CARD */}
          <div style={{ background: SURF, border: `1px solid ${BSUB}`, borderRadius: 2, padding: '28px' }}>
            <p style={{ fontFamily: MONO, fontSize: 10, color: INK_35, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              Minimum Wire Size · {spec.use}
            </p>

            <div style={{ fontFamily: MONO, fontSize: 'clamp(48px,7vw,72px)', fontWeight: 700, color: INK, lineHeight: 1, marginBottom: 4 }}>
              {num(result.sqmm, 1)}
              <span style={{ fontSize: 22, fontWeight: 500, color: INK_45, marginLeft: 8 }}>sqmm</span>
            </div>
            <p style={{ fontFamily: MONO, fontSize: 13, color: INK_35, marginBottom: 24 }}>
              minimum copper cross-section · {result.isCode}
            </p>

            {/* Figure pills — IS clause + typical MCB */}
            <div className="grid grid-cols-2 gap-4" style={{ marginBottom: 24 }}>
              <div style={{ border: `1px solid ${BSUB}`, borderRadius: 2, padding: '14px 16px' }}>
                <p style={{ fontFamily: MONO, fontSize: 9, color: INK_35, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Code clause</p>
                <p style={{ fontFamily: MONO, fontSize: 15, fontWeight: 600, color: BLUEPRINT }}>{result.isCode}</p>
              </div>
              <div style={{ border: `1px solid ${BSUB}`, borderRadius: 2, padding: '14px 16px' }}>
                <p style={{ fontFamily: MONO, fontSize: 9, color: INK_35, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Typical protection</p>
                <p style={{ fontFamily: MONO, fontSize: 15, fontWeight: 600, color: INK }}>{result.typicalMCB}</p>
              </div>
            </div>

            {/* Undersize warning — Marking-Yellow advisory */}
            <p style={{ fontFamily: MONO, fontSize: 10, color: INK_35, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
              If wired undersized
            </p>
            <div style={{ border: `1px solid rgba(217,154,6,0.5)`, background: 'rgba(217,154,6,0.08)', borderRadius: 2, padding: '14px 16px' }}>
              <p style={{ fontFamily: SANS, fontSize: 13.5, color: INK_65, lineHeight: 1.65 }}>
                <span style={{ color: '#D99A06', fontWeight: 600 }}>⚠ </span>
                {result.undersizedRisk}
              </p>
            </div>

            <p style={{ fontFamily: SANS, fontSize: 11.5, color: INK_35, lineHeight: 1.6, marginTop: 18 }}>
              This is the <strong style={{ color: INK_65 }}>minimum</strong> cross-section, not a
              recommendation. Upsize to the next gauge for long runs (&gt; 20 m), bunched conduits, or
              high ambient temperature, where voltage drop and derating apply.
            </p>
          </div>
        </div>

        {/* ── CTA — ElectroPro ──────────────────────────────────────────────────── */}
        <div
          style={{
            marginTop: 28,
            background: SURF,
            border: `1px solid ${OXIDE}`,
            borderRadius: 2,
            padding: '28px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 20,
          }}
        >
          <div style={{ flex: 1, minWidth: 260 }}>
            <p style={{ fontFamily: MONO, fontSize: 10, color: 'rgba(200,120,90,0.95)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
              Need the full electrical estimate?
            </p>
            <p style={{ fontFamily: SANS, fontSize: 15.5, color: INK_65, lineHeight: 1.6, maxWidth: 620 }}>
              Wire size is one line of a wiring job. Get the whole thing — a DB panel schedule with MCB
              and RCCB ratings, circuit counts, a full wire schedule in metres by gauge, load analysis
              and a contractor-quote comparison — with ElectroPro, the complete IS 732:2019 electrical
              estimate.
            </p>
          </div>
          <Link
            href="/tools/electropro"
            className="btn-3d"
            style={{
              fontFamily: SANS,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: '0.02em',
              padding: '13px 26px',
              borderRadius: 2,
              background: OXIDE,
              color: INK,
              textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.15)',
              whiteSpace: 'nowrap',
            }}
          >
            Open ElectroPro →
          </Link>
        </div>
      </section>

      {/* ── WIRE SIZE REFERENCE TABLE ───────────────────────────────────────────── */}
      <section className="grid-paper px-6 md:px-16 lg:px-24 py-16" style={{ borderTop: `1px solid ${BSUB}` }}>
        <Eyebrow>Reference · Minimum Wire Sizes</Eyebrow>
        <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(24px,3vw,32px)', fontWeight: 600, color: INK, marginBottom: 20 }}>
          Wire size by circuit type
        </h2>
        <div style={{ overflowX: 'auto', border: `1px solid ${BSUB}`, borderRadius: 2, background: SURF }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: MONO, fontSize: 12.5, minWidth: 620 }}>
            <thead>
              <tr>
                {['Circuit', 'Typical protection', 'IS clause', 'Wire size'].map((h, i) => (
                  <th key={h} style={{ textAlign: i === 3 ? 'center' : 'left', fontFamily: MONO, fontSize: 10, color: INK_45, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 14px', borderBottom: `1px solid ${BSUB}`, whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CIRCUIT_ORDER.map((c, i) => {
                const s = CIRCUIT_SPECS[c]
                return (
                  <tr key={c} style={{ background: i % 2 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                    <td style={{ padding: '10px 14px', color: BLUEPRINT }}>{s.use}</td>
                    <td style={{ padding: '10px 14px', color: INK_65 }}>{s.typicalMCB}</td>
                    <td style={{ padding: '10px 14px', color: INK_65 }}>{s.isCode}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: INK }}>{s.label}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p style={{ fontFamily: SANS, fontSize: 12, color: INK_35, lineHeight: 1.6, marginTop: 14, maxWidth: 720 }}>
          These are the IS 732:2019 Cl 6.2 minimum copper cross-sections, the same locked table used by
          NirmanShastra&rsquo;s paid ElectroPro tool. They are minimums — upsize for long runs, bunched
          conduits, or high ambient temperature.
        </p>
      </section>

      {/* ── WRITTEN CONTENT ─────────────────────────────────────────────────────── */}
      <article className="px-6 md:px-16 lg:px-24 py-16" style={{ maxWidth: 820 }}>

        <Prose heading="Why the circuit type — not just wattage — decides the wire">
          <p>
            It is tempting to think wire sizing is one sum: take the appliance wattage, divide by
            voltage for the current, and read off a gauge. Real Indian residential wiring does not work
            that way, and neither does the code. IS 732:2019 sets a{' '}
            <strong style={{ color: INK }}>minimum cross-section for each category of circuit</strong> —
            lighting, sockets, dedicated appliance points, feeders — because the category already
            encodes what matters: the expected load, how many points share the run, the rating of the
            protective device in front of it, and the safety margin the standard demands.
          </p>
          <p>
            A lighting circuit and a fridge socket might, on paper, pull similar wattage. But a socket
            has to survive whatever someone plugs into it next year — an iron, a heater, a vacuum — so
            the code floors it at 2.5 sqmm behind a 16A MCB, while lighting stays at 1.5 sqmm behind a
            6A. The wire is matched to the <em>protective device and the worst-case role</em>, not to
            today&rsquo;s bulb. That is why this tool asks what you are wiring, and returns a category
            minimum, exactly as our ElectroPro estimator does.
          </p>
          <p>
            The other half of the answer is the <strong style={{ color: INK }}>protective device</strong>.
            A wire and its MCB are a pair: the MCB must trip before the cable overheats. Size the wire
            from the circuit&rsquo;s role and you get a conductor that matches its breaker. Size it from a
            single appliance&rsquo;s wattage and you can end up with a cable that its own MCB will never
            protect.
          </p>
        </Prose>

        <Prose heading="What happens if the wire is undersized">
          <p>
            An undersized conductor carries more current than it is rated to. Copper has resistance, so
            that current turns into heat inside the wire — and because the cable is buried in a wall
            chase or bunched in a conduit, the heat cannot escape. Three things follow, in order:
          </p>
          <ul>
            <li>
              <span style={{ fontFamily: MONO, color: INK }}>The insulation cooks.</span> PVC insulation
              degrades with sustained heat. Over months it hardens, cracks, and stops insulating — long
              before anything visibly fails.
            </li>
            <li>
              <span style={{ fontFamily: MONO, color: INK }}>Nuisance tripping — or worse, none.</span> If
              the MCB is correctly rated for the load it trips repeatedly; if someone &ldquo;fixes&rdquo;
              that by fitting a bigger MCB, the wire is now unprotected and can run hot indefinitely.
            </li>
            <li>
              <span style={{ fontFamily: MONO, color: INK }}>Char, then fire.</span> The hottest point —
              usually a socket terminal or a joint — browns, then chars, then ignites the surrounding
              material. Most residential electrical fires trace back to an undersized or loose conductor.
            </li>
          </ul>
          <p>
            IS 694:2010 adds a second trap: counterfeit wire. A cable stamped &ldquo;2.5 sqmm&rdquo; with
            a thin copper core is effectively undersized from the day it is laid. Insist on ISI-marked
            wire and verify the core, not just the print on the sheath.
          </p>
        </Prose>

        <Prose heading="Worked example — a 2 kW geyser">
          <p>
            Say you are wiring a <strong style={{ color: INK }}>2,000 W storage geyser</strong> in a
            bathroom. A naive wattage sum says: 2000 W ÷ 230 V ≈ 8.7 A, and a 2.5 sqmm wire is rated
            comfortably above that — so 2.5 sqmm &ldquo;works.&rdquo; The code says otherwise.
          </p>
          <p style={{ fontFamily: MONO, color: INK, fontSize: 14.5, background: SURF, border: `1px solid ${BSUB}`, borderRadius: 2, padding: '14px 16px' }}>
            AC / Geyser (2 kW+) → 4.0 sqmm minimum (IS 732:2019 Cl 6.2), dedicated 20A circuit
          </p>
          <p>
            A geyser is a continuous, high-current load on its own dedicated circuit, and in a bathroom
            it must sit behind a 30 mA RCCB per IS 3043:2018. IS 732:2019 floors that dedicated appliance
            circuit at <strong style={{ color: INK }}>4.0 sqmm</strong> — not because 8.7 A needs 4.0
            sqmm in isolation, but because the category (a 2 kW+ point drawing near-continuous current,
            protected by a 20A MCB, often on a long run to the DB) demands that margin. Pick
            &ldquo;AC / Geyser&rdquo; above and the tool returns exactly this: 4.0 sqmm, the same figure
            ElectroPro puts on its DB schedule.
          </p>
        </Prose>

        {/* Disclaimer note */}
        <p style={{ fontFamily: SANS, fontSize: 12.5, color: INK_35, lineHeight: 1.7, marginTop: 8, borderTop: `1px solid ${BSUB}`, paddingTop: 18 }}>
          Schematic for estimation reference only. Sizes are the IS 732:2019 Cl 6.2 minimum copper
          cross-sections by circuit category (1.5 / 2.5 / 4.0 / 6.0 / 10.0 sqmm), shared with
          NirmanShastra&rsquo;s ElectroPro tool. Minimums only — long runs, bunched conduits, high
          ambient temperature, aluminium conductors, and voltage-drop limits all require upsizing.
          All electrical work must be executed and certified by a Class B licensed electrician
          (IS 732:2019 Cl 5). Not a substitute for a designed load schedule.
        </p>
      </article>
    </main>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────────

function Prose({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="bbs-prose" style={{ marginBottom: 40 }}>
      <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(22px,2.6vw,28px)', fontWeight: 600, color: INK, lineHeight: 1.25, marginBottom: 14 }}>
        {heading}
      </h2>
      <div style={{ fontFamily: SANS, fontSize: 16, color: INK_65, lineHeight: 1.8 }}>
        {children}
      </div>
    </section>
  )
}
