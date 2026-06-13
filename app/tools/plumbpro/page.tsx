'use client'

import { useState } from 'react'
import RegistrationForm, { type PlumbRegData } from './components/RegistrationForm'
import MethodSelection from './components/MethodSelection'
import BuildDetails from './components/BuildDetails'
import ResultsPage from './components/ResultsPage'
import { runCalculation, type PlumbInput, type PlumbResult } from './plumbpro-engine'

type Step = 'register' | 'method' | 'details' | 'results'

interface SessionState {
  regData:    PlumbRegData
  contactId:  string
  estimateId: string | null
  input:      PlumbInput | null
  result:     PlumbResult | null
}

export default function PlumbProPage() {
  const [step, setStep]       = useState<Step>('register')
  const [session, setSession] = useState<SessionState>({
    regData:    {} as PlumbRegData,
    contactId:  '',
    estimateId: null,
    input:      null,
    result:     null,
  })

  function handleRegistration(data: PlumbRegData, contactId: string) {
    setSession(prev => ({ ...prev, regData: data, contactId }))
    setStep('method')
  }

  function handleMethod() {
    setStep('details')
  }

  async function handleDetails(input: PlumbInput) {
    const result = runCalculation(input)
    setSession(prev => ({ ...prev, input, result }))
    setStep('results')

    try {
      const res = await fetch('/api/plumbpro/save-estimate', {
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
    setSession({
      regData:    {} as PlumbRegData,
      contactId:  '',
      estimateId: null,
      input:      null,
      result:     null,
    })
  }

  if (step === 'register') return <RegistrationForm onSubmit={handleRegistration} />
  if (step === 'method')   return <MethodSelection onSelect={handleMethod} />
  if (step === 'details') {
    return (
      <BuildDetails
        state={session.regData.state}
        city={session.regData.city}
        onSubmit={handleDetails}
      />
    )
  }
  if (step === 'results' && session.result && session.input) {
    return (
      <ResultsPage
        result={session.result}
        input={session.input}
        estimateId={session.estimateId}
        contactName={session.regData.name}
        onStartOver={handleStartOver}
      />
    )
  }

  return null
}
