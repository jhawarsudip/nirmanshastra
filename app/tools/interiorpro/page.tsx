'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import RegistrationForm, { type InteriorRegData } from './components/RegistrationForm'
import MethodSelection from './components/MethodSelection'
import BuildDetails from './components/BuildDetails'
import ResultsPage from './components/ResultsPage'
import { runCalculation, type InteriorInput, type InteriorResult } from './interiorpro-engine'
import WizardStepBar from '@/components/ui/WizardStepBar'
import LiveSummaryPanel, { type LiveSummaryData } from '@/components/ui/LiveSummaryPanel'

type Step = 'register' | 'method' | 'details' | 'results'

interface SessionState {
  regData:    InteriorRegData
  contactId:  string
  estimateId: string | null
  input:      InteriorInput | null
  result:     InteriorResult | null
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
    regData:    {} as InteriorRegData,
    contactId:  '',
    estimateId: null,
    input:      null,
    result:     null,
  })

  function handleRegistration(data: InteriorRegData, contactId: string) {
    setSession(prev => ({ ...prev, regData: data, contactId }))
    setStep('method')
  }

  function handleMethod() {
    setStep('details')
  }

  async function handleDetails(input: InteriorInput) {
    const result = runCalculation(input)
    setSession(prev => ({ ...prev, input, result }))
    setStep('results')

    try {
      const res = await fetch('/api/interiorpro/save-estimate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId:   session.contactId,
          projectName: session.regData.projectName,
          state:       input.state,
          city:        input.city,
          inputData:   input,
          resultData:  result,
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
      regData:    {} as InteriorRegData,
      contactId:  '',
      estimateId: null,
      input:      null,
      result:     null,
    })
  }

  return (
    <div className="min-h-screen" style={{ background: '#F4F4F0' }}>
      <WizardStepBar currentStep={step} toolName="InteriorPro" toolPhase="P5" />

      <AnimatePresence mode="wait">
        {step === 'register' && (
          <motion.div key="register" variants={stepVariants} initial="initial" animate="animate" exit="exit">
            <div className="flex min-h-screen" style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: '0 0 58%', minWidth: 0 }}>
                <RegistrationForm onSubmit={handleRegistration} />
              </div>
              <div style={{ flex: '0 0 42%', minWidth: 0, position: 'sticky', top: 0, alignSelf: 'flex-start', maxHeight: '100vh', overflowY: 'auto' }}>
                <LiveSummaryPanel toolName="InteriorPro" toolPhase="P5" regData={session.regData} liveData={liveData} />
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
                <LiveSummaryPanel toolName="InteriorPro" toolPhase="P5" regData={session.regData} liveData={liveData} />
              </div>
            </div>
          </motion.div>
        )}
        {step === 'details' && (
          <motion.div key="details" variants={stepVariants} initial="initial" animate="animate" exit="exit">
            <div className="flex min-h-screen" style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: '0 0 58%', minWidth: 0 }}>
                <BuildDetails
                  state={session.regData.state}
                  city={session.regData.city}
                  onSubmit={handleDetails}
                  onFormChange={setLiveData}
                  onBack={() => setStep('method')}
                />
              </div>
              <div style={{ flex: '0 0 42%', minWidth: 0, position: 'sticky', top: 0, alignSelf: 'flex-start', maxHeight: '100vh', overflowY: 'auto' }}>
                <LiveSummaryPanel
                  toolName="InteriorPro"
                  toolPhase="P5"
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
  )
}
