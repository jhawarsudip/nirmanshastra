'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import '@/styles/v2/results.css'
import { Note, StepBar, ToolHead, IcArrow, IcCheck } from '@/components/v2/inner/kit'
import { DeliveryNote, ReportTable, Tot } from './parts'
import { useUnlock } from './useUnlock'
import PackUnlock from './PackUnlock'
import RatesPanel from './RatesPanel'
import { PRICE as PRICES } from '@/lib/tool-pricing'
import { PAYMENT_BYPASS } from '@/lib/payment-config'
import ViewItem from '@/components/analytics/ViewItem'
import SampleReportLink from '@/components/samples/SampleReportLink'
import PayAssurance from '@/components/policy/PayAssurance'
import { useMotionOK } from '@/lib/v2/store'
import { useCopy } from '@/lib/i18n/use-copy'
import { GRAND_UI, useGrandTr } from '@/lib/i18n/labels/calc-pack'
import { placesHi } from '@/lib/i18n/labels/structopro-places'
import { QTY_RES, dateHi } from '@/lib/i18n/labels/qty-ui'
import { GRAND_META, PHASES, type GrandFree, type GrandPaid, type PhaseKey } from '@/lib/qty/grand'

/*
  The Grand Total: pick the paid reports of one project, check them, pay once, get one buying list.
  The page only ever sees which phases exist and for how many floors and how much floor area (things the visitor typed).
  Every quantity is added on the server after the payment is verified.
*/

const PRICE = PRICES.grandtotal

interface PhaseEntry { key: PhaseKey; label: string; short: string; stage: string; estimateId: string; floors: number; builtUpM2: number; createdAt: string }
interface ProjectEntry { projectKey: string; projectName: string; where: string; floors: number; builtUpM2: number; phases: PhaseEntry[] }
interface Available { signedIn: boolean; projects: ProjectEntry[]; older: number }

const stepVariants = {
  initial: { opacity: 0, x: 18 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.28, ease: 'easeOut' as const } },
  exit: { opacity: 0, x: -18, transition: { duration: 0.18, ease: 'easeIn' as const } },
}
const calmVariants = {
  initial: { opacity: 1, x: 0 },
  animate: { opacity: 1, x: 0, transition: { duration: 0 } },
  exit: { opacity: 1, x: 0, transition: { duration: 0 } },
}

const band = (low: number, high: number) => ({ below: Math.round((1 - low) * 100), above: Math.round((high - 1) * 100) })
const dateText = (iso: string, hi: boolean) => {
  const d = new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  return hi ? dateHi(d) : d
}

/** The same rule the server applies, so a mismatch is explained before the visitor presses the button. The page picks the wording (GRAND_UI.diffFloors / diffArea). */
function mismatch(ph: PhaseEntry[]): 'floors' | 'area' | null {
  if (ph.length < 2) return null
  if (new Set(ph.map(p => p.floors)).size > 1) return 'floors'
  const a = ph.map(p => p.builtUpM2)
  const lo = Math.min(...a)
  const hi = Math.max(...a)
  if (lo > 0 && (hi - lo) / lo > 0.1) return 'area'
  return null
}

export default function GrandTotal() {
  const g = useCopy(GRAND_UI)
  const q = useCopy(QTY_RES)
  const tg = useGrandTr()
  const hi = useLocale() === 'hi'
  const floorsText = (n: number) => (n === 1 ? g.groundOnly : g.groundPlus(n - 1))
  const calm = !useMotionOK()
  const v = calm ? calmVariants : stepVariants

  const [data, setData] = useState<Available | null>(null)
  const [loadError, setLoadError] = useState('')
  const [projectKey, setProjectKey] = useState<string>('')
  const [off, setOff] = useState<Set<string>>(new Set()) // estimate ids the visitor unticked
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [made, setMade] = useState<{ estimateId: string; free: GrandFree; projectName: string } | null>(null)
  const [stage, setStage] = useState(1) // 1 = check and unlock, 2 = the list
  const inFlight = useRef(false)

  const load = useCallback(async () => {
    setLoadError('')
    setData(null)
    try {
      const res = await fetch('/api/grand-total/available', { cache: 'no-store' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'We could not look up your reports.')
      const d = json as Available
      setData(d)
      const first = d.projects.find(p => p.phases.length >= 2) ?? d.projects[0]
      setProjectKey(first?.projectKey ?? '')
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'We could not look up your reports.')
    }
  }, [])
  useEffect(() => { load() }, [load])
  useEffect(() => { window.scrollTo(0, 0) }, [made])

  const project = data?.projects.find(p => p.projectKey === projectKey) ?? null
  const chosen = useMemo(() => (project ? project.phases.filter(p => !off.has(p.estimateId)) : []), [project, off])
  const clash = mismatch(chosen)
  const canGo = chosen.length >= 2 && !clash && !busy

  async function check() {
    if (!project || !canGo || inFlight.current) return
    inFlight.current = true
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/grand-total/create-estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedEstimateIds: chosen.map(p => p.estimateId) }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json.estimateId) throw new Error(json.error || 'We could not put these reports together. Please try again.')
      setMade({ estimateId: json.estimateId, free: json.free as GrandFree, projectName: project.projectName })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'We could not put these reports together. Please try again.')
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }

  const stepNow = made ? stage : 0

  return (
    <div className="ns-i-wrap ns-i-page" style={{ ['--tc' as string]: 'var(--ns-laterite)' }}>
      <ViewItem appType="grandtotal" />
      {!made && <ToolHead eyebrow={tg(GRAND_META.eyebrow)} name={g.name} price={g.fullList(PRICE)} blurb={tg(GRAND_META.blurb)} after={<SampleReportLink sample="grandtotal" hi={hi} where="tool_head" />} />}
      <StepBar steps={g.steps} current={stepNow} />

      <AnimatePresence mode="wait">
        {!made && (
          <motion.div key="pick" variants={v} initial="initial" animate="animate" exit="exit">
            {!data && !loadError && (
              <div className="ns-plate ns-i-card"><div className="ns-i-loading" role="status"><span className="ns-i-spin" />{g.looking}</div></div>
            )}

            {loadError && (
              <Note kind="err" title={g.couldNotLook}>
                {tg(loadError)} <button type="button" className="ns-i-link" onClick={load}>{q.tryAgain}</button>
              </Note>
            )}

            {data && data.projects.length === 0 && <EmptyState older={data.older} signedIn={data.signedIn} />}

            {data && data.projects.length > 0 && project && (
              <div className="ns-plate ns-i-card">
                <p className="ns-i-card__eyebrow">{g.step1}</p>
                <h2>{g.whichProject}</h2>
                <p className="ns-i-card__sub">{g.pickSub}</p>

                <fieldset className="ns-i-choices ns-i-card__body">
                  <legend className="ns-sr">{g.chooseProject}</legend>
                  {data.projects.map(p => {
                    const enough = p.phases.length >= 2
                    return (
                      <label key={p.projectKey} className="ns-i-choice" style={enough ? undefined : { opacity: 0.6 }}>
                        <input type="radio" name="gt_project" value={p.projectKey} checked={p.projectKey === projectKey} disabled={!enough}
                          onChange={() => { setProjectKey(p.projectKey); setOff(new Set()); setError('') }} />
                        <span>
                          <span className="ns-i-choice__t">{p.projectName}</span>
                          <span className="ns-i-choice__d">{[hi ? placesHi(p.where) : p.where, floorsText(p.floors), g.builtUp(p.builtUpM2.toLocaleString('en-IN'))].filter(Boolean).join(' · ')}</span>
                          <span className="ns-i-choice__d">
                            {enough ? g.reportsOf(p.phases.length, p.phases.map(x => tg(x.short)).join(', ')) : g.onlyOne}
                          </span>
                        </span>
                      </label>
                    )
                  })}
                </fieldset>

                {project.phases.length >= 2 && (
                  <>
                    <h3 style={{ margin: '28px 0 6px', fontSize: 22 }}>{g.phasesToAdd}</h3>
                    <p className="ns-i-fine" style={{ margin: '0 0 12px' }}>{g.latest}</p>
                    <fieldset className="ns-i-choices">
                      <legend className="ns-sr">{g.phasesTogether}</legend>
                      {project.phases.map(ph => (
                        <label key={ph.estimateId} className="ns-i-choice">
                          <input type="checkbox" checked={!off.has(ph.estimateId)}
                            onChange={e => setOff(prev => { const n = new Set(prev); if (e.target.checked) n.delete(ph.estimateId); else n.add(ph.estimateId); return n })} />
                          <span>
                            <span className="ns-i-choice__t">{ph.label} · {tg(ph.short)}</span>
                            <span className="ns-i-choice__d">{g.stageLine(tg(ph.stage), dateText(ph.createdAt, hi), floorsText(ph.floors), ph.builtUpM2.toLocaleString('en-IN'))}</span>
                          </span>
                        </label>
                      ))}
                    </fieldset>

                    {PHASES.filter(p => !project.phases.some(x => x.key === p.key)).length > 0 && (
                      <p className="ns-i-fine" style={{ marginTop: 14 }}>
                        {g.notDone}{' '}
                        {PHASES.filter(p => !project.phases.some(x => x.key === p.key)).map((p, i, arr) => (
                          <span key={p.key}><Link href={p.href}>{p.label}</Link>{i < arr.length - 1 ? ', ' : ''}</span>
                        ))}
                        {g.notDoneEnd}
                      </p>
                    )}
                  </>
                )}

                {clash && <div style={{ marginTop: 16 }}><Note kind="warn" title={g.clashTitle}>{clash === 'floors' ? g.diffFloors : g.diffArea}</Note></div>}
                {error && <div style={{ marginTop: 16 }}><Note kind="err" title={g.finishTitle}>{tg(error)}</Note></div>}
                {data.older > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <Note kind="info" title={g.earlierTitle(data.older)}>
                      {g.earlierText}
                    </Note>
                  </div>
                )}

                <div className="ns-i-card__foot">
                  <button type="button" className="ns-btn" onClick={check} disabled={!canGo}>
                    {busy ? g.putting : chosen.length < 2 ? g.tick2 : g.checkThese}
                    {!busy && chosen.length >= 2 && <IcArrow width={22} height={11} />}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {made && (
          <motion.div key="made" variants={v} initial="initial" animate="animate" exit="exit">
            <GrandResults estimateId={made.estimateId} free={made.free} projectName={made.projectName} onStage={setStage} onBack={() => { setStage(1); setMade(null) }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function EmptyState({ older, signedIn }: { older: number; signedIn: boolean }) {
  const g = useCopy(GRAND_UI)
  const tg = useGrandTr()
  return (
    <div className="ns-plate ns-i-card">
      <p className="ns-i-card__eyebrow">{g.name}</p>
      <h2>{g.emptyTitle}</h2>
      <p className="ns-i-card__sub">
        {signedIn ? g.emptySigned : g.emptyGuest}
      </p>
      <ol className="ns-r-list" style={{ margin: '18px 0' }}>
        <li>{g.empty1}</li>
        <li>{g.empty2}</li>
        <li>{g.empty3}</li>
      </ol>
      <div className="ns-i-choices">
        {PHASES.map(p => (
          <Link key={p.key} href={p.href} className="ns-i-choice" style={{ textDecoration: 'none', color: 'inherit' }}>
            <span style={{ flex: 'none', width: 24 }} aria-hidden="true" />
            <span>
              <span className="ns-i-choice__t">{p.label} · {tg(p.short)}</span>
              <span className="ns-i-choice__d">{tg(p.stage)} · {tg(p.covers)}</span>
            </span>
          </Link>
        ))}
      </div>
      {older > 0 && (
        <div style={{ marginTop: 16 }}>
          <Note kind="info" title={g.earlierAcctTitle(older)}>
            {g.earlierAcctText}
          </Note>
        </div>
      )}
    </div>
  )
}

function GrandResults({ estimateId, free, projectName, onStage, onBack }: { estimateId: string; free: GrandFree; projectName: string; onStage: (n: number) => void; onBack: () => void }) {
  const u = useUnlock<GrandPaid>({
    api: '/api/grand-total',
    estimateId,
    contactName: '',
    description: 'Grand Total report: every phase added into one list',
    fileName: 'NirmanShastra-Grand-Total-Report.pdf',
  })
  const r = u.report
  const g = useCopy(GRAND_UI)
  const q = useCopy(QTY_RES)
  const tg = useGrandTr()
  const hi = useLocale() === 'hi'
  const floorsText = (n: number) => (n === 1 ? g.groundOnly : g.groundPlus(n - 1))
  useEffect(() => { onStage(r ? 2 : 1) }, [r, onStage])

  return (
    <div className="ns-r">
      <header className="ns-r-head">
        <p className="ns-i-card__eyebrow" style={{ margin: '0 0 6px', fontWeight: 700, color: 'var(--tc)', fontSize: 14 }}>{g.stepProject(r ? 3 : 2, projectName)}</p>
        <h2>{r ? g.readyTitle : g.hereIs}</h2>
        <div className="ns-r-chips">
          {free.chips.map((c, i) => <span key={c} className={`ns-i-pill${i === 0 ? ' ns-i-pill--tc' : ''}`}>{tg(c)}</span>)}
          {PAYMENT_BYPASS ? <span className="ns-r-preview"><IcCheck width={16} height={16} />{g.previewList}</span> : null}
        </div>
      </header>

      {/* ───────────────────────── FREE ───────────────────────── */}
      <section className="ns-plate ns-r-sec" aria-labelledby="gt-in-t">
        <h3 id="gt-in-t">{g.inTotal}</h3>
        <ul className="ns-r-list">
          {free.phases.map(p => (
            <li key={p.key}><b>{p.label} · {tg(p.short)}</b>: {g.phaseLine(hi ? tg(p.covers) : p.covers.toLowerCase(), floorsText(p.floors), p.builtUpM2.toLocaleString('en-IN'))}</li>
          ))}
        </ul>
        {free.missing.length > 0 && (
          <p className="ns-r-tblnote">
            {g.notInTotal}{' '}
            {free.missing.map((m, i) => <span key={m.key}><Link href={m.href}>{m.label}</Link> ({hi ? tg(m.covers) : m.covers.toLowerCase()}){i < free.missing.length - 1 ? '; ' : ''}</span>)}{g.stop}
          </p>
        )}
      </section>

      <section className="ns-plate ns-r-sec" aria-labelledby="gt-chk-t">
        <h3 id="gt-chk-t">{g.beforeRely}</h3>
        <ul className="ns-r-chks">
          {free.checks.map(c => (
            <li key={c.id} className="ns-r-chk" data-s={c.status}>
              <span className="ns-r-chk__s">{c.status === 'pass' ? q.pass : c.status === 'advisory' ? q.note : q.fail}</span>
              <p className="ns-r-chk__c">{tg(c.clause)}</p>
              <p className="ns-r-chk__t">{tg(c.description)}</p>
              <p className="ns-r-chk__d">{tg(c.detail)}</p>
            </li>
          ))}
        </ul>
      </section>

      {free.warnings.length > 0 && <Note kind="warn" title={q.pleaseRead}>{free.warnings.map(w => tg(w)).join(' ')}</Note>}

      {!u.isPaid && (
        <section className="ns-plate ns-r-unlock" aria-labelledby="gt-unlock-t">
          <div>
            <p className="ns-r-hook__k">{g.lockedK}</p>
            <h3 id="gt-unlock-t">{g.lockedTitle}</h3>
          </div>
          <ul className="ns-r-unlock__list">
            {GRAND_META.includes.map(x => <li key={x}><IcCheck />{tg(x)}</li>)}
          </ul>
          <PackUnlock appType="grandtotal" estimateId={estimateId} onUnlocked={u.markPaid} />
          <button type="button" className="ns-btn" onClick={u.unlock} disabled={u.busy}>
            {u.payStatus === 'creating' ? q.starting : u.payStatus === 'verifying' ? q.checkingPay : u.payStatus === 'polling' ? q.confirmingPay : g.unlock(PRICE)}
            {!u.busy && <IcArrow width={22} height={11} />}
          </button>
          {u.payError && <Note kind="err">{u.payError}</Note>}
          <PayAssurance sample="grandtotal" hi={hi} />
          <p className="ns-i-fine">{q.payFine} {g.payFineExtra}</p>
        </section>
      )}

      {/* ───────────────────────── PAID ───────────────────────── */}
      {u.isPaid && u.reportStatus === 'loading' && (
        <div role="status" aria-live="polite"><div className="ns-r-skel" /><p className="ns-i-fine" style={{ marginTop: 10 }}>{g.adding}</p></div>
      )}
      {u.isPaid && u.reportStatus === 'error' && (
        <Note kind="err" title={g.loadErrTitle}>
          {tg(u.reportError)} <button type="button" className="ns-i-link" onClick={u.loadReport}>{q.tryAgain}</button>
        </Note>
      )}

      {u.isPaid && r && (
        <>
          <section className="ns-plate ns-r-pdf" aria-labelledby="gt-pdf-t">
            <p className="ns-r-hook__k">{u.previewOnly ? q.previewNoPay : q.received}</p>
            <h3 id="gt-pdf-t">{g.unlockedTitle}</h3>
            <DeliveryNote emailSent={u.emailSent} />
            {u.pdfStatus === 'generating' && <p className="ns-i-fine" role="status">{q.preparingPdf}</p>}
            {u.pdfStatus === 'ready' && u.pdfUrl && (
              <button type="button" className="ns-btn" onClick={u.downloadPdf} disabled={u.downloading}>{u.downloading ? q.preparingDl : q.download}</button>
            )}
            {u.pdfStatus === 'error' && (
              <Note kind="warn">{q.pdfFailed} <button type="button" className="ns-i-link" onClick={u.generatePdf}>{q.pdfAgain}</button></Note>
            )}
          </section>

          {r.tiles.length > 0 && (
            <section className="ns-plate ns-r-sec" aria-labelledby="gt-tot-t">
              <h3 id="gt-tot-t">{q.order}</h3>
              <p className="ns-r-sec__sub">{g.orderSub}</p>
              <div className="ns-r-tots">
                {r.tiles.map(x => <Tot key={x.k} k={tg(x.k)} v={x.v} unit={tg(x.unit)} range={x.range ? tg(x.range) : undefined} />)}
              </div>
            </section>
          )}

          {r.tables.map(tb => (
            <section key={tb.id} className="ns-plate ns-r-sec" aria-labelledby={`gt-tb-${tb.id}`}>
              <h3 id={`gt-tb-${tb.id}`}>{tg(tb.title)}</h3>
              {tb.sub ? <p className="ns-r-sec__sub">{tg(tb.sub)}</p> : null}
              <ReportTable head={tb.head.map(h => tg(h))} rows={tb.rows.map(row => row.map(c => (typeof c === 'string' ? tg(c) : c)))} foot={tb.foot?.map(c => (typeof c === 'string' ? tg(c) : c))} num={tb.num} tight={tb.tight} stack={false} />
              {tb.note ? <p className="ns-r-tblnote">{tg(tb.note)}</p> : null}
            </section>
          ))}

          {/* optional: the same buying list in rupees, at rates the visitor types */}
          <RatesPanel tool="grandtotal" lines={r.lines ?? []} pdf={{ api: '/api/grand-total/generate-pdf', estimateId, fileName: 'NirmanShastra-Grand-Total-Report-with-rupees.pdf' }} />

          <section className="ns-plate ns-r-sec" aria-labelledby="gt-acc-t">
            <h3 id="gt-acc-t">{q.off}</h3>
            <p className="ns-r-sec__sub">{g.offSub}</p>
            <ul className="ns-r-list">
              {r.bands.map(b => {
                const p = band(b.low, b.high)
                return <li key={b.label}>{q.band(tg(b.label), p.below, p.above)}</li>
              })}
            </ul>
            <p className="ns-r-tblnote">{q.offNote}</p>
          </section>

          <section className="ns-plate ns-r-sec" aria-labelledby="gt-as-t">
            <h3 id="gt-as-t">{g.howAdded}</h3>
            <ul className="ns-r-list">{r.assumptions.map(a => <li key={a}>{tg(a)}</li>)}</ul>
          </section>

          <section className="ns-plate ns-r-sec" aria-labelledby="gt-pn-t">
            <h3 id="gt-pn-t">{g.eachPhase}</h3>
            <p className="ns-r-sec__sub">{g.eachPhaseSub}</p>
            {r.phaseNotes.map(p => (
              <details key={p.key} className="ns-r-more">
                <summary>{p.label}</summary>
                <h4>{g.assumptionsH}</h4>
                <ul className="ns-r-list">{p.assumptions.map(a => <li key={a}>{tg(a)}</li>)}</ul>
                <h4>{g.notCountedH}</h4>
                <ul className="ns-r-list">{p.notIncluded.map(a => <li key={a}>{tg(a)}</li>)}</ul>
              </details>
            ))}
          </section>

          <section className="ns-plate ns-r-sec" aria-labelledby="gt-ni-t">
            <h3 id="gt-ni-t">{q.notCounted}</h3>
            <ul className="ns-r-list">{r.notIncluded.map(a => <li key={a}>{tg(a)}</li>)}</ul>
          </section>

          <section className="ns-plate ns-r-sec" aria-labelledby="gt-src-t">
            <h3 id="gt-src-t">{q.sources}</h3>
            <ul className="ns-r-list">{r.sources.map(a => <li key={a}>{tg(a)}</li>)}</ul>
          </section>
        </>
      )}

      <section className="ns-plate ns-r-next" aria-labelledby="gt-next-t">
        <p className="ns-r-hook__k">{q.next}</p>
        <h3 id="gt-next-t">{tg(GRAND_META.next.name)}</h3>
        <p>{tg(GRAND_META.next.text)}</p>
        <Link href={GRAND_META.next.href} className="ns-btn ns-btn--paper">{g.openName(tg(GRAND_META.next.name))}<IcArrow width={22} height={11} /></Link>
      </section>

      {!u.isPaid && <button type="button" className="ns-r-again" onClick={onBack}>{g.different}</button>}
    </div>
  )
}
