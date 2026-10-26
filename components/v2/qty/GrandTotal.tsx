'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import '@/styles/v2/results.css'
import { Note, StepBar, ToolHead, IcArrow, IcCheck } from '@/components/v2/inner/kit'
import { DeliveryNote, ReportTable, Tot } from './parts'
import { useUnlock } from './useUnlock'
import PackUnlock from './PackUnlock'
import { PRICE as PRICES } from '@/lib/tool-pricing'
import { PAYMENT_BYPASS } from '@/lib/payment-config'
import ViewItem from '@/components/analytics/ViewItem'
import SampleReportLink from '@/components/samples/SampleReportLink'
import PayAssurance from '@/components/policy/PayAssurance'
import { useCalm } from '@/lib/v2/store'
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

const STEPS = ['Your reports', 'Check and unlock', 'Your list']
const band = (low: number, high: number) => ({ below: Math.round((1 - low) * 100), above: Math.round((high - 1) * 100) })
const floorsText = (n: number) => (n === 1 ? 'Ground floor only' : `Ground + ${n - 1}`)
const dateText = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

/** The same rule the server applies, so a mismatch is explained before the visitor presses the button. */
function mismatch(ph: PhaseEntry[]): string | null {
  if (ph.length < 2) return null
  if (new Set(ph.map(p => p.floors)).size > 1) return 'These reports were made for buildings with a different number of floors, so they cannot be added into one list.'
  const a = ph.map(p => p.builtUpM2)
  const lo = Math.min(...a)
  const hi = Math.max(...a)
  if (lo > 0 && (hi - lo) / lo > 0.1) return 'The floor areas in these reports differ by more than 10%, so they are not for the same building. Untick the report that does not belong, or run that phase again with the same floor areas.'
  return null
}

export default function GrandTotal() {
  const calm = useCalm()
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
      {!made && <ToolHead eyebrow={GRAND_META.eyebrow} name="Grand Total" price={`Full list ${PRICE}`} blurb={GRAND_META.blurb} after={<SampleReportLink sample="grandtotal" where="tool_head" />} />}
      <StepBar steps={STEPS} current={stepNow} />

      <AnimatePresence mode="wait">
        {!made && (
          <motion.div key="pick" variants={v} initial="initial" animate="animate" exit="exit">
            {!data && !loadError && (
              <div className="ns-plate ns-i-card"><div className="ns-i-loading" role="status"><span className="ns-i-spin" />Looking for your paid reports…</div></div>
            )}

            {loadError && (
              <Note kind="err" title="We could not look up your reports">
                {loadError} <button type="button" className="ns-i-link" onClick={load}>Try again</button>
              </Note>
            )}

            {data && data.projects.length === 0 && <EmptyState older={data.older} signedIn={data.signedIn} />}

            {data && data.projects.length > 0 && project && (
              <div className="ns-plate ns-i-card">
                <p className="ns-i-card__eyebrow">Grand Total · Step 1 of 3</p>
                <h2>Which project?</h2>
                <p className="ns-i-card__sub">The Grand Total adds the paid reports of one project. Pick the project, then tick the phases to add.</p>

                <fieldset className="ns-i-choices ns-i-card__body">
                  <legend className="ns-sr">Choose a project</legend>
                  {data.projects.map(p => {
                    const enough = p.phases.length >= 2
                    return (
                      <label key={p.projectKey} className="ns-i-choice" style={enough ? undefined : { opacity: 0.6 }}>
                        <input type="radio" name="gt_project" value={p.projectKey} checked={p.projectKey === projectKey} disabled={!enough}
                          onChange={() => { setProjectKey(p.projectKey); setOff(new Set()); setError('') }} />
                        <span>
                          <span className="ns-i-choice__t">{p.projectName}</span>
                          <span className="ns-i-choice__d">{[p.where, floorsText(p.floors), `${p.builtUpM2.toLocaleString('en-IN')} m² built-up`].filter(Boolean).join(' · ')}</span>
                          <span className="ns-i-choice__d">
                            {enough ? `${p.phases.length} paid ${p.phases.length === 1 ? 'report' : 'reports'}: ${p.phases.map(x => x.short).join(', ')}` : 'Only one paid report so far. You need at least two phases to add together.'}
                          </span>
                        </span>
                      </label>
                    )
                  })}
                </fieldset>

                {project.phases.length >= 2 && (
                  <>
                    <h3 style={{ margin: '28px 0 6px', fontSize: 22 }}>Phases to add</h3>
                    <p className="ns-i-fine" style={{ margin: '0 0 12px' }}>Each one is the latest report you paid for in this project.</p>
                    <fieldset className="ns-i-choices">
                      <legend className="ns-sr">Phases to add together</legend>
                      {project.phases.map(ph => (
                        <label key={ph.estimateId} className="ns-i-choice">
                          <input type="checkbox" checked={!off.has(ph.estimateId)}
                            onChange={e => setOff(prev => { const n = new Set(prev); if (e.target.checked) n.delete(ph.estimateId); else n.add(ph.estimateId); return n })} />
                          <span>
                            <span className="ns-i-choice__t">{ph.label} · {ph.short}</span>
                            <span className="ns-i-choice__d">{ph.stage} · bought {dateText(ph.createdAt)} · {floorsText(ph.floors)}, {ph.builtUpM2.toLocaleString('en-IN')} m²</span>
                          </span>
                        </label>
                      ))}
                    </fieldset>

                    {PHASES.filter(p => !project.phases.some(x => x.key === p.key)).length > 0 && (
                      <p className="ns-i-fine" style={{ marginTop: 14 }}>
                        Not done yet for this project:{' '}
                        {PHASES.filter(p => !project.phases.some(x => x.key === p.key)).map((p, i, arr) => (
                          <span key={p.key}><Link href={p.href}>{p.label}</Link>{i < arr.length - 1 ? ', ' : ''}</span>
                        ))}
                        . The Grand Total is made from the reports you have today and does not update later.
                      </p>
                    )}
                  </>
                )}

                {clash && <div style={{ marginTop: 16 }}><Note kind="warn" title="These reports do not match">{clash}</Note></div>}
                {error && <div style={{ marginTop: 16 }}><Note kind="err" title="We could not finish">{error}</Note></div>}
                {data.older > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <Note kind="info" title={`${data.older} earlier ${data.older === 1 ? 'report is' : 'reports are'} not listed`}>
                      Reports made before the site moved to quantities only cannot be added. Run that phase again and it will appear here.
                    </Note>
                  </div>
                )}

                <div className="ns-i-card__foot">
                  <button type="button" className="ns-btn" onClick={check} disabled={!canGo}>
                    {busy ? 'Putting them together…' : chosen.length < 2 ? 'Tick at least two phases' : 'Check these reports'}
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
  return (
    <div className="ns-plate ns-i-card">
      <p className="ns-i-card__eyebrow">Grand Total</p>
      <h2>Add your reports into one list</h2>
      <p className="ns-i-card__sub">
        {signedIn
          ? 'You have no paid reports for this browser yet. The Grand Total adds the reports you have already bought, for one project, into a single list of what to buy.'
          : 'We could not find a session for this browser. Open this page in the browser where you bought your reports, or log in. The Grand Total adds the reports you have already bought into a single list of what to buy.'}
      </p>
      <ol className="ns-r-list" style={{ margin: '18px 0' }}>
        <li>Run two or more of the phases below for the same project, and buy their reports.</li>
        <li>Come back here. They are listed, and you tick the ones to add.</li>
        <li>One payment, and you get one list with cement, sand and stone added across phases and nothing counted twice.</li>
      </ol>
      <div className="ns-i-choices">
        {PHASES.map(p => (
          <Link key={p.key} href={p.href} className="ns-i-choice" style={{ textDecoration: 'none', color: 'inherit' }}>
            <span style={{ flex: 'none', width: 24 }} aria-hidden="true" />
            <span>
              <span className="ns-i-choice__t">{p.label} · {p.short}</span>
              <span className="ns-i-choice__d">{p.stage} · {p.covers}</span>
            </span>
          </Link>
        ))}
      </div>
      {older > 0 && (
        <div style={{ marginTop: 16 }}>
          <Note kind="info" title={`${older} earlier ${older === 1 ? 'report is' : 'reports are'} on this account`}>
            Reports made before the site moved to quantities only cannot be added. Run that phase again and it will be listed here.
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
  useEffect(() => { onStage(r ? 2 : 1) }, [r, onStage])

  return (
    <div className="ns-r">
      <header className="ns-r-head">
        <p className="ns-i-card__eyebrow" style={{ margin: '0 0 6px', fontWeight: 700, color: 'var(--tc)', fontSize: 14 }}>Step {r ? 3 : 2} of 3 · {projectName}</p>
        <h2>{r ? 'Your Grand Total is ready' : 'Here is what will be added'}</h2>
        <div className="ns-r-chips">
          {free.chips.map((c, i) => <span key={c} className={`ns-i-pill${i === 0 ? ' ns-i-pill--tc' : ''}`}>{c}</span>)}
          {PAYMENT_BYPASS ? <span className="ns-r-preview"><IcCheck width={16} height={16} />Preview mode: full list open for testing</span> : null}
        </div>
      </header>

      {/* ───────────────────────── FREE ───────────────────────── */}
      <section className="ns-plate ns-r-sec" aria-labelledby="gt-in-t">
        <h3 id="gt-in-t">The reports in this total</h3>
        <ul className="ns-r-list">
          {free.phases.map(p => (
            <li key={p.key}><b>{p.label} · {p.short}</b>: {p.covers.toLowerCase()}. {p.floors === 1 ? 'Ground floor only' : `Ground + ${p.floors - 1}`}, {p.builtUpM2.toLocaleString('en-IN')} m².</li>
          ))}
        </ul>
        {free.missing.length > 0 && (
          <p className="ns-r-tblnote">
            Not in this total:{' '}
            {free.missing.map((m, i) => <span key={m.key}><Link href={m.href}>{m.label}</Link> ({m.covers.toLowerCase()}){i < free.missing.length - 1 ? '; ' : ''}</span>)}.
          </p>
        )}
      </section>

      <section className="ns-plate ns-r-sec" aria-labelledby="gt-chk-t">
        <h3 id="gt-chk-t">Before you rely on this list</h3>
        <ul className="ns-r-chks">
          {free.checks.map(c => (
            <li key={c.id} className="ns-r-chk" data-s={c.status}>
              <span className="ns-r-chk__s">{c.status === 'pass' ? 'PASS' : c.status === 'advisory' ? 'NOTE' : 'FAIL'}</span>
              <p className="ns-r-chk__c">{c.clause}</p>
              <p className="ns-r-chk__t">{c.description}</p>
              <p className="ns-r-chk__d">{c.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      {free.warnings.length > 0 && <Note kind="warn" title="Please read">{free.warnings.join(' ')}</Note>}

      {!u.isPaid && (
        <section className="ns-plate ns-r-unlock" aria-labelledby="gt-unlock-t">
          <div>
            <p className="ns-r-hook__k">The list is in the full report</p>
            <h3 id="gt-unlock-t">One list of everything to buy</h3>
          </div>
          <ul className="ns-r-unlock__list">
            {GRAND_META.includes.map(t => <li key={t}><IcCheck />{t}</li>)}
          </ul>
          <PackUnlock appType="grandtotal" estimateId={estimateId} onUnlocked={u.markPaid} />
          <button type="button" className="ns-btn" onClick={u.unlock} disabled={u.busy}>
            {u.payStatus === 'creating' ? 'Starting the payment…' : u.payStatus === 'verifying' ? 'Checking your payment…' : u.payStatus === 'polling' ? 'Confirming your payment…' : `Unlock the Grand Total · ${PRICE}`}
            {!u.busy && <IcArrow width={22} height={11} />}
          </button>
          {u.payError && <Note kind="err">{u.payError}</Note>}
          <PayAssurance sample="grandtotal" />
          <p className="ns-i-fine">One payment, no subscription. Paid through Razorpay; we never see your card details. The list is made from the reports above and does not update when you add a phase later.</p>
        </section>
      )}

      {/* ───────────────────────── PAID ───────────────────────── */}
      {u.isPaid && u.reportStatus === 'loading' && (
        <div role="status" aria-live="polite"><div className="ns-r-skel" /><p className="ns-i-fine" style={{ marginTop: 10 }}>Adding your reports together…</p></div>
      )}
      {u.isPaid && u.reportStatus === 'error' && (
        <Note kind="err" title="We could not load your Grand Total">
          {u.reportError} <button type="button" className="ns-i-link" onClick={u.loadReport}>Try again</button>
        </Note>
      )}

      {u.isPaid && r && (
        <>
          <section className="ns-plate ns-r-pdf" aria-labelledby="gt-pdf-t">
            <p className="ns-r-hook__k">{u.previewOnly ? 'Preview mode · no payment taken' : 'Payment received'}</p>
            <h3 id="gt-pdf-t">Your Grand Total is unlocked</h3>
            <DeliveryNote emailSent={u.emailSent} />
            {u.pdfStatus === 'generating' && <p className="ns-i-fine" role="status">Preparing your PDF…</p>}
            {u.pdfStatus === 'ready' && u.pdfUrl && (
              <button type="button" className="ns-btn" onClick={u.downloadPdf} disabled={u.downloading}>{u.downloading ? 'Preparing the download…' : 'Download the PDF report'}</button>
            )}
            {u.pdfStatus === 'error' && (
              <Note kind="warn">The PDF could not be prepared just now. Everything is on this page. <button type="button" className="ns-i-link" onClick={u.generatePdf}>Try the PDF again</button></Note>
            )}
          </section>

          {r.tiles.length > 0 && (
            <section className="ns-plate ns-r-sec" aria-labelledby="gt-tot-t">
              <h3 id="gt-tot-t">What to order</h3>
              <p className="ns-r-sec__sub">The main totals across your phases. The line under each figure is the range the real number is likely to fall in (see “How far off can this be”).</p>
              <div className="ns-r-tots">
                {r.tiles.map(t => <Tot key={t.k} k={t.k} v={t.v} unit={t.unit} range={t.range} />)}
              </div>
            </section>
          )}

          {r.tables.map(tb => (
            <section key={tb.id} className="ns-plate ns-r-sec" aria-labelledby={`gt-tb-${tb.id}`}>
              <h3 id={`gt-tb-${tb.id}`}>{tb.title}</h3>
              {tb.sub ? <p className="ns-r-sec__sub">{tb.sub}</p> : null}
              <ReportTable head={tb.head} rows={tb.rows} foot={tb.foot} num={tb.num} tight={tb.tight} stack={false} />
              {tb.note ? <p className="ns-r-tblnote">{tb.note}</p> : null}
            </section>
          ))}

          <section className="ns-plate ns-r-sec" aria-labelledby="gt-acc-t">
            <h3 id="gt-acc-t">How far off can this be</h3>
            <p className="ns-r-sec__sub">This is a code-based planning estimate worked out from your answers, not a design for your drawings. Each phase has its own range; these are the widest ones.</p>
            <ul className="ns-r-list">
              {r.bands.map(b => {
                const p = band(b.low, b.high)
                return <li key={b.label}>{b.label}: from {p.below}% below to {p.above}% above the figure shown.</li>
              })}
            </ul>
            <p className="ns-r-tblnote">Use it to plan, to check a contractor&rsquo;s quantities for gross errors, and to order the first lots. Final quantities come from the drawings and the professional who signs them.</p>
          </section>

          <section className="ns-plate ns-r-sec" aria-labelledby="gt-as-t">
            <h3 id="gt-as-t">How the reports were added</h3>
            <ul className="ns-r-list">{r.assumptions.map(a => <li key={a}>{a}</li>)}</ul>
          </section>

          <section className="ns-plate ns-r-sec" aria-labelledby="gt-pn-t">
            <h3 id="gt-pn-t">The assumptions in each phase</h3>
            <p className="ns-r-sec__sub">Open a phase to read what it assumed and what it does not count.</p>
            {r.phaseNotes.map(p => (
              <details key={p.key} className="ns-r-more">
                <summary>{p.label}</summary>
                <h4>Assumptions</h4>
                <ul className="ns-r-list">{p.assumptions.map(a => <li key={a}>{a}</li>)}</ul>
                <h4>Not counted</h4>
                <ul className="ns-r-list">{p.notIncluded.map(a => <li key={a}>{a}</li>)}</ul>
              </details>
            ))}
          </section>

          <section className="ns-plate ns-r-sec" aria-labelledby="gt-ni-t">
            <h3 id="gt-ni-t">Not counted in this report</h3>
            <ul className="ns-r-list">{r.notIncluded.map(a => <li key={a}>{a}</li>)}</ul>
          </section>

          <section className="ns-plate ns-r-sec" aria-labelledby="gt-src-t">
            <h3 id="gt-src-t">Standards and sources used</h3>
            <ul className="ns-r-list">{r.sources.map(a => <li key={a}>{a}</li>)}</ul>
          </section>
        </>
      )}

      <section className="ns-plate ns-r-next" aria-labelledby="gt-next-t">
        <p className="ns-r-hook__k">Next</p>
        <h3 id="gt-next-t">{GRAND_META.next.name}</h3>
        <p>{GRAND_META.next.text}</p>
        <Link href={GRAND_META.next.href} className="ns-btn ns-btn--paper">Open {GRAND_META.next.name}<IcArrow width={22} height={11} /></Link>
      </section>

      {!u.isPaid && <button type="button" className="ns-r-again" onClick={onBack}>Choose different reports</button>}
    </div>
  )
}
