'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import QtyRegistration, { type QtyRegData } from './QtyRegistration'
import QtyForm from './QtyForm'
import QtyResults from './QtyResults'
import ProjectPicker, { type SelectedProject } from '@/components/v2/inner/ProjectPicker'
import { ToolHead, StepBar, RailAside, RailFold, Note } from '@/components/v2/inner/kit'
import type { LiveSummaryData } from '@/components/ui/LiveSummaryPanel'
import { TRADE_META, type TradeSlug } from '@/lib/qty/meta'
import { FORMS } from '@/lib/qty/forms'
import type { TradeFree } from '@/lib/qty/types'
import { useCalm } from '@/lib/v2/store'
import { TOOLS } from '@/lib/v2/content'
import { saveProjectToSession } from '@/lib/project-session'
import ViewItem from '@/components/analytics/ViewItem'
import '@/styles/v2/results.css'

/*
  The wizard for PlumbingPro, ElectricalPro, MasonryPro and InteriorPro:
  who and where, pick or start a project, a few plain questions, then the results.
  What differs from tool to tool is the form (lib/qty/forms) and the model on the server; this file is the same for all.
*/

const stepVariants = {
  initial: { opacity: 0, x: 18 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.28, ease: 'easeOut' as const } },
  exit:    { opacity: 0, x: -18, transition: { duration: 0.18, ease: 'easeIn' as const } },
}
const calmVariants = {
  initial: { opacity: 1, x: 0 },
  animate: { opacity: 1, x: 0, transition: { duration: 0 } },
  exit:    { opacity: 1, x: 0, transition: { duration: 0 } },
}

const STEPS = ['About you', 'Your project', 'Your building', 'Your report']

type Step = 'register' | 'project_pick' | 'details' | 'results'
const STEP_IX: Record<Step, number> = { register: 0, project_pick: 1, details: 2, results: 3 }

interface Session {
  regData: QtyRegData
  contactId: string
  estimateId: string | null
  free: TradeFree | null
  selectedProject: SelectedProject | null
}
const EMPTY: Session = { regData: { name: '', email: '', projectName: '', state: '', city: '' }, contactId: '', estimateId: null, free: null, selectedProject: null }

export default function QtyToolPage({ slug }: { slug: TradeSlug }) {
  const meta = TRADE_META[slug]
  const spec = FORMS[slug]
  const tool = TOOLS.find(t => t.key === meta.toolKey)!

  const [step, setStep] = useState<Step>('register')
  const [rows, setRows] = useState<[string, string][]>([])
  const [session, setSession] = useState<Session>(EMPTY)
  const [calcBusy, setCalcBusy] = useState(false)
  const [calcError, setCalcError] = useState('')
  const inFlight = useRef(false)
  const calm = useCalm()
  const v = calm ? calmVariants : stepVariants

  // a fresh screen always starts at the top
  useEffect(() => { window.scrollTo(0, 0) }, [step])

  if (!spec) return null

  function handleRegistration(data: QtyRegData, contactId: string) {
    setSession(prev => ({ ...prev, regData: data, contactId }))
    setStep('project_pick')
  }

  function handleProjectSelect(project: SelectedProject | null) {
    setSession(prev => ({ ...prev, selectedProject: project }))
    setCalcError('')
    setStep('details')
  }

  async function handleDetails(input: Record<string, unknown>) {
    if (inFlight.current) return
    inFlight.current = true
    setCalcBusy(true)
    setCalcError('')

    const sp = session.selectedProject
    const projectName = (sp?.projectName || session.regData.projectName || '').trim() || 'My project'
    const state = String(input.state ?? '')
    const city = String(input.city ?? '')
    const areas = input.floorAreasSqft as number[]

    // Remember the project in this browser straight away, for signed-in and anonymous visitors alike.
    saveProjectToSession({ projectId: sp?.projectId ?? '', projectName, city, state, numFloors: areas.length, perFloorAreas: areas })

    try {
      // 1. The project row. A failure here never blocks the estimate.
      let projectId: string | null = sp?.projectId ?? null
      if (sp && projectId) {
        const patch: Record<string, unknown> = {}
        if (state !== sp.state) patch.state = state
        if (city && city !== sp.city) patch.city = city
        if (areas.length !== sp.numFloors) patch.num_floors = areas.length
        if (JSON.stringify(areas) !== JSON.stringify(sp.perFloorAreas)) patch.per_floor_areas = areas
        if (Object.keys(patch).length > 0) {
          fetch(`/api/projects/${projectId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) }).catch(console.error)
        }
      } else {
        try {
          const projRes = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectName, city, state, numFloors: areas.length, perFloorAreas: areas }),
          })
          const projJson = await projRes.json()
          projectId = projJson.projectId ?? null
        } catch (err) {
          console.error('Failed to save project:', err)
        }
      }

      // 2. The quantities, on the server
      const res = await fetch(`/api/qty/${slug}/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId: session.contactId, projectName, projectId, input }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json.free) throw new Error(json.error || 'We could not work this out. Please try again.')
      setSession(prev => ({ ...prev, estimateId: json.estimateId ?? null, free: json.free as TradeFree }))
      setStep('results')
    } catch (err) {
      setCalcError(err instanceof Error ? err.message : 'We could not work this out. Please try again.')
    } finally {
      inFlight.current = false
      setCalcBusy(false)
    }
  }

  function handleStartOver() {
    setStep('register')
    setRows([])
    setCalcError('')
    setSession(EMPTY)
  }

  // A saved project the visitor picked wins over what they typed at the start, so the side summary matches it.
  const picked = session.selectedProject
  const railReg = picked
    ? { ...session.regData, projectName: picked.projectName || session.regData.projectName, state: picked.state || session.regData.state, city: picked.city || session.regData.city }
    : session.regData
  const liveData: LiveSummaryData = { rows }
  const rail = { toolName: tool.name, price: tool.price, regData: railReg, liveData }
  const withRail = (node: React.ReactNode) => (
    <div className="ns-i-grid ns-i-grid--rail">
      <div style={{ minWidth: 0 }}>
        <RailFold {...rail} />
        {node}
      </div>
      <RailAside {...rail} />
    </div>
  )

  return (
    <div className="ns-i-wrap ns-i-page" style={{ ['--tc' as string]: `var(${tool.accent})` }}>
      <ViewItem appType={meta.appType} />
      {step !== 'results' && (
        <ToolHead eyebrow={meta.eyebrow} name={tool.name} price={`Full report ${tool.price}`} blurb={meta.blurb} art={tool.plate} artAlt={tool.plateAlt} />
      )}
      <StepBar steps={STEPS} current={STEP_IX[step]} />

      <AnimatePresence mode="wait">
        {step === 'register' && (
          <motion.div key="register" variants={v} initial="initial" animate="animate" exit="exit">
            {withRail(<QtyRegistration slug={slug} onSubmit={handleRegistration} />)}
          </motion.div>
        )}

        {step === 'project_pick' && (
          <motion.div key="project_pick" variants={v} initial="initial" animate="animate" exit="exit">
            {withRail(<ProjectPicker onSelect={handleProjectSelect} toolName={tool.name} />)}
          </motion.div>
        )}

        {step === 'details' && (
          <motion.div key="details" variants={v} initial="initial" animate="animate" exit="exit">
            {withRail(
              <>
                {calcError && (
                  <div style={{ marginBottom: 16 }}>
                    <Note kind="err" title="We could not finish">{calcError}</Note>
                  </div>
                )}
                <QtyForm
                  spec={spec}
                  meta={meta}
                  price={tool.price}
                  state={picked?.state ?? session.regData.state}
                  city={picked?.city ?? session.regData.city}
                  initialProject={picked ?? undefined}
                  onSubmit={handleDetails}
                  onRows={setRows}
                  onBack={() => setStep('project_pick')}
                />
              </>,
            )}
          </motion.div>
        )}

        {step === 'results' && session.free && (
          <motion.div key="results" variants={v} initial="initial" animate="animate" exit="exit">
            <QtyResults
              meta={meta}
              price={tool.price}
              free={session.free}
              estimateId={session.estimateId}
              contactName={session.regData.name}
              projectName={picked?.projectName ?? session.regData.projectName ?? ''}
              onStartOver={handleStartOver}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {calcBusy && (
        <div className="ns-r-busy" role="status" aria-live="polite">
          <div className="ns-r-busy__card">
            <span className="ns-r-busy__spin" aria-hidden="true" />
            <p>{meta.busy.title}</p>
            <small>{meta.busy.text}</small>
          </div>
        </div>
      )}
    </div>
  )
}
