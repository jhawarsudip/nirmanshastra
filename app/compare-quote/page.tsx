'use client'

import { useState, useCallback, useRef } from 'react'
import ProjectPicker, { type SelectedProject } from '@/components/ui/ProjectPicker'
import { STATE_CITIES, INDIAN_STATES_LIST } from '@/lib/state-cities'
import type { ExtractionResult, ExtractedLineItem } from '@/app/api/compare-quote/extract/route'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProjectInfo {
  city:       string
  state:      string
  floorArea:  number | null
  numFloors:  number | null   // total including ground (G=1, G+1=2 …)
  projectName: string | null
}

type Step = 'project_pick' | 'new_project_form' | 'upload' | 'results'

interface FeedbackState {
  rating:    'yes' | 'no' | null
  comment:   string
  submitted: boolean
}

// ─── Style helpers ─────────────────────────────────────────────────────────────

const mono:  React.CSSProperties = { fontFamily: 'var(--font-plex-mono)' }
const sans:  React.CSSProperties = { fontFamily: 'var(--font-plex-sans)' }
const serif: React.CSSProperties = { fontFamily: 'var(--font-plex-serif)' }

function inputStyle(error?: boolean): React.CSSProperties {
  return {
    ...sans,
    width:        '100%',
    boxSizing:    'border-box',
    border:       `1px solid ${error ? '#8C3A22' : 'rgba(30,34,39,0.25)'}`,
    borderRadius: 6,
    padding:      '10px 12px',
    fontSize:     14,
    color:        '#1E2227',
    background:   '#fff',
    outline:      'none',
  }
}

// ─── Step indicator ────────────────────────────────────────────────────────────

function StepBar({ current }: { current: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: 'project_pick',    label: 'Project'  },
    { id: 'upload',          label: 'Upload'   },
    { id: 'results',         label: 'Review'   },
  ]
  // new_project_form counts as project_pick visually
  const active = current === 'new_project_form' ? 'project_pick' : current
  const idx    = steps.findIndex(s => s.id === active)

  return (
    <div style={{ background: '#1E2227', borderBottom: '1px solid rgba(244,244,240,0.08)' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 0 }}>
        {steps.map((s, i) => {
          const done = i < idx
          const here = i === idx
          return (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : undefined }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width:      20,
                  height:     20,
                  borderRadius: '50%',
                  border:     `1.5px solid ${done ? '#14532D' : here ? '#F4F4F0' : 'rgba(244,244,240,0.25)'}`,
                  background: done ? '#14532D' : here ? '#F4F4F0' : 'transparent',
                  display:    'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {done
                    ? <span style={{ ...mono, fontSize: 9, color: '#fff' }}>✓</span>
                    : <span style={{ ...mono, fontSize: 9, color: here ? '#1E2227' : 'rgba(244,244,240,0.35)' }}>{i + 1}</span>
                  }
                </div>
                <span style={{ ...mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: here ? '#F4F4F0' : done ? '#14532D' : 'rgba(244,244,240,0.3)' }}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div style={{ flex: 1, height: 1, background: done ? '#14532D' : 'rgba(244,244,240,0.12)', margin: '0 10px' }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Condensed new-project form ───────────────────────────────────────────────

function NewProjectForm({ onSubmit }: { onSubmit: (info: ProjectInfo) => void }) {
  const [state,     setState]     = useState('')
  const [city,      setCity]      = useState('')
  const [floorArea, setFloorArea] = useState('')
  const [numFloors, setNumFloors] = useState('')
  const [errors,    setErrors]    = useState<Record<string, string>>({})

  const cities = state ? (STATE_CITIES[state] ?? []) : []

  function handleStateChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setState(e.target.value)
    setCity('')
    setErrors(prev => ({ ...prev, state: '', city: '' }))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!state)            e.state     = 'State is required'
    if (!city)             e.city      = 'City is required'
    if (!floorArea.trim() || isNaN(Number(floorArea)) || Number(floorArea) <= 0)
                           e.floorArea = 'Enter a valid floor area'
    if (!numFloors)        e.numFloors = 'Select number of floors'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    onSubmit({
      city,
      state,
      floorArea:  Number(floorArea),
      numFloors:  Number(numFloors),
      projectName: null,
    })
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '48px 24px' }}>
      <p style={{ ...mono, fontSize: 11, color: '#1F4E79', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
        STEP 01 · PROJECT DETAILS
      </p>
      <h2 style={{ ...serif, fontSize: 28, fontWeight: 700, color: '#1E2227', lineHeight: 1.2, marginBottom: 6 }}>
        Tell us about your project
      </h2>
      <p style={{ ...sans, fontSize: 15, color: 'rgba(30,34,39,0.55)', marginBottom: 32 }}>
        We need these to contextualise the quote later. No structural details — just location and scale.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* State + City (State first — City options depend on State) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ ...sans, fontSize: 12, fontWeight: 600, color: '#1E2227', display: 'block', marginBottom: 6 }}>
              State *
            </label>
            <select
              value={state}
              onChange={handleStateChange}
              style={{ ...inputStyle(!!errors.state), appearance: 'auto' }}
            >
              <option value="">Select state</option>
              {INDIAN_STATES_LIST.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {errors.state && <p style={{ ...mono, fontSize: 10, color: '#8C3A22', marginTop: 4 }}>{errors.state}</p>}
          </div>

          <div>
            <label style={{ ...sans, fontSize: 12, fontWeight: 600, color: '#1E2227', display: 'block', marginBottom: 6 }}>
              City / Town *
            </label>
            <select
              value={city}
              onChange={e => { setCity(e.target.value); setErrors(prev => ({ ...prev, city: '' })) }}
              disabled={!state}
              style={{ ...inputStyle(!!errors.city), appearance: 'auto', opacity: state ? 1 : 0.5, cursor: state ? 'pointer' : 'not-allowed' }}
            >
              <option value="">{state ? 'Select city' : 'Select state first'}</option>
              {cities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.city && <p style={{ ...mono, fontSize: 10, color: '#8C3A22', marginTop: 4 }}>{errors.city}</p>}
          </div>
        </div>

        {/* Floor area + Floors */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ ...sans, fontSize: 12, fontWeight: 600, color: '#1E2227', display: 'block', marginBottom: 6 }}>
              Approximate floor area (sqft) *
            </label>
            <input
              type="number"
              value={floorArea}
              onChange={e => { setFloorArea(e.target.value); setErrors(prev => ({ ...prev, floorArea: '' })) }}
              placeholder="e.g. 1200"
              min={1}
              style={{ ...inputStyle(!!errors.floorArea), fontFamily: 'var(--font-plex-mono)' }}
            />
            {errors.floorArea && <p style={{ ...mono, fontSize: 10, color: '#8C3A22', marginTop: 4 }}>{errors.floorArea}</p>}
          </div>

          <div>
            <label style={{ ...sans, fontSize: 12, fontWeight: 600, color: '#1E2227', display: 'block', marginBottom: 6 }}>
              Number of floors *
            </label>
            <select
              value={numFloors}
              onChange={e => { setNumFloors(e.target.value); setErrors(prev => ({ ...prev, numFloors: '' })) }}
              style={{ ...inputStyle(!!errors.numFloors), appearance: 'auto', fontFamily: 'var(--font-plex-mono)' }}
            >
              <option value="">Select</option>
              <option value="1">G (Ground only)</option>
              <option value="2">G+1</option>
              <option value="3">G+2</option>
              <option value="4">G+3</option>
              <option value="5">G+4</option>
              <option value="6">G+5</option>
            </select>
            {errors.numFloors && <p style={{ ...mono, fontSize: 10, color: '#8C3A22', marginTop: 4 }}>{errors.numFloors}</p>}
          </div>
        </div>

        <button
          type="submit"
          style={{
            ...sans,
            background:    '#8C3A22',
            color:         '#F4F4F0',
            border:        'none',
            borderRadius:  6,
            padding:       '14px 28px',
            fontSize:      15,
            fontWeight:    600,
            cursor:        'pointer',
            letterSpacing: '0.02em',
            marginTop:     8,
            alignSelf:     'flex-start',
          }}
        >
          Continue to Upload →
        </button>
      </form>
    </div>
  )
}

// ─── Upload section ────────────────────────────────────────────────────────────

function UploadSection({
  projectInfo,
  onDone,
}: {
  projectInfo: ProjectInfo
  onDone: (extraction: ExtractionResult) => void
}) {
  const [file,       setFile]       = useState<File | null>(null)
  const [loading,    setLoading]    = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error,      setError]      = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const floorLabel = projectInfo.numFloors
    ? projectInfo.numFloors === 1 ? 'G' : `G+${projectInfo.numFloors - 1}`
    : null

  async function handleExtract() {
    if (!file) return
    setError('')
    setLoading(true)

    try {
      // 1. Upload
      setLoadingMsg('Uploading your quote…')
      const fd = new FormData()
      fd.append('file', file)
      const uploadRes  = await fetch('/api/compare-quote/upload', { method: 'POST', body: fd })
      const uploadJson = await uploadRes.json()
      if (!uploadRes.ok || !uploadJson.success) {
        setError(uploadJson.error ?? 'Upload failed — please try again.')
        setLoading(false)
        return
      }

      // 2. Extract
      setLoadingMsg('AI is reading your quote — this takes 15–30 seconds…')
      const extractRes  = await fetch('/api/compare-quote/extract', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          storagePath: uploadJson.storagePath,
          fileType:    uploadJson.fileType,
        }),
      })
      const extractJson = await extractRes.json()
      if (!extractRes.ok || !extractJson.success) {
        setError(extractJson.error ?? 'Extraction failed — please try a clearer image or PDF.')
        setLoading(false)
        return
      }

      const extraction = extractJson.extraction as ExtractionResult | { error: string }
      if ('error' in extraction) {
        setError(`AI says: ${extraction.error}`)
        setLoading(false)
        return
      }

      onDone(extraction)
    } catch {
      setError('Network error — please check your connection and try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '48px 24px' }}>
      <p style={{ ...mono, fontSize: 11, color: '#1F4E79', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
        STEP 02 · UPLOAD QUOTE
      </p>
      <h2 style={{ ...serif, fontSize: 28, fontWeight: 700, color: '#1E2227', lineHeight: 1.2, marginBottom: 6 }}>
        Upload your contractor&rsquo;s quote
      </h2>
      <p style={{ ...sans, fontSize: 15, color: 'rgba(30,34,39,0.55)', marginBottom: 24 }}>
        We&rsquo;ll extract every line item, quantity, and price so you can see exactly what your contractor is billing.
      </p>

      {/* Project context badge */}
      <div style={{
        display:      'flex',
        alignItems:   'center',
        gap:          12,
        background:   'rgba(31,78,121,0.06)',
        border:       '1px solid rgba(31,78,121,0.18)',
        borderRadius: 4,
        padding:      '10px 14px',
        marginBottom: 28,
      }}>
        <span style={{ ...mono, fontSize: 10, color: '#1F4E79', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Project
        </span>
        <span style={{ ...mono, fontSize: 12, color: '#1E2227' }}>
          {projectInfo.projectName ?? 'New project'}
        </span>
        <span style={{ ...mono, fontSize: 11, color: 'rgba(30,34,39,0.45)' }}>·</span>
        <span style={{ ...mono, fontSize: 12, color: '#1E2227' }}>
          {projectInfo.city}, {projectInfo.state}
        </span>
        {floorLabel && (
          <>
            <span style={{ ...mono, fontSize: 11, color: 'rgba(30,34,39,0.45)' }}>·</span>
            <span style={{ ...mono, fontSize: 12, color: '#1E2227' }}>{floorLabel}</span>
          </>
        )}
        {projectInfo.floorArea && (
          <>
            <span style={{ ...mono, fontSize: 11, color: 'rgba(30,34,39,0.45)' }}>·</span>
            <span style={{ ...mono, fontSize: 12, color: '#1E2227' }}>{projectInfo.floorArea.toLocaleString('en-IN')} sqft</span>
          </>
        )}
      </div>

      {/* Drop zone */}
      <div
        onClick={() => !loading && inputRef.current?.click()}
        style={{
          border:       `2px dashed ${file ? '#14532D' : 'rgba(30,34,39,0.25)'}`,
          borderRadius: 6,
          padding:      '36px 24px',
          textAlign:    'center',
          cursor:       loading ? 'not-allowed' : 'pointer',
          background:   file ? 'rgba(20,83,45,0.03)' : '#fff',
          marginBottom: 16,
          transition:   'border-color 0.2s',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={e => {
            const f = e.target.files?.[0] ?? null
            setFile(f)
            setError('')
          }}
          style={{ display: 'none' }}
          disabled={loading}
        />

        {file ? (
          <>
            <div style={{ ...mono, fontSize: 22, marginBottom: 8 }}>📄</div>
            <p style={{ ...mono, fontSize: 13, color: '#14532D', fontWeight: 500, marginBottom: 4 }}>
              {file.name}
            </p>
            <p style={{ ...mono, fontSize: 11, color: 'rgba(30,34,39,0.45)' }}>
              {(file.size / 1024).toFixed(0)} KB · {file.type.includes('pdf') ? 'PDF' : 'Image'}
              {' '}· <span style={{ color: '#1F4E79', cursor: 'pointer' }} onClick={e => { e.stopPropagation(); setFile(null); if (inputRef.current) inputRef.current.value = '' }}>Change file</span>
            </p>
          </>
        ) : (
          <>
            <div style={{ ...mono, fontSize: 28, marginBottom: 12, color: 'rgba(30,34,39,0.3)' }}>⬆</div>
            <p style={{ ...sans, fontSize: 14, fontWeight: 600, color: '#1E2227', marginBottom: 4 }}>
              Click to select your contractor&rsquo;s quote
            </p>
            <p style={{ ...sans, fontSize: 12, color: 'rgba(30,34,39,0.45)' }}>
              PDF, JPG, or PNG · max 10 MB
            </p>
          </>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{
          background:   'rgba(31,78,121,0.05)',
          border:       '1px solid rgba(31,78,121,0.15)',
          borderRadius: 4,
          padding:      '14px 16px',
          marginBottom: 16,
          display:      'flex',
          alignItems:   'center',
          gap:          10,
        }}>
          <span style={{ ...mono, fontSize: 18, animation: 'spin 1s linear infinite' }}>⟳</span>
          <span style={{ ...sans, fontSize: 13, color: '#1F4E79' }}>{loadingMsg}</span>
          <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background:   'rgba(140,58,34,0.06)',
          border:       '1px solid rgba(140,58,34,0.25)',
          borderRadius: 4,
          padding:      '12px 14px',
          marginBottom: 16,
        }}>
          <p style={{ ...sans, fontSize: 13, color: '#8C3A22' }}>⚠ {error}</p>
        </div>
      )}

      <button
        onClick={handleExtract}
        disabled={!file || loading}
        style={{
          ...sans,
          background:    !file || loading ? 'rgba(140,58,34,0.35)' : '#8C3A22',
          color:         '#F4F4F0',
          border:        'none',
          borderRadius:  6,
          padding:       '14px 28px',
          fontSize:      15,
          fontWeight:    600,
          cursor:        !file || loading ? 'not-allowed' : 'pointer',
          letterSpacing: '0.02em',
          width:         '100%',
        }}
      >
        {loading ? 'Extracting…' : 'Extract from Quote →'}
      </button>

      <p style={{ ...sans, fontSize: 12, color: 'rgba(30,34,39,0.4)', marginTop: 12, textAlign: 'center' }}>
        Your file is stored securely. No payment required.
      </p>
    </div>
  )
}

// ─── Results section ───────────────────────────────────────────────────────────

function ResultsSection({
  extraction,
  projectInfo,
  onStartOver,
}: {
  extraction:  ExtractionResult
  projectInfo: ProjectInfo
  onStartOver: () => void
}) {
  const [feedback, setFeedback] = useState<FeedbackState>({ rating: null, comment: '', submitted: false })

  function formatMoney(val: string | null): string {
    if (!val) return '—'
    const n = parseFloat(val.replace(/,/g, ''))
    if (isNaN(n)) return val
    if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`
    return `₹${n.toLocaleString('en-IN')}`
  }

  function handleFeedbackSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFeedback(prev => ({ ...prev, submitted: true }))
  }

  const hasLineItems = extraction.lineItems && extraction.lineItems.length > 0

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ ...mono, fontSize: 11, color: '#1F4E79', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          STEP 03 · REVIEW EXTRACTION · PHASE 1 TEST
        </p>
        <h2 style={{ ...serif, fontSize: 28, fontWeight: 700, color: '#1E2227', lineHeight: 1.2, marginBottom: 8 }}>
          Here&rsquo;s what we found in your quote
        </h2>
        <p style={{ ...sans, fontSize: 15, color: 'rgba(30,34,39,0.6)' }}>
          Please check this is accurate before we can build further comparison features.
        </p>
      </div>

      {/* Scope + Total summary */}
      <div style={{ display: 'grid', gridTemplateColumns: extraction.totalAmount ? '1fr auto' : '1fr', gap: 16, marginBottom: 28 }}>
        <div style={{
          background:   'rgba(31,78,121,0.04)',
          border:       '1px solid rgba(31,78,121,0.15)',
          borderRadius: 4,
          padding:      '16px 18px',
        }}>
          <p style={{ ...mono, fontSize: 10, color: '#1F4E79', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            Scope of Work
          </p>
          <p style={{ ...sans, fontSize: 14, color: '#1E2227', lineHeight: 1.5 }}>
            {extraction.scopeOfWork || '—'}
          </p>
        </div>

        {extraction.totalAmount && (
          <div style={{
            background:    'rgba(20,83,45,0.04)',
            border:        '1px solid rgba(20,83,45,0.18)',
            borderRadius:  4,
            padding:       '16px 24px',
            textAlign:     'center',
            minWidth:      140,
          }}>
            <p style={{ ...mono, fontSize: 10, color: '#14532D', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              Total Quoted
            </p>
            <p style={{ ...mono, fontSize: 24, fontWeight: 500, color: '#1E2227' }}>
              {formatMoney(extraction.totalAmount)}
            </p>
            <p style={{ ...mono, fontSize: 10, color: 'rgba(30,34,39,0.45)', marginTop: 2 }}>
              {projectInfo.city}, {projectInfo.state}
            </p>
          </div>
        )}
      </div>

      {/* Notes */}
      {extraction.notes && (
        <div style={{
          background:   'rgba(217,154,6,0.08)',
          border:       '1px solid rgba(217,154,6,0.3)',
          borderRadius: 4,
          padding:      '12px 14px',
          marginBottom: 24,
          display:      'flex',
          gap:          10,
        }}>
          <span style={{ fontSize: 14, flexShrink: 0 }}>⚠</span>
          <p style={{ ...sans, fontSize: 13, color: '#1E2227' }}>{extraction.notes}</p>
        </div>
      )}

      {/* Line items table */}
      {hasLineItems ? (
        <div style={{ border: '1px solid rgba(30,34,39,0.15)', borderRadius: 4, overflow: 'hidden', marginBottom: 32 }}>
          {/* Table header */}
          <div style={{
            display:         'grid',
            gridTemplateColumns: '32px 1fr 100px 80px 110px 110px',
            background:      '#1E2227',
            padding:         '8px 14px',
            gap:             12,
          }}>
            {['#', 'Description', 'Qty', 'Unit', 'Rate (₹)', 'Total (₹)'].map(h => (
              <span key={h} style={{ ...mono, fontSize: 10, color: 'rgba(244,244,240,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: h === '#' || h === 'Description' ? 'left' : 'right' }}>
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          {extraction.lineItems.map((item: ExtractedLineItem, i: number) => (
            <div
              key={i}
              style={{
                display:         'grid',
                gridTemplateColumns: '32px 1fr 100px 80px 110px 110px',
                padding:         '10px 14px',
                gap:             12,
                borderTop:       i > 0 ? '1px solid rgba(30,34,39,0.07)' : undefined,
                background:      i % 2 === 1 ? 'rgba(30,34,39,0.025)' : '#fff',
                alignItems:      'start',
              }}
            >
              <span style={{ ...mono, fontSize: 11, color: 'rgba(30,34,39,0.35)', paddingTop: 1 }}>{i + 1}</span>
              <span style={{ ...sans, fontSize: 13, color: '#1E2227', lineHeight: 1.4 }}>{item.description}</span>
              <span style={{ ...mono, fontSize: 12, color: '#1E2227', textAlign: 'right' }}>{item.quantity ?? '—'}</span>
              <span style={{ ...mono, fontSize: 11, color: 'rgba(30,34,39,0.55)', textAlign: 'right' }}>{item.unit ?? '—'}</span>
              <span style={{ ...mono, fontSize: 12, color: '#1E2227', textAlign: 'right' }}>
                {item.unitRate ? `₹${Number(item.unitRate).toLocaleString('en-IN')}` : '—'}
              </span>
              <span style={{ ...mono, fontSize: 12, color: '#1E2227', textAlign: 'right', fontWeight: 500 }}>
                {item.totalPrice ? formatMoney(item.totalPrice) : '—'}
              </span>
            </div>
          ))}

          {/* Footer total row */}
          {extraction.totalAmount && (
            <div style={{
              display:         'grid',
              gridTemplateColumns: '32px 1fr 100px 80px 110px 110px',
              padding:         '10px 14px',
              gap:             12,
              borderTop:       '2px solid rgba(30,34,39,0.15)',
              background:      'rgba(30,34,39,0.03)',
            }}>
              <span />
              <span style={{ ...mono, fontSize: 11, color: 'rgba(30,34,39,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Grand Total (as stated)
              </span>
              <span />
              <span />
              <span />
              <span style={{ ...mono, fontSize: 14, color: '#1E2227', fontWeight: 500, textAlign: 'right' }}>
                {formatMoney(extraction.totalAmount)}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div style={{
          border:       '1px solid rgba(30,34,39,0.12)',
          borderRadius: 4,
          padding:      '32px',
          textAlign:    'center',
          marginBottom: 32,
        }}>
          <p style={{ ...sans, fontSize: 14, color: 'rgba(30,34,39,0.5)' }}>
            No individual line items were detected in this document. The scope and total above are what the AI found.
          </p>
        </div>
      )}

      {/* ── Feedback section ─────────────────────────────────────── */}
      <div style={{
        border:       '1px solid rgba(30,34,39,0.15)',
        borderRadius: 4,
        padding:      '24px',
        marginBottom: 32,
      }}>
        <p style={{ ...mono, fontSize: 10, color: '#1F4E79', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          EXTRACTION QUALITY CHECK
        </p>
        <p style={{ ...serif, fontSize: 18, fontWeight: 700, color: '#1E2227', marginBottom: 6 }}>
          Was this extraction accurate?
        </p>
        <p style={{ ...sans, fontSize: 14, color: 'rgba(30,34,39,0.55)', marginBottom: 20 }}>
          Your feedback helps us improve AI extraction quality across different quote formats.
        </p>

        {feedback.submitted ? (
          <div style={{
            background:   'rgba(20,83,45,0.06)',
            border:       '1px solid rgba(20,83,45,0.2)',
            borderRadius: 4,
            padding:      '14px 16px',
          }}>
            <p style={{ ...sans, fontSize: 14, color: '#14532D', fontWeight: 600 }}>
              ✓ Thank you — your feedback has been recorded.
            </p>
            <p style={{ ...sans, fontSize: 13, color: 'rgba(30,34,39,0.55)', marginTop: 4 }}>
              This will help us decide whether Phase 2 (comparison against IS-code numbers) is worth building.
            </p>
          </div>
        ) : (
          <form onSubmit={handleFeedbackSubmit}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              {(['yes', 'no'] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setFeedback(prev => ({ ...prev, rating: r }))}
                  style={{
                    ...mono,
                    padding:       '10px 24px',
                    borderRadius:  6,
                    border:        feedback.rating === r
                      ? `2px solid ${r === 'yes' ? '#14532D' : '#8C3A22'}`
                      : '1.5px solid rgba(30,34,39,0.2)',
                    background:    feedback.rating === r
                      ? (r === 'yes' ? 'rgba(20,83,45,0.08)' : 'rgba(140,58,34,0.08)')
                      : '#fff',
                    color:         feedback.rating === r
                      ? (r === 'yes' ? '#14532D' : '#8C3A22')
                      : 'rgba(30,34,39,0.6)',
                    fontSize:      13,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    cursor:        'pointer',
                    transition:    'all 0.15s',
                  }}
                >
                  {r === 'yes' ? '✓ Yes, accurate' : '✗ No, needs correction'}
                </button>
              ))}
            </div>

            <textarea
              value={feedback.comment}
              onChange={e => setFeedback(prev => ({ ...prev, comment: e.target.value }))}
              placeholder="What was missing, wrong, or misread? (optional)"
              rows={3}
              style={{
                ...sans,
                width:        '100%',
                boxSizing:    'border-box',
                border:       '1px solid rgba(30,34,39,0.2)',
                borderRadius: 6,
                padding:      '10px 12px',
                fontSize:     13,
                color:        '#1E2227',
                resize:       'vertical',
                marginBottom: 12,
              }}
            />

            <button
              type="submit"
              disabled={!feedback.rating}
              style={{
                ...sans,
                background:    feedback.rating ? '#1F4E79' : 'rgba(31,78,121,0.3)',
                color:         '#F4F4F0',
                border:        'none',
                borderRadius:  6,
                padding:       '10px 20px',
                fontSize:      13,
                fontWeight:    600,
                cursor:        feedback.rating ? 'pointer' : 'not-allowed',
                letterSpacing: '0.02em',
              }}
            >
              Submit Feedback
            </button>
          </form>
        )}
      </div>

      {/* Phase 1 end note */}
      <div style={{
        background:   'rgba(30,34,39,0.04)',
        border:       '1px solid rgba(30,34,39,0.1)',
        borderRadius: 4,
        padding:      '16px 18px',
        marginBottom: 24,
      }}>
        <p style={{ ...mono, fontSize: 10, color: 'rgba(30,34,39,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
          PHASE 1 — TEST MODE
        </p>
        <p style={{ ...sans, fontSize: 13, color: 'rgba(30,34,39,0.6)', lineHeight: 1.6 }}>
          This is an extraction test only. No comparison against IS-code quantities is shown yet.
          Once extraction quality is validated across enough real quotes, Phase 2 will compare
          each line item against NirmanShastra&rsquo;s IS-code calculations.
        </p>
      </div>

      <button
        onClick={onStartOver}
        style={{
          ...mono,
          background:    'transparent',
          color:         'rgba(30,34,39,0.5)',
          border:        '1px solid rgba(30,34,39,0.2)',
          borderRadius:  6,
          padding:       '10px 20px',
          fontSize:      12,
          cursor:        'pointer',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        ← Upload Another Quote
      </button>
    </div>
  )
}

// ─── Landing explanation ───────────────────────────────────────────────────────

function LandingBanner() {
  return (
    <div style={{
      background:   '#1E2227',
      borderBottom: '1px solid rgba(244,244,240,0.06)',
      padding:      '28px 24px',
    }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <p style={{ ...mono, fontSize: 10, color: 'rgba(244,244,240,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
          CL. 0 — COMPARE CONTRACTOR QUOTE · PHASE 1 TEST
        </p>
        <h1 style={{ ...serif, fontSize: 26, fontWeight: 700, color: '#F4F4F0', lineHeight: 1.25, marginBottom: 10 }}>
          Upload your contractor&rsquo;s quote.
          <br />
          <span style={{ color: 'rgba(244,244,240,0.55)' }}>
            We&rsquo;ll extract what it says so you can compare it against IS-code-verified numbers.
          </span>
        </h1>
        <p style={{ ...sans, fontSize: 14, color: 'rgba(244,244,240,0.45)', lineHeight: 1.6 }}>
          Free to use · No payment · Phase 1 extraction test only
        </p>
      </div>
    </div>
  )
}

// ─── Page orchestrator ─────────────────────────────────────────────────────────

export default function CompareQuotePage() {
  const [step,        setStep]        = useState<Step>('project_pick')
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null)
  const [extraction,  setExtraction]  = useState<ExtractionResult | null>(null)

  const handleProjectSelect = useCallback((project: SelectedProject | null) => {
    if (project) {
      setProjectInfo({
        city:        project.city,
        state:       project.state,
        floorArea:   project.perFloorAreas ? project.perFloorAreas.reduce((a, b) => a + b, 0) : null,
        numFloors:   project.numFloors,
        projectName: project.projectName,
      })
      setStep('upload')
    } else {
      setStep('new_project_form')
    }
  }, [])

  function handleNewProjectSubmit(info: ProjectInfo) {
    setProjectInfo(info)
    setStep('upload')
  }

  function handleExtractionDone(result: ExtractionResult) {
    setExtraction(result)
    setStep('results')
  }

  function handleStartOver() {
    setStep('project_pick')
    setProjectInfo(null)
    setExtraction(null)
  }

  return (
    <div style={{ background: '#F4F4F0', minHeight: '100vh' }}>
      <LandingBanner />
      <StepBar current={step} />

      <div style={{ minHeight: 'calc(100vh - 200px)' }}>
        {step === 'project_pick' && (
          <ProjectPicker
            onSelect={handleProjectSelect}
            toolName="Compare Contractor Quote"
          />
        )}

        {step === 'new_project_form' && (
          <NewProjectForm onSubmit={handleNewProjectSubmit} />
        )}

        {step === 'upload' && projectInfo && (
          <UploadSection
            projectInfo={projectInfo}
            onDone={handleExtractionDone}
          />
        )}

        {step === 'results' && extraction && projectInfo && (
          <ResultsSection
            extraction={extraction}
            projectInfo={projectInfo}
            onStartOver={handleStartOver}
          />
        )}
      </div>
    </div>
  )
}
