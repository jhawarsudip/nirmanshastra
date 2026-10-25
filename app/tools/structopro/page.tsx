'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import RegistrationForm, { type StructoRegData } from './components/RegistrationForm'
import BuildDetails from './components/BuildDetails'
import ResultsV2 from './components/ResultsV2'
import type { QtyInput } from '@/lib/structopro-qty/types'
import type { FreePayload } from '@/lib/structopro-qty/payload'
import type { LiveSummaryData } from '@/components/ui/LiveSummaryPanel'
import ProjectPicker, { type SelectedProject } from '@/components/v2/inner/ProjectPicker'
import { ToolHead, StepBar, RailAside, RailFold, Note } from '@/components/v2/inner/kit'
import { useCalm } from '@/lib/v2/store'
import { TOOLS } from '@/lib/v2/content'
import { saveProjectToSession } from '@/lib/project-session'
import '@/styles/v2/results.css'

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

// Name, price and artwork come from the same list the homepage uses, so they cannot drift apart.
const TOOL = TOOLS.find(t => t.key === 'struct')!

// The four steps the visitor sees. Adding floors to a standing house (vertical extension) is not estimated here:
// it needs an engineer's survey of the old foundation and columns first, so the form says so instead.
const STEPS = ['About you', 'Your project', 'Your building', 'Your report']

type Step = 'register' | 'project_pick' | 'details' | 'results'

const STEP_IX: Record<Step, number> = { register: 0, project_pick: 1, details: 2, results: 3 }

interface SessionState {
  regData:         StructoRegData
  contactId:       string
  estimateId:      string | null
  free:            FreePayload | null
  selectedProject: SelectedProject | null
}

const EMPTY_SESSION: SessionState = {
  regData:         {} as StructoRegData,
  contactId:       '',
  estimateId:      null,
  free:            null,
  selectedProject: null,
}

export default function StructoProPage() {
  const [step, setStep]         = useState<Step>('register')
  const [liveData, setLiveData] = useState<LiveSummaryData>({})
  const [session, setSession]   = useState<SessionState>(EMPTY_SESSION)
  const [calcBusy, setCalcBusy] = useState(false)
  const [calcError, setCalcError] = useState('')
  const inFlight = useRef(false)

  function handleRegistration(data: StructoRegData, contactId: string) {
    setSession(prev => ({ ...prev, regData: data, contactId }))
    setStep('project_pick')
  }

  function handleProjectSelect(project: SelectedProject | null) {
    setSession(prev => ({ ...prev, selectedProject: project }))
    setCalcError('')
    setStep('details')
  }

  // The structure is worked out on the server. The browser only ever receives the free part
  // (zone, grades, checks, the frame at a glance, preview model); the quantities come after payment.
  async function handleDetails(input: QtyInput) {
    if (inFlight.current) return
    inFlight.current = true
    setCalcBusy(true)
    setCalcError('')

    const sp = session.selectedProject
    const projectName = (sp?.projectName || session.regData.projectName || '').trim() || 'My project'
    const city = input.city ?? ''
    const dbNumFloors = input.floorAreasSqft.length
    const dbPerFloorAreas = input.floorAreasSqft

    // Remember the project in this browser straight away. It works for signed-in and anonymous visitors alike.
    saveProjectToSession({
      projectId:     sp?.projectId ?? '',
      projectName,
      city,
      state:         input.state,
      numFloors:     dbNumFloors,
      perFloorAreas: dbPerFloorAreas,
    })

    try {
      // 1. The project row. A failure here never blocks the estimate.
      let projectId: string | null = sp?.projectId ?? null
      if (sp && projectId) {
        const patch: Record<string, unknown> = {}
        if (input.state !== sp.state)                                         patch.state           = input.state
        if (city && city !== sp.city)                                         patch.city            = city
        if (dbNumFloors !== sp.numFloors)                                     patch.num_floors      = dbNumFloors
        if (JSON.stringify(dbPerFloorAreas) !== JSON.stringify(sp.perFloorAreas)) patch.per_floor_areas = dbPerFloorAreas
        if (Object.keys(patch).length > 0) {
          fetch(`/api/projects/${projectId}`, {
            method:  'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(patch),
          }).catch(console.error)
        }
      } else {
        try {
          const projRes = await fetch('/api/projects', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectName,
              city,
              state:          input.state,
              numFloors:      dbNumFloors,
              perFloorAreas:  dbPerFloorAreas,
            }),
          })
          const projJson = await projRes.json()
          projectId = projJson.projectId ?? null
        } catch (err) {
          console.error('Failed to save project:', err)
        }
      }

      // 2. The structure
      const res = await fetch('/api/structopro/calculate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId: session.contactId, projectName, projectId, input }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json.free) {
        throw new Error(json.error || 'We could not work out your structure. Please try again.')
      }
      setSession(prev => ({ ...prev, estimateId: json.estimateId ?? null, free: json.free as FreePayload }))
      setStep('results')
    } catch (err) {
      setCalcError(err instanceof Error ? err.message : 'We could not work out your structure. Please try again.')
    } finally {
      inFlight.current = false
      setCalcBusy(false)
    }
  }

  function handleStartOver() {
    setStep('register')
    setLiveData({})
    setCalcError('')
    setSession(EMPTY_SESSION)
  }

  const calm = useCalm()
  const v = calm ? calmVariants : stepVariants
  const isReport = step === 'results'

  // a fresh screen always starts at the top
  useEffect(() => { window.scrollTo(0, 0) }, [step])

  // A saved project the person picked wins over what they typed at sign-up, so the side summary matches it.
  const picked = session.selectedProject
  const railReg = picked
    ? {
        ...session.regData,
        projectName: picked.projectName || session.regData.projectName,
        state: picked.state || session.regData.state,
        city: picked.city || session.regData.city,
      }
    : session.regData
  const rail = { toolName: TOOL.name, price: TOOL.price, regData: railReg, liveData }
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
    <div className="ns-i-wrap ns-i-page" style={{ ['--tc' as string]: `var(${TOOL.accent})` }}>
      {!isReport && (
        <ToolHead
          eyebrow="Phase 1 · Structure"
          name={TOOL.name}
          price={`Full report ${TOOL.price}`}
          blurb="How much concrete and steel your frame needs, item by item: foundation, columns, beams and slabs, worked out to the Indian Standards."
          art={TOOL.plate}
          artAlt={TOOL.plateAlt}
        />
      )}
      <StepBar steps={STEPS} current={STEP_IX[step]} />

      <AnimatePresence mode="wait">
        {step === 'register' && (
          <motion.div key="register" variants={v} initial="initial" animate="animate" exit="exit">
            {withRail(<RegistrationForm onSubmit={handleRegistration} />)}
          </motion.div>
        )}

        {step === 'project_pick' && (
          <motion.div key="project_pick" variants={v} initial="initial" animate="animate" exit="exit">
            {withRail(<ProjectPicker onSelect={handleProjectSelect} toolName={TOOL.name} />)}
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
                <BuildDetails
                  state={session.selectedProject?.state ?? session.regData.state}
                  city={session.selectedProject?.city ?? session.regData.city}
                  projectName={session.selectedProject?.projectName ?? session.regData.projectName}
                  initialProject={session.selectedProject ?? undefined}
                  onSubmit={handleDetails}
                  onFormChange={setLiveData}
                  onBack={() => setStep('project_pick')}
                />
              </>
            )}
          </motion.div>
        )}

        {step === 'results' && session.free && (
          <motion.div key="results" variants={v} initial="initial" animate="animate" exit="exit">
            <ResultsV2
              free={session.free}
              estimateId={session.estimateId}
              contactName={session.regData.name}
              projectName={session.selectedProject?.projectName ?? session.regData.projectName ?? ''}
              onStartOver={handleStartOver}
            />
          </motion.div>
        )}

      </AnimatePresence>

      {calcBusy && (
        <div className="ns-r-busy" role="status" aria-live="polite">
          <div className="ns-r-busy__card">
            <span className="ns-r-busy__spin" aria-hidden="true" />
            <p>Working out your structure…</p>
            <small>Sizing the footings, columns, beams and slabs to the IS codes. This takes a few seconds.</small>
          </div>
        </div>
      )}
    </div>
  )
}
