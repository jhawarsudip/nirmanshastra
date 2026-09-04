'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  WATER_DEMAND_LPCD,
  TANK_RATIO,
  STANDARD_TANK_SIZES,
  calculate,
  type WaterSource,
} from './water-tank-engine'

// ── Design tokens — matte dark system, matches the tool pages (plumbpro / bbs) ──
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

const SOURCES: { value: WaterSource; label: string; lpcd: number }[] = [
  { value: 'municipal', label: 'Municipal supply', lpcd: WATER_DEMAND_LPCD.municipal },
  { value: 'borewell', label: 'Borewell / own source', lpcd: WATER_DEMAND_LPCD.borewell },
]

// ── Page ────────────────────────────────────────────────────────────────────────

export default function WaterTankSizeCalculatorPage() {
  const [occupants, setOccupants] = useState<string>('8')
  const [waterSource, setWaterSource] = useState<WaterSource>('municipal')
  const [storageDays, setStorageDays] = useState<string>('1')

  const occ = Math.max(0, Math.floor(parseFloat(occupants || '0') || 0))
  const days = Math.max(1, Math.floor(parseFloat(storageDays || '1') || 1))

  const result = useMemo(
    () => calculate({ occupants: occ, waterSource, storageDays: days }),
    [occ, waterSource, days],
  )

  const valid = occ > 0

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
          <Eyebrow>Free Calculator · IS 1172:1993 · No Login</Eyebrow>
          <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(34px,5vw,52px)', fontWeight: 700, color: INK, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 20 }}>
            Water Tank Size Calculator
          </h1>
          <p style={{ fontFamily: SANS, fontSize: 17, color: INK_65, lineHeight: 1.7, maxWidth: 720 }}>
            Size a home water tank the way the code does. Enter how many people live in the house, the water
            source, and how many days of storage you need — the tool applies the IS 1172:1993 per-capita demand
            and the <strong style={{ color: INK, fontWeight: 600 }}>two-thirds-of-a-day storage rule</strong>, then
            rounds up to the nearest <strong style={{ color: INK, fontWeight: 600 }}>standard tank size</strong> you
            can actually buy. Permanently free — nothing to unlock, no sign-in.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 22 }}>
            {['IS 1172:1993', 'IS 12701', 'NBC 2016 Part 9'].map((c) => (
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
              Household Details
            </p>

            {/* Occupants */}
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle} htmlFor="wt-occ">Number of occupants</label>
              <input
                id="wt-occ"
                type="number"
                inputMode="numeric"
                min={1}
                value={occupants}
                onChange={(e) => setOccupants(e.target.value)}
                placeholder="0"
                style={fieldStyle}
              />
              <p style={{ fontFamily: SANS, fontSize: 12.5, color: INK_45, lineHeight: 1.6, marginTop: 10 }}>
                Everyone who lives in the house full-time. Enter the real head-count — do not derive it from the
                number of bathrooms.
              </p>
            </div>

            {/* Water source */}
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle} htmlFor="wt-src">Water source</label>
              <select
                id="wt-src"
                value={waterSource}
                onChange={(e) => setWaterSource(e.target.value as WaterSource)}
                style={{ ...fieldStyle, appearance: 'none' }}
              >
                {SOURCES.map((s) => (
                  <option key={s.value} value={s.value} style={{ background: '#1a1a1a', color: '#fff' }}>
                    {s.label} — {s.lpcd} LPCD
                  </option>
                ))}
              </select>
              <p style={{ fontFamily: SANS, fontSize: 12.5, color: INK_45, lineHeight: 1.6, marginTop: 10 }}>
                IS 1172:1993 sets 135 litres/person/day for municipal supply and 150 for a private borewell.
              </p>
            </div>

            {/* Storage days */}
            <div>
              <label style={labelStyle} htmlFor="wt-days">Days of storage needed</label>
              <input
                id="wt-days"
                type="number"
                inputMode="numeric"
                min={1}
                value={storageDays}
                onChange={(e) => setStorageDays(e.target.value)}
                placeholder="1"
                style={{ ...fieldStyle, maxWidth: 160 }}
              />
              <p style={{ fontFamily: SANS, fontSize: 12.5, color: INK_45, lineHeight: 1.6, marginTop: 10 }}>
                Leave at 1 for a daily, reliable supply. Increase it in areas where water arrives only every
                second or third day so the tank carries you through the gap.
              </p>
            </div>
          </div>

          {/* RESULT CARD */}
          <div style={{ background: SURF, border: `1px solid ${BSUB}`, borderRadius: 2, padding: '28px' }}>
            <p style={{ fontFamily: MONO, fontSize: 10, color: INK_35, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              Recommended Tank Size
            </p>

            {valid ? (
              <>
                {result.nearestTankL !== null ? (
                  <div style={{ fontFamily: MONO, fontSize: 'clamp(48px,7vw,72px)', fontWeight: 700, color: INK, lineHeight: 1, marginBottom: 4 }}>
                    {num(result.nearestTankL, 0)}
                    <span style={{ fontSize: 22, fontWeight: 500, color: INK_45, marginLeft: 8 }}>L</span>
                  </div>
                ) : (
                  <div style={{ fontFamily: MONO, fontSize: 'clamp(28px,4vw,40px)', fontWeight: 700, color: INK, lineHeight: 1.1, marginBottom: 4 }}>
                    Multiple tanks
                  </div>
                )}
                <p style={{ fontFamily: MONO, fontSize: 13, color: INK_35, marginBottom: 24 }}>
                  {result.nearestTankL !== null
                    ? `nearest standard size ≥ ${num(result.totalStorageL, 0)} L required`
                    : `requirement ${num(result.totalStorageL, 0)} L exceeds the largest single ${num(STANDARD_TANK_SIZES[STANDARD_TANK_SIZES.length - 1], 0)} L tank — split across tanks`}
                </p>

                {/* Figure pills */}
                <div className="grid grid-cols-2 gap-4" style={{ marginBottom: 24 }}>
                  <div style={{ border: `1px solid ${BSUB}`, borderRadius: 2, padding: '14px 16px' }}>
                    <p style={{ fontFamily: MONO, fontSize: 9, color: INK_35, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Daily demand</p>
                    <p style={{ fontFamily: MONO, fontSize: 22, fontWeight: 600, color: INK }}>{num(result.dailyDemandL, 0)} <span style={{ fontSize: 12, color: INK_45 }}>L/day</span></p>
                  </div>
                  <div style={{ border: `1px solid ${BSUB}`, borderRadius: 2, padding: '14px 16px' }}>
                    <p style={{ fontFamily: MONO, fontSize: 9, color: INK_35, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Required storage</p>
                    <p style={{ fontFamily: MONO, fontSize: 22, fontWeight: 600, color: INK }}>{num(result.totalStorageL, 0)} <span style={{ fontSize: 12, color: INK_45 }}>L</span></p>
                  </div>
                </div>

                {/* Breakdown — BOQ table */}
                <p style={{ fontFamily: MONO, fontSize: 10, color: INK_35, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                  Calculation breakdown
                </p>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: MONO, fontSize: 12.5 }}>
                  <tbody>
                    <BreakRow
                      label="Daily demand"
                      detail={`${num(result.occupants, 0)} occupants × ${result.lpcd} LPCD`}
                      value={`${num(result.dailyDemandL, 0)} L`}
                    />
                    <BreakRow
                      label="Storage ratio"
                      detail={`× ${TANK_RATIO} (2/3 daily demand)`}
                      value={`${num(result.dailyDemandL * TANK_RATIO, 1)} L`}
                      muted
                    />
                    <BreakRow
                      label="Storage days"
                      detail={`× ${num(result.storageDays, 0)} day${result.storageDays > 1 ? 's' : ''}`}
                      value={`${num(result.totalStorageL, 0)} L`}
                    />
                    <BreakRow
                      label="Round up to standard"
                      detail={`next of ${STANDARD_TANK_SIZES.join(', ')} L`}
                      value={result.nearestTankL !== null ? `${num(result.nearestTankL, 0)} L` : '—'}
                      positive
                    />
                    <tr>
                      <td colSpan={2} style={{ padding: '11px 0 0', borderTop: `1px solid ${BSUB}`, color: INK, fontWeight: 500 }}>Tank to buy</td>
                      <td style={{ padding: '11px 0 0', borderTop: `1px solid ${BSUB}`, textAlign: 'right', color: INK, fontWeight: 600 }}>
                        {result.nearestTankL !== null ? `${num(result.nearestTankL, 0)} L` : 'Split tanks'}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <p style={{ fontFamily: SANS, fontSize: 11.5, color: INK_35, lineHeight: 1.6, marginTop: 18 }}>
                  Storage rounds UP to the next standard size — never down. Undersizing a tank causes dry taps and
                  pump burnout (IS 1172:1993 Cl 6). Where a sump plus overhead tank is used, this figure is the
                  total stored volume to divide between them.
                </p>
              </>
            ) : (
              <p style={{ fontFamily: SANS, fontSize: 14, color: INK_45, lineHeight: 1.7, paddingTop: 8 }}>
                Enter the number of occupants to see the daily demand, required storage, and the nearest standard
                tank size.
              </p>
            )}
          </div>
        </div>

        {/* ── CTA — PlumbingPro ────────────────────────────────────────────────── */}
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
              Need the full plumbing estimate?
            </p>
            <p style={{ fontFamily: SANS, fontSize: 15.5, color: INK_65, lineHeight: 1.6, maxWidth: 620 }}>
              Need your full plumbing cost, not just tank size? Get pipe sizing, fixture costs, and pump specs
              with PlumbingPro — the complete IS 1172:1993 &amp; IS 1742:1983 water supply and drainage estimate,
              contractor-quote comparison included.
            </p>
          </div>
          <Link
            href="/tools/plumbpro"
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
            Open PlumbingPro →
          </Link>
        </div>
      </section>

      {/* ── STANDARD SIZE REFERENCE TABLE ───────────────────────────────────────── */}
      <section className="grid-paper px-6 md:px-16 lg:px-24 py-16" style={{ borderTop: `1px solid ${BSUB}` }}>
        <Eyebrow>Reference · Standard Tank Sizes</Eyebrow>
        <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(24px,3vw,32px)', fontWeight: 600, color: INK, marginBottom: 20 }}>
          What each standard tank covers
        </h2>
        <div style={{ overflowX: 'auto', border: `1px solid ${BSUB}`, borderRadius: 2, background: SURF }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: MONO, fontSize: 12.5, minWidth: 560 }}>
            <thead>
              <tr>
                {['Tank size', 'Municipal · 1 day', 'Borewell · 1 day'].map((h) => (
                  <th key={h} style={{ textAlign: h === 'Tank size' ? 'left' : 'center', fontFamily: MONO, fontSize: 10, color: INK_45, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 14px', borderBottom: `1px solid ${BSUB}`, whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STANDARD_TANK_SIZES.map((size, i) => {
                // Occupants a single-day tank of this size supports:
                // size = occupants × lpcd × 0.67  ⇒  occupants = size / (lpcd × 0.67)
                const muniOcc = Math.floor(size / (WATER_DEMAND_LPCD.municipal * TANK_RATIO))
                const boreOcc = Math.floor(size / (WATER_DEMAND_LPCD.borewell * TANK_RATIO))
                return (
                  <tr key={size} style={{ background: i % 2 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                    <td style={{ padding: '10px 14px', color: BLUEPRINT }}>{num(size, 0)} L</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: INK_65 }}>up to {muniOcc} people</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: INK_65 }}>up to {boreOcc} people</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p style={{ fontFamily: SANS, fontSize: 12, color: INK_35, lineHeight: 1.6, marginTop: 14, maxWidth: 720 }}>
          Occupant figures are for a single day of storage at the IS 1172:1993 rates. Multiply the required
          storage by your number of storage days before reading this table for intermittent-supply areas.
        </p>
      </section>

      {/* ── WRITTEN CONTENT ─────────────────────────────────────────────────────── */}
      <article className="px-6 md:px-16 lg:px-24 py-16" style={{ maxWidth: 820 }}>

        <Prose heading="What the 135 LPCD standard actually covers">
          <p>
            LPCD stands for <strong style={{ color: INK }}>litres per capita per day</strong> — the water one
            person is expected to use in a day. IS 1172:1993, the Indian standard for water supply in buildings,
            fixes the residential figure at <strong style={{ color: INK }}>135 litres per person per day</strong>{' '}
            where the house is on a municipal (piped town) supply, and a higher{' '}
            <strong style={{ color: INK }}>150 LPCD</strong> where the house draws on its own borewell, because
            an owned source tends to be used more freely.
          </p>
          <p>
            That 135 litres is not just drinking water. The standard breaks the daily household demand down
            roughly like this:
          </p>
          <ul>
            <li><span style={{ fontFamily: MONO, color: INK }}>Drinking &amp; cooking</span> — about 5 litres. The only water that must be potable-clean, but the smallest slice.</li>
            <li><span style={{ fontFamily: MONO, color: INK }}>Bathing</span> — about 55 litres. The single largest use in most Indian homes — a bucket bath is ~20 L, a shower far more.</li>
            <li><span style={{ fontFamily: MONO, color: INK }}>Flushing</span> — about 30 litres. Every WC flush is 6–10 L; this adds up fast across a family.</li>
            <li><span style={{ fontFamily: MONO, color: INK }}>Washing &amp; cleaning</span> — about 45 litres. Clothes, utensils, floors, and the general housekeeping load.</li>
          </ul>
          <p>
            Add those up and you land near 135 litres for a person on municipal supply. The figure is a design
            minimum, not a luxury allowance — it is what a plumbing system must be able to deliver and store so
            the house never runs dry under normal use.
          </p>
        </Prose>

        <Prose heading="Why storage is two-thirds of a day, not a full day">
          <p>
            A common instinct is to size the tank to a full day of demand. IS 1172:1993 is more economical than
            that: it sets the total stored capacity at <strong style={{ color: INK }}>two-thirds of the daily
            demand</strong> — the 0.67 factor this calculator uses. The reasoning is that a house on a working
            supply is refilled during the day, so it does not need to hold a whole day&rsquo;s water at once; it
            only needs enough buffer to ride through the hours between fills and the peak-use mornings and
            evenings.
          </p>
          <p style={{ fontFamily: MONO, color: INK, fontSize: 15, background: SURF, border: `1px solid ${BSUB}`, borderRadius: 2, padding: '14px 16px' }}>
            storage (litres) = occupants × LPCD × 0.67 × storage days
          </p>
          <p>
            The 0.67 factor and the per-capita rates are the exact locked IS 1172:1993 values used inside
            NirmanShastra&rsquo;s paid PlumbingPro tool — this free calculator shares the same engine for the
            single-day case, so the two never disagree.
          </p>
        </Prose>

        <Prose heading="Why intermittent-supply areas need a bigger buffer">
          <p>
            The two-thirds rule assumes water comes every day. Large parts of India do not have that. In many
            towns and peri-urban areas the municipal line runs only on alternate days, or for a couple of hours
            every second or third day, or a tanker arrives on a schedule. In those places a tank sized for a
            single day empties before the next supply arrives, and the household is dry — exactly the failure the
            standard warns against.
          </p>
          <p>
            The fix is the <strong style={{ color: INK }}>storage-days multiplier</strong> in this tool. This is a
            genuinely new addition, not an IS clause: it simply scales the standard two-thirds-of-a-day storage by
            the number of days you must survive between supplies. Set it to 2 for an alternate-day supply, 3 for a
            twice-a-week line, and the required storage grows in proportion. A continuous, reliable supply stays at
            1 day and collapses back to the plain IS 1172:1993 figure.
          </p>
          <p>
            Because the difference between &ldquo;enough&rdquo; and &ldquo;dry taps&rdquo; is one-sided — running
            out is far worse than a slightly larger tank — the tool always rounds the requirement <strong style={{ color: INK }}>up</strong> to the
            next size actually sold off the shelf (500, 1000, 1500, 2000, 3000, 5000 litres). It never rounds
            down.
          </p>
        </Prose>

        <Prose heading="Worked example — a family of eight on municipal supply">
          <p>
            Take the calculator&rsquo;s default inputs: <strong style={{ color: INK }}>8 occupants</strong>, a{' '}
            <strong style={{ color: INK }}>municipal</strong> supply, and <strong style={{ color: INK }}>1 day</strong>{' '}
            of storage. The daily demand is 8 × 135 = 1080 litres. Applying the two-thirds storage rule gives
            1080 × 0.67 = 723.6, which rounds to <strong style={{ color: INK }}>724 litres</strong> of required
            storage.
          </p>
          <p style={{ fontFamily: MONO, color: INK, fontSize: 14.5, background: SURF, border: `1px solid ${BSUB}`, borderRadius: 2, padding: '14px 16px' }}>
            8 × 135 = 1080 L/day  →  1080 × 0.67 × 1 = 724 L  →  buy 1000 L
          </p>
          <p>
            724 litres falls between the 500 L and 1000 L standard sizes, so the tool rounds up to a{' '}
            <strong style={{ color: INK }}>1000 litre</strong> tank — the smallest off-the-shelf tank that will
            not leave this family short. If the same house sat on an alternate-day supply, setting storage days to
            2 would raise the requirement to 1448 litres and push the recommendation to a 1500 litre tank.
          </p>
        </Prose>

        {/* Disclaimer note */}
        <p style={{ fontFamily: SANS, fontSize: 12.5, color: INK_35, lineHeight: 1.7, marginTop: 8, borderTop: `1px solid ${BSUB}`, paddingTop: 18 }}>
          Schematic for estimation reference only. Sizing uses the IS 1172:1993 per-capita demand and two-thirds
          storage rule with a storage-days buffer; actual requirements vary with occupancy patterns, fittings,
          gardens, and local supply reliability. All storage tanks must be food-grade HDPE, covered, and
          insect-proof per IS 12701. Not a substitute for a licensed plumber&rsquo;s design.
        </p>
      </article>
    </main>
  )
}

// ── Sub-components / formatters ──────────────────────────────────────────────────

function BreakRow({
  label, detail, value, positive, negative, muted,
}: { label: string; detail: string; value: string; positive?: boolean; negative?: boolean; muted?: boolean }) {
  const valColor = negative ? '#C8785A' : positive ? '#7BA77B' : muted ? INK_45 : INK_65
  return (
    <tr>
      <td style={{ padding: '7px 0', color: INK_65, whiteSpace: 'nowrap', verticalAlign: 'top' }}>{label}</td>
      <td style={{ padding: '7px 12px', color: INK_35, fontSize: 11.5 }}>{detail}</td>
      <td style={{ padding: '7px 0', textAlign: 'right', color: valColor, whiteSpace: 'nowrap' }}>{value}</td>
    </tr>
  )
}

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
