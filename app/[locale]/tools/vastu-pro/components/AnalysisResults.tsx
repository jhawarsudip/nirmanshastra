'use client'

import { useMemo } from 'react'
import { useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import PlanEditor from './PlanEditor'
import EmailPdf from './EmailPdf'
import { CATALOGUE } from '../vastu-catalogue'
import type { DoorMark, PlacedItem, PlanImage } from '../vastu-model'
import type { Poly } from '../vastu-geometry'
import { SOURCES, ZONES } from '../vastu-rules'
import { BASIS_LABEL, SEVERITY_LABEL, SEVERITY_ORDER, type Finding, type PlotNote, type Reading, type RemedySet, type Severity } from '../vastu-types'
import { Note, IcArrow } from '@/components/v2/inner/kit'
import { TOOLS } from '@/lib/v2/content'
import { useCopy } from '@/lib/i18n/use-copy'
import { VASTU_SOURCES_HI, type SourcePart } from '@/lib/i18n/labels/vastu-sources'
import { SEVERITY_HI, ZONE_CODES, ZONE_HI } from '@/lib/i18n/labels/vastu-terms'
import { basisOf, hiReading, severityOf } from '../vastu-hi'
import { COPY } from '../copy'

interface Props {
  reading: Reading
  house: Poly
  northDeg: number
  items: PlacedItem[]
  doors: DoorMark[]
  image: PlanImage | null
  onBackToPlan: () => void
}

// The sheet is always paper-coloured, so the plan uses the light-theme severity colours.
const SEV_COLOUR: Record<Severity, string> = { POSITIVE: '#2F7D5B', NEUTRAL: '#7A7266', MODERATE: '#9A6A12', CRITICAL: '#A3322A' }
const ZONE_NAMES = ZONES.map(z => z.short)
const ZONE_NAMES_HI = ZONE_HI.map(z => z.short)
const NOOP = () => {}

const hasRemedies = (r: RemedySet) => r.structural.length + r.practical.length > 0

function List({ items }: { items: string[] }) {
  return (
    <ul className="ns-v-list">
      {items.map((t, i) => <li key={i}>{t}</li>)}
    </ul>
  )
}

/** A source line in Hindi: book titles and publishers stay in English and are marked as such. */
function Parts({ p }: { p: SourcePart[] }) {
  return <>{p.map((x, i) => (typeof x === 'string' ? x : <span key={i} lang="en">{x.en}</span>))}</>
}

function Remedies({ r, dos, donts }: { r: RemedySet; dos: string[]; donts: string[] }) {
  const t = useCopy(COPY).results
  if (!hasRemedies(r) && dos.length + donts.length === 0) return null
  return (
    <details className="ns-v-more">
      <summary>{t.act}</summary>
      <div className="ns-v-more__b">
        {r.practical.length > 0 && (
          <div>
            <h4>{t.noBuild}</h4>
            <List items={r.practical} />
          </div>
        )}
        {r.structural.length > 0 && (
          <div>
            <h4>{t.canChange}</h4>
            <List items={r.structural} />
          </div>
        )}
        {dos.length > 0 && (
          <div>
            <h4>{t.advised}</h4>
            <List items={dos} />
          </div>
        )}
        {donts.length > 0 && (
          <div>
            <h4>{t.advisedAgainst}</h4>
            <List items={donts} />
          </div>
        )}
      </div>
    </details>
  )
}

function FindingCard({ f, hi }: { f: Finding; hi: boolean }) {
  const t = useCopy(COPY).results
  return (
    <article className="ns-plate ns-v-find" data-sev={f.severity}>
      <div className="ns-v-find__top">
        <h3>{f.label}</h3>
        <span className="ns-v-badge" data-sev={f.severity}>{severityOf(hi, f.severity, SEVERITY_LABEL[f.severity])}</span>
      </div>
      <p className="ns-v-find__z">
        {f.zoneText}
        {f.alsoText ? `, ${f.alsoText}` : ''}
        {f.centre && <span className="ns-v-tag">{t.partCentre}</span>}
        {f.borderline && <span className="ns-v-tag">{t.nearLine}</span>}
      </p>

      <p className="ns-v-find__t"><b>{f.headline}</b></p>
      <p className="ns-v-find__t">{f.tradition}</p>

      {f.detail.length > 0 && <List items={f.detail} />}

      {f.borderline && f.altSeverity && f.altSeverity !== f.severity && (
        <p className="ns-v-find__alt">
          {t.altA}<b>{hi ? SEVERITY_HI[f.altSeverity] : SEVERITY_LABEL[f.altSeverity].toLowerCase()}</b>{t.altB}
        </p>
      )}

      {f.disputed && <p className="ns-v-find__disp"><b>{t.differ}</b> {f.disputed}</p>}
      {f.practical && <p className="ns-v-find__prac"><b>{t.practical}</b> {f.practical}</p>}

      <p className="ns-v-find__basis">
        <span className="ns-v-basis" data-basis={f.basis}>{basisOf(hi, f.basis, BASIS_LABEL[f.basis])}</span>
        {f.source && <span>{f.source}</span>}
      </p>

      {f.severity !== 'POSITIVE' && <Remedies r={f.remedies} dos={f.dos} donts={f.donts} />}
    </article>
  )
}

function PlotCard({ n, hi }: { n: PlotNote; hi: boolean }) {
  const t = useCopy(COPY).results
  return (
    <article className="ns-plate ns-v-find ns-v-find--plot" data-sev={n.severity}>
      <div className="ns-v-find__top">
        <h3>{n.title}</h3>
        <span className="ns-v-badge" data-sev={n.severity}>{n.counted ? severityOf(hi, n.severity, SEVERITY_LABEL[n.severity]) : t.info}</span>
      </div>
      <p className="ns-v-find__t">{n.text}</p>
      <p className="ns-v-find__basis"><span className="ns-v-basis" data-basis={n.basis}>{basisOf(hi, n.basis, BASIS_LABEL[n.basis])}</span></p>
      {n.remedies && <Remedies r={n.remedies} dos={[]} donts={[]} />}
    </article>
  )
}

export default function AnalysisResults({ reading: engineReading, house, northDeg, items, doors, image, onBackToPlan }: Props) {
  const t = useCopy(COPY).results
  const hi = useLocale() === 'hi'
  const struct = TOOLS.find(x => x.key === 'struct')!

  // The engine builds the reading in English (the PDF reuses it). On the Hindi page it is turned into Hindi here, for display only.
  const reading = useMemo(() => (hi ? hiReading(engineReading) : engineReading), [engineReading, hi])
  const { findings, plot, counts, missing, basisNotes } = reading

  const sevOf = useMemo(() => {
    const m = new Map<string, Severity>()
    for (const f of findings) m.set(f.id, f.severity)
    return m
  }, [findings])
  // the short zone mark on each room's chip comes from the engine's own wording: "North-east (NE)" gives "NE", or "ईशान" in Hindi
  const zoneOf = useMemo(() => {
    const m = new Map<string, string>()
    for (const f of engineReading.findings) {
      const hit = /\(([A-Z]+)\)/.exec(f.zoneText)
      if (hit) m.set(f.id, hi ? ZONE_HI[ZONE_CODES.indexOf(hit[1])]?.short ?? hit[1] : hit[1])
    }
    return m
  }, [engineReading, hi])

  // Worst first, then the heavier rule first, so what matters most is at the top.
  const ordered = useMemo(
    () => [...findings].sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity) || b.weight - a.weight),
    [findings],
  )
  const top = ordered.slice(0, 3)
  const rest = ordered.slice(3)
  const countedPlot = plot.filter(p => p.counted)
  const infoPlot = plot.filter(p => !p.counted)

  return (
    <div>
      <div className="ns-v-reshead">
        <div>
          <span className="ns-i-pill ns-i-pill--tc">{t.pill}</span>
          <h1>{t.h1}</h1>
          <p>{t.lead}</p>
        </div>
        <button type="button" className="ns-v-sbtn" onClick={onBackToPlan}>{t.back}</button>
      </div>

      <div className="ns-plate ns-v-summary">
        <div className="ns-v-summary__l">
          <h2>{t.glance}</h2>
          <p className="ns-v-score__meta">
            {t.meta(Math.round(northDeg), items.length, doors.length)}
          </p>
          <div className="ns-v-counts">
            {([...SEVERITY_ORDER] as Severity[]).map(sev => (
              <div key={sev} className="ns-v-count" data-sev={sev}>
                <b>{counts[sev]}</b>
                <span>{severityOf(hi, sev, SEVERITY_LABEL[sev])}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="ns-v-summary__r">
          <p className="ns-v-index__k">{t.howK}</p>
          <p className="ns-v-index__how">
            {t.howText}
          </p>
          {missing.length > 0 && (
            <p className="ns-v-index__m">{t.missing(missing.join(', '))}</p>
          )}
        </div>
      </div>

      <div className="ns-v-block">
        <h2>{rest.length > 0 ? t.first(top.length) : t.byRoom}</h2>
        {ordered.length === 0 ? (
          <Note kind="info">{t.emptyNote}</Note>
        ) : (
          <>
            <div className="ns-v-finds">
              {top.map(f => <FindingCard key={f.id} f={f} hi={hi} />)}
            </div>
            <p className="ns-i-fine" style={{ marginTop: 10 }}>
              {t.worstFirst}
            </p>
          </>
        )}
      </div>

      <EmailPdf northDeg={northDeg} house={house} items={items} doors={doors} />

      <div className="ns-v-twin">
        <div className="ns-v-block">
          <h2>{t.planRead}</h2>
          <div className="ns-plate ns-v-sheet">
            <div className="ns-v-canvaswrap">
              <PlanEditor
                mode="view"
                house={house}
                onHouse={NOOP}
                northDeg={northDeg}
                items={items}
                onItems={NOOP}
                doors={doors}
                onDoors={NOOP}
                catalogue={CATALOGUE}
                activeDoorKind="main_door"
                selectedId={null}
                onSelect={NOOP}
                image={image}
                zoneNames={hi ? ZONE_NAMES_HI : ZONE_NAMES}
                colourOf={id => { const s = sevOf.get(id); return s ? SEV_COLOUR[s] : undefined }}
                chipOf={id => zoneOf.get(id)}
              />
            </div>
            <div className="ns-v-sheet__foot">
              <ul className="ns-v-legend" aria-label={t.legendAria}>
                {([...SEVERITY_ORDER].reverse() as Severity[]).map(s => (
                  <li key={s}><i style={{ background: SEV_COLOUR[s] }} />{severityOf(hi, s, SEVERITY_LABEL[s])}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="ns-v-twin__side">
          <Note kind="info" title={t.whatTitle}>
            {t.whatText}
          </Note>
        </div>
      </div>

      {rest.length > 0 && (
        <div className="ns-v-block">
          <h2>{t.rest}</h2>
          <div className="ns-v-finds">
            {rest.map(f => <FindingCard key={f.id} f={f} hi={hi} />)}
          </div>
        </div>
      )}

      {plot.length > 0 && (
        <div className="ns-v-block">
          <h2>{t.plot}</h2>
          <div className="ns-v-finds">
            {countedPlot.map(n => <PlotCard key={n.id} n={n} hi={hi} />)}
            {infoPlot.map(n => <PlotCard key={n.id} n={n} hi={hi} />)}
          </div>
        </div>
      )}

      <div className="ns-v-block ns-plate ns-v-how2">
        <h2>{t.howRead}</h2>
        <List items={basisNotes} />
        <h3>{t.sourcesH}</h3>
        <ul className="ns-v-sources">
          {SOURCES.map(s => {
            const h = hi ? VASTU_SOURCES_HI[s.work] : undefined
            return h ? (
              <li key={s.work}><b><Parts p={h.work} />.</b> <Parts p={h.note} /></li>
            ) : (
              <li key={s.work}><b>{s.work}.</b> {s.note}</li>
            )
          })}
        </ul>
        <p className="ns-i-fine">
          {t.sourcesFine(reading.rulesVersion)}
        </p>
      </div>

      <div className="ns-v-block ns-plate ns-v-next">
        <h2>{t.nextH}</h2>
        <p>
          {t.nextP(struct.price)}
        </p>
        <div className="ns-v-next__row">
          <Link href="/tools/structopro" className="ns-btn">
            {t.nextBtn}
            <IcArrow width={22} height={11} />
          </Link>
        </div>
      </div>
    </div>
  )
}
