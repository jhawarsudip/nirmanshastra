'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import RegistrationForm, { type InteriorRegData } from './components/RegistrationForm'
import MethodSelection from './components/MethodSelection'
import BuildDetails from './components/BuildDetails'
import ResultsPage from './components/ResultsPage'
import { runCalculation, type InteriorInput, type InteriorResult } from './interiorpro-engine'
import InteriorBackground from '@/components/backgrounds/InteriorBackground'
import WizardStepBar from '@/components/ui/WizardStepBar'
import LiveSummaryPanel, { type LiveSummaryData } from '@/components/ui/LiveSummaryPanel'
import ProjectPicker, { type SelectedProject } from '@/components/ui/ProjectPicker'
import { saveProjectToSession } from '@/lib/project-session'

type Step = 'register' | 'project_pick' | 'method' | 'details' | 'results'

interface SessionState {
  regData:         InteriorRegData
  contactId:       string
  estimateId:      string | null
  input:           InteriorInput | null
  result:          InteriorResult | null
  selectedProject: SelectedProject | null
}

const stepVariants = {
  initial: { opacity: 0, x: 18 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.28, ease: 'easeOut' as const } },
  exit:    { opacity: 0, x: -18, transition: { duration: 0.18, ease: 'easeIn' as const } },
}

export default function InteriorProPage() {
  const [step, setStep]         = useState<Step>('register')
  const [liveData, setLiveData] = useState<LiveSummaryData>({})
  const [session, setSession]   = useState<SessionState>({
    regData:         {} as InteriorRegData,
    contactId:       '',
    estimateId:      null,
    input:           null,
    result:          null,
    selectedProject: null,
  })

  function handleRegistration(data: InteriorRegData, contactId: string) {
    setSession(prev => ({ ...prev, regData: data, contactId }))
    setStep('project_pick')
  }

  function handleProjectSelect(project: SelectedProject | null) {
    setSession(prev => ({ ...prev, selectedProject: project }))
    setStep('method')
  }

  function handleMethod() {
    setStep('details')
  }

  async function handleDetails(input: InteriorInput) {
    const result = runCalculation(input)
    setSession(prev => ({ ...prev, input, result }))
    setStep('results')

    // InteriorPro numFloors: 1=G, 2=G+1 … normalized total floors
    const dbNumFloors = input.numFloors

    saveProjectToSession({
      projectId:     session.selectedProject?.projectId ?? '',
      projectName:   input.projectName || session.regData.projectName,
      city:          input.city,
      state:         input.state,
      numFloors:     dbNumFloors,
      perFloorAreas: null,
    })

    try {
      let projectId = session.selectedProject?.projectId ?? null

      if (session.selectedProject && projectId) {
        const sp = session.selectedProject
        const patch: Record<string, unknown> = {}
        if (input.state !== sp.state)        patch.state        = input.state
        if (input.city  !== sp.city)         patch.city         = input.city
        if (dbNumFloors !== sp.numFloors)    patch.num_floors   = dbNumFloors
        if (input.projectName !== sp.projectName) patch.project_name = input.projectName
        if (Object.keys(patch).length > 0) {
          fetch(`/api/projects/${projectId}`, {
            method:  'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(patch),
          }).catch(console.error)
        }
      } else {
        const projRes = await fetch('/api/projects', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectName: input.projectName || session.regData.projectName,
            city:        input.city,
            state:       input.state,
            numFloors:   dbNumFloors,
          }),
        })
        const projJson = await projRes.json()
        projectId = projJson.projectId ?? null
      }

      const res = await fetch('/api/interiorpro/save-estimate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId:   session.contactId,
          projectName: input.projectName || session.regData.projectName,
          state:       input.state,
          city:        input.city,
          inputData:   input,
          resultData:  result,
          projectId,
        }),
      })
      const json = await res.json()
      if (json.estimateId) {
        setSession(prev => ({ ...prev, estimateId: json.estimateId }))
      }
    } catch (err) {
      console.error('Failed to save estimate:', err)
    }
  }

  function handleStartOver() {
    setStep('register')
    setLiveData({})
    setSession({
      regData:         {} as InteriorRegData,
      contactId:       '',
      estimateId:      null,
      input:           null,
      result:          null,
      selectedProject: null,
    })
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)', position: 'relative' }}>
      <InteriorBackground />
      <div style={{ position: 'relative', zIndex: 1 }}>
      <WizardStepBar currentStep={step} toolName="InteriorPro" toolPhase="P5" />

      <AnimatePresence mode="wait">
        {step === 'register' && (
          <motion.div key="register" variants={stepVariants} initial="initial" animate="animate" exit="exit">
            <div className="flex min-h-screen" style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: '0 0 58%', minWidth: 0 }}>
                <RegistrationForm onSubmit={handleRegistration} />
              </div>
              <div style={{ flex: '0 0 42%', minWidth: 0, position: 'sticky', top: 0, alignSelf: 'flex-start', maxHeight: '100vh', overflowY: 'auto' }}>
                <LiveSummaryPanel toolName="InteriorPro" toolPhase="P5" price="₹899" regData={session.regData} liveData={liveData} />
              </div>
            </div>
          </motion.div>
        )}
        {step === 'project_pick' && (
          <motion.div key="project_pick" variants={stepVariants} initial="initial" animate="animate" exit="exit">
            <div className="flex min-h-screen" style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: '0 0 58%', minWidth: 0 }}>
                <ProjectPicker onSelect={handleProjectSelect} toolName="InteriorPro" />
              </div>
              <div style={{ flex: '0 0 42%', minWidth: 0, position: 'sticky', top: 0, alignSelf: 'flex-start', maxHeight: '100vh', overflowY: 'auto' }}>
                <LiveSummaryPanel toolName="InteriorPro" toolPhase="P5" price="₹899" regData={session.regData} liveData={liveData} />
              </div>
            </div>
          </motion.div>
        )}
        {step === 'method' && (
          <motion.div key="method" variants={stepVariants} initial="initial" animate="animate" exit="exit">
            <div className="flex min-h-screen" style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: '0 0 58%', minWidth: 0 }}>
                <MethodSelection onSelect={handleMethod} />
              </div>
              <div style={{ flex: '0 0 42%', minWidth: 0, position: 'sticky', top: 0, alignSelf: 'flex-start', maxHeight: '100vh', overflowY: 'auto' }}>
                <LiveSummaryPanel toolName="InteriorPro" toolPhase="P5" price="₹899" regData={session.regData} liveData={liveData} />
              </div>
            </div>
          </motion.div>
        )}
        {step === 'details' && (
          <motion.div key="details" variants={stepVariants} initial="initial" animate="animate" exit="exit">
            <div className="flex min-h-screen" style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: '0 0 58%', minWidth: 0 }}>
                <BuildDetails
                  state={session.selectedProject?.state ?? session.regData.state}
                  city={session.selectedProject?.city ?? session.regData.city}
                  initialProject={session.selectedProject ?? undefined}
                  onSubmit={handleDetails}
                  onFormChange={setLiveData}
                  onBack={() => setStep('method')}
                />
              </div>
              <div style={{ flex: '0 0 42%', minWidth: 0, position: 'sticky', top: 0, alignSelf: 'flex-start', maxHeight: '100vh', overflowY: 'auto' }}>
                <LiveSummaryPanel
                  toolName="InteriorPro"
                  toolPhase="P5"
                  price="₹899"
                  regData={session.regData}
                  liveData={liveData}
                />
              </div>
            </div>
          </motion.div>
        )}
        {step === 'results' && session.result && session.input && (
          <motion.div key="results" variants={stepVariants} initial="initial" animate="animate" exit="exit">
            <ResultsPage
              result={session.result}
              input={session.input}
              estimateId={session.estimateId}
              contactName={session.regData.name}
              onStartOver={handleStartOver}
            />
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  )
}
