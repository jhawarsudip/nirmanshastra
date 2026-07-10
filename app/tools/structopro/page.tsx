'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import RegistrationForm, { type StructoRegData } from './components/RegistrationForm'
import MethodSelection from './components/MethodSelection'
import BuildDetails from './components/BuildDetails'
import ResultsPage from './components/ResultsPage'
import VerticalExtensionDetails from './components/VerticalExtensionDetails'
import VEResultsPage from './components/VEResultsPage'
import { runCalculation, type StructoInput, type StructoResult } from './structopro-engine'
import { runVECalculation, type VEInput, type VEResult } from './structopro-ve-engine'
import StructureBackground from '@/components/backgrounds/StructureBackground'
import WizardStepBar from '@/components/ui/WizardStepBar'
import LiveSummaryPanel, { type LiveSummaryData } from '@/components/ui/LiveSummaryPanel'
import ProjectPicker, { type SelectedProject } from '@/components/ui/ProjectPicker'
import { saveProjectToSession } from '@/lib/project-session'

const stepVariants = {
  initial: { opacity: 0, x: 18 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.28, ease: 'easeOut' as const } },
  exit:    { opacity: 0, x: -18, transition: { duration: 0.18, ease: 'easeIn' as const } },
}

type Step = 'register' | 'project_pick' | 'method' | 'details' | 'results' | 've_details' | 've_results'

interface SessionState {
  regData:         StructoRegData
  contactId:       string
  estimateId:      string | null
  input:           StructoInput | null
  result:          StructoResult | null
  veInput:         VEInput | null
  veResult:        VEResult | null
  selectedProject: SelectedProject | null
}

export default function StructoProPage() {
  const [step, setStep]         = useState<Step>('register')
  const [liveData, setLiveData] = useState<LiveSummaryData>({})
  const [session, setSession]   = useState<SessionState>({
    regData:         {} as StructoRegData,
    contactId:       '',
    estimateId:      null,
    input:           null,
    result:          null,
    veInput:         null,
    veResult:        null,
    selectedProject: null,
  })

  function handleRegistration(data: StructoRegData, contactId: string) {
    setSession(prev => ({ ...prev, regData: data, contactId }))
    setStep('project_pick')
  }

  function handleProjectSelect(project: SelectedProject | null) {
    setSession(prev => ({ ...prev, selectedProject: project }))
    setStep('method')
  }

  function handleMethod(method: 'design_myself' | 'vertical_extension') {
    if (method === 'design_myself') setStep('details')
    else if (method === 'vertical_extension') setStep('ve_details')
  }

  async function handleDetails(input: StructoInput) {
    const result = runCalculation(input)
    setSession(prev => ({ ...prev, input, result }))
    setStep('results')

    // Normalize floors: StructoPro numFloors is G+ count, total = numFloors+1
    const dbNumFloors = input.numFloors + 1
    const dbPerFloorAreas = input.perFloorAreas
      ? input.perFloorAreas
      : (input.groundFloorAreaSqft > 0 ? [input.groundFloorAreaSqft] : null)

    // Persist project to localStorage immediately — works for both auth and non-auth users,
    // and survives the case where the projects DB table doesn't yet exist.
    saveProjectToSession({
      projectId:     session.selectedProject?.projectId ?? '',
      projectName:   input.projectName || session.regData.projectName || '',
      city:          input.city,
      state:         input.state,
      numFloors:     dbNumFloors,
      perFloorAreas: dbPerFloorAreas,
    })

    try {
      let projectId = session.selectedProject?.projectId ?? null

      if (session.selectedProject && projectId) {
        // Write back only changed shared fields
        const sp = session.selectedProject
        const patch: Record<string, unknown> = {}
        if (input.state !== sp.state)          patch.state        = input.state
        if (input.city  !== sp.city)           patch.city         = input.city
        if (dbNumFloors !== sp.numFloors)      patch.num_floors   = dbNumFloors
        // compare perFloorAreas arrays
        const spAreas = sp.perFloorAreas
        const areasChanged = JSON.stringify(dbPerFloorAreas) !== JSON.stringify(spAreas)
        if (areasChanged) patch.per_floor_areas = dbPerFloorAreas
        if (Object.keys(patch).length > 0) {
          fetch(`/api/projects/${projectId}`, {
            method:  'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(patch),
          }).catch(console.error)
        }
      } else {
        // Create new project
        const projRes = await fetch('/api/projects', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectName:    input.projectName,
            city:           input.city,
            state:          input.state,
            numFloors:      dbNumFloors,
            perFloorAreas:  dbPerFloorAreas,
          }),
        })
        const projJson = await projRes.json()
        projectId = projJson.projectId ?? null
      }

      const res = await fetch('/api/structopro/save-estimate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId:   session.contactId,
          projectName: input.projectName,
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

  async function handleVEDetails(veInput: VEInput) {
    const veResult = runVECalculation(veInput)
    setSession(prev => ({ ...prev, veInput, veResult }))
    setStep('ve_results')

    try {
      const res = await fetch('/api/structopro/save-estimate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId:   session.contactId,
          projectName: veInput.projectName || session.regData.projectName,
          state:       veInput.state,
          city:        veInput.city,
          inputData:   { ...veInput, estimateType: 'vertical_extension' },
          resultData:  veResult,
        }),
      })
      const json = await res.json()
      if (json.estimateId) {
        setSession(prev => ({ ...prev, estimateId: json.estimateId }))
      }
    } catch (err) {
      console.error('Failed to save VE estimate:', err)
    }
  }

  function handleStartOver() {
    setStep('register')
    setLiveData({})
    setSession({
      regData:         {} as StructoRegData,
      contactId:       '',
      estimateId:      null,
      input:           null,
      result:          null,
      veInput:         null,
      veResult:        null,
      selectedProject: null,
    })
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)', position: 'relative' }}>
      <StructureBackground />
      <div style={{ position: 'relative', zIndex: 1 }}>
      {/* Step bar — always visible */}
      <WizardStepBar currentStep={step === 've_details' || step === 've_results' ? 'details' : step} toolName="StructurePro" toolPhase="P1" />

      <AnimatePresence mode="wait">
        {step === 'register' && (
          <motion.div key="register" variants={stepVariants} initial="initial" animate="animate" exit="exit">
            <div className="flex min-h-screen" style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: '0 0 58%', minWidth: 0 }}>
                <RegistrationForm onSubmit={handleRegistration} />
              </div>
              <div style={{ flex: '0 0 42%', minWidth: 0, position: 'sticky', top: 0, alignSelf: 'flex-start', maxHeight: '100vh', overflowY: 'auto' }}>
                <LiveSummaryPanel toolName="StructurePro" toolPhase="P1" price="₹999" regData={session.regData} liveData={liveData} />
              </div>
            </div>
          </motion.div>
        )}

        {step === 'project_pick' && (
          <motion.div key="project_pick" variants={stepVariants} initial="initial" animate="animate" exit="exit">
            <div className="flex min-h-screen" style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: '0 0 58%', minWidth: 0 }}>
                <ProjectPicker onSelect={handleProjectSelect} toolName="StructurePro" />
              </div>
              <div style={{ flex: '0 0 42%', minWidth: 0, position: 'sticky', top: 0, alignSelf: 'flex-start', maxHeight: '100vh', overflowY: 'auto' }}>
                <LiveSummaryPanel toolName="StructurePro" toolPhase="P1" price="₹999" regData={session.regData} liveData={liveData} />
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
                <LiveSummaryPanel toolName="StructurePro" toolPhase="P1" price="₹999" regData={session.regData} liveData={liveData} />
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
                  projectName={session.selectedProject?.projectName ?? session.regData.projectName}
                  initialProject={session.selectedProject ?? undefined}
                  onSubmit={handleDetails}
                  onFormChange={setLiveData}
                  onBack={() => setStep('method')}
                />
              </div>
              <div style={{ flex: '0 0 42%', minWidth: 0, position: 'sticky', top: 0, alignSelf: 'flex-start', maxHeight: '100vh', overflowY: 'auto' }}>
                <LiveSummaryPanel
                  toolName="StructurePro"
                  toolPhase="P1"
                  price="₹999"
                  regData={session.regData}
                  liveData={liveData}
                />
              </div>
            </div>
          </motion.div>
        )}

        {step === 've_details' && (
          <motion.div key="ve_details" variants={stepVariants} initial="initial" animate="animate" exit="exit">
            <div className="flex min-h-screen" style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: '0 0 58%', minWidth: 0 }}>
                <VerticalExtensionDetails
                  state={session.regData.state}
                  city={session.regData.city}
                  onSubmit={handleVEDetails}
                />
              </div>
              <div style={{ flex: '0 0 42%', minWidth: 0, position: 'sticky', top: 0, alignSelf: 'flex-start', maxHeight: '100vh', overflowY: 'auto' }}>
                <LiveSummaryPanel
                  toolName="StructurePro"
                  toolPhase="P1"
                  price="₹999"
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

        {step === 've_results' && session.veResult && session.veInput && (
          <motion.div key="ve_results" variants={stepVariants} initial="initial" animate="animate" exit="exit">
            <VEResultsPage
              result={session.veResult}
              input={session.veInput}
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
