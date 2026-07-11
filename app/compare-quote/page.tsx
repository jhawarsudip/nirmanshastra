'use client'

import { useState, useCallback, useRef } from 'react'
import ProjectPicker, { type SelectedProject } from '@/components/ui/ProjectPicker'
import { STATE_CITIES, INDIAN_STATES_LIST } from '@/lib/state-cities'
import type { ExtractionResult, ExtractedLineItem } from '@/app/api/compare-quote/extract/route'
import type { DrawingExtractionResult } from '@/app/api/compare-quote/extract-drawing/route'
import type { ComparisonScope, ComparisonResult, ComparisonRow, MatchStatus } from '@/app/api/compare-quote/compare/route'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProjectInfo {
  city:         string
  state:        string
  floorArea:    number | null
  numFloors:    number | null
  projectName:  string | null
  wallLengthFt: number | null
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

function formatMoney(val: number | string | null): string {
  if (val === null || val === undefined) return '—'
  const n = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : val
  if (isNaN(n)) return '—'
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`
  if (n >= 100000)   return `₹${(n / 100000).toFixed(2)}L`
  return `₹${n.toLocaleString('en-IN')}`
}

// ─── Scope auto-detector (client-side, keyword-based) ─────────────────────────

function detectScopeFromExtraction(extraction: ExtractionResult): ComparisonScope {
  const txt = [
    extraction.scopeOfWork ?? '',
    ...extraction.lineItems.map(i => i.description),
    extraction.notes ?? '',
  ].join(' ').toLowerCase()

  return {
    structopro:  /\b(rcc|structure|structural|concrete|steel|tmt|column|beam|slab|footing|foundation|excavat)\b/.test(txt),
    masonpro:    /\b(brick|masonry|plaster|block|brickwork|pointing|waterproof|wall construction)\b/.test(txt),
    electropro:  /\b(electrical|wiring|mcb|db panel|point work|light point|power point|conduit|switch)\b/.test(txt),
    plumbpro:    /\b(plumbing|cpvc|swr|drainage|water supply|tank|pump|sanitary|pipe work)\b/.test(txt),
    interiorpro: /\b(flooring|tiles|tile work|paint|interior|false ceiling|kitchen|woodwork|laminate)\b/.test(txt),
  }
}

// ─── Step indicator ────────────────────────────────────────────────────────────

function StepBar({ current }: { current: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: 'project_pick', label: 'Project' },
    { id: 'upload',       label: 'Upload'  },
    { id: 'results',      label: 'Compare' },
  ]
  const active = current === 'new_project_form' ? 'project_pick' : current
  const idx    = steps.findIndex(s => s.id === active)

  return (
    <div style={{ background: '#1E2227', borderBottom: '1px solid rgba(244,244,240,0.08)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 0 }}>
        {steps.map((s, i) => {
          const done = i < idx
          const here = i === idx
          return (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : undefined }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  border:     `1.5px solid ${done ? '#14532D' : here ? '#F4F4F0' : 'rgba(244,244,240,0.25)'}`,
                  background: done ? '#14532D' : here ? '#F4F4F0' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
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

// ─── Drawing upload phase type ─────────────────────────────────────────────────

type DrawingPhase = 'idle' | 'uploading' | 'extracting' | 'confirming' | 'confirmed' | 'failed'

// ─── Drawing confirmation panel ────────────────────────────────────────────────

function DrawingConfirmPanel({
  extracted,
  pendingFloorArea,
  pendingNumFloors,
  pendingColumnGrid,
  pendingConcreteGrade,
  pendingSteelGrade,
  onChangePendingFloorArea,
  onChangePendingNumFloors,
  onChangePendingColumnGrid,
  onChangePendingConcreteGrade,
  onChangePendingSteelGrade,
  onConfirm,
  onReject,
}: {
  extracted:                  DrawingExtractionResult
  pendingFloorArea:           string
  pendingNumFloors:           string
  pendingColumnGrid:          string
  pendingConcreteGrade:       string
  pendingSteelGrade:          string
  onChangePendingFloorArea:   (v: string) => void
  onChangePendingNumFloors:   (v: string) => void
  onChangePendingColumnGrid:  (v: string) => void
  onChangePendingConcreteGrade: (v: string) => void
  onChangePendingSteelGrade:  (v: string) => void
  onConfirm:                  () => void
  onReject:                   () => void
}) {
  const hasAnyData = extracted.floorArea !== null || extracted.numFloors !== null ||
                     extracted.columnGridSpacing !== null || extracted.concreteGrade !== null ||
                     extracted.steelGrade !== null

  return (
    <div style={{ border: '1.5px solid #1F4E79', borderRadius: 6, background: 'rgba(31,78,121,0.04)', padding: '20px 20px 16px', marginTop: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
        <span style={{ ...mono, fontSize: 16, color: '#1F4E79', flexShrink: 0, marginTop: 1 }}>📐</span>
        <div>
          <p style={{ ...mono, fontSize: 11, color: '#1F4E79', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            DRAWING READ · AWAITING YOUR CONFIRMATION
          </p>
          <p style={{ ...sans, fontSize: 13, color: '#1E2227', lineHeight: 1.5 }}>
            Here&rsquo;s what we read from your drawing. Please confirm this is correct before continuing — we cannot guarantee accurate reading of hand-drawn or low-quality scans.
          </p>
        </div>
      </div>

      {/* Caveat / drawing notes */}
      {extracted.drawingNotes && (
        <div style={{ background: 'rgba(217,154,6,0.07)', border: '1px solid rgba(217,154,6,0.28)', borderRadius: 3, padding: '8px 12px', marginBottom: 14 }}>
          <p style={{ ...mono, fontSize: 10, color: '#7a5800', lineHeight: 1.55 }}>⚠ {extracted.drawingNotes}</p>
        </div>
      )}

      {hasAnyData ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Floor area */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ ...sans, fontSize: 11, fontWeight: 600, color: 'rgba(30,34,39,0.65)', display: 'block', marginBottom: 4 }}>
                Floor area (sqft){extracted.floorArea === null && <span style={{ color: 'rgba(30,34,39,0.4)', fontWeight: 400 }}> — not found in drawing</span>}
              </label>
              <input
                type="number"
                value={pendingFloorArea}
                onChange={e => onChangePendingFloorArea(e.target.value)}
                placeholder={extracted.floorArea === null ? 'Not detected — enter manually' : ''}
                min={1}
                style={{ ...inputStyle(), ...mono, fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ ...sans, fontSize: 11, fontWeight: 600, color: 'rgba(30,34,39,0.65)', display: 'block', marginBottom: 4 }}>
                Number of floors{extracted.numFloors === null && <span style={{ color: 'rgba(30,34,39,0.4)', fontWeight: 400 }}> — not found</span>}
              </label>
              <select
                value={pendingNumFloors}
                onChange={e => onChangePendingNumFloors(e.target.value)}
                style={{ ...inputStyle(), appearance: 'auto', ...mono, fontSize: 13 }}
              >
                <option value="">Select</option>
                <option value="1">G (Ground only)</option>
                <option value="2">G+1</option>
                <option value="3">G+2</option>
                <option value="4">G+3</option>
                <option value="5">G+4</option>
                <option value="6">G+5</option>
              </select>
            </div>
          </div>

          {/* Structural specs (informational — shown but not fed into ProjectInfo) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ ...sans, fontSize: 11, fontWeight: 600, color: 'rgba(30,34,39,0.65)', display: 'block', marginBottom: 4 }}>
                Column grid spacing
              </label>
              <input
                type="text"
                value={pendingColumnGrid}
                onChange={e => onChangePendingColumnGrid(e.target.value)}
                placeholder={extracted.columnGridSpacing === null ? 'Not shown' : ''}
                style={{ ...inputStyle(), ...mono, fontSize: 12 }}
              />
            </div>
            <div>
              <label style={{ ...sans, fontSize: 11, fontWeight: 600, color: 'rgba(30,34,39,0.65)', display: 'block', marginBottom: 4 }}>
                Concrete grade
              </label>
              <input
                type="text"
                value={pendingConcreteGrade}
                onChange={e => onChangePendingConcreteGrade(e.target.value)}
                placeholder={extracted.concreteGrade === null ? 'Not labeled' : ''}
                style={{ ...inputStyle(), ...mono, fontSize: 12 }}
              />
            </div>
            <div>
              <label style={{ ...sans, fontSize: 11, fontWeight: 600, color: 'rgba(30,34,39,0.65)', display: 'block', marginBottom: 4 }}>
                Steel grade
              </label>
              <input
                type="text"
                value={pendingSteelGrade}
                onChange={e => onChangePendingSteelGrade(e.target.value)}
                placeholder={extracted.steelGrade === null ? 'Not labeled' : ''}
                style={{ ...inputStyle(), ...mono, fontSize: 12 }}
              />
            </div>
          </div>

          <p style={{ ...mono, fontSize: 10, color: 'rgba(30,34,39,0.45)', lineHeight: 1.5, marginTop: 2 }}>
            Column grid, concrete grade, and steel grade are shown for reference only — they do not flow into the comparison engine at this stage. Only floor area and floor count are applied to your project details.
          </p>

          {/* Confirm / Reject buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={onConfirm}
              style={{
                ...sans,
                background:    '#1F4E79',
                color:         '#F4F4F0',
                border:        'none',
                borderRadius:  6,
                padding:       '10px 20px',
                fontSize:      13,
                fontWeight:    600,
                cursor:        'pointer',
                letterSpacing: '0.02em',
              }}
            >
              ✓ These values are correct — apply them
            </button>
            <button
              type="button"
              onClick={onReject}
              style={{
                ...mono,
                background:    'transparent',
                color:         'rgba(30,34,39,0.55)',
                border:        '1px solid rgba(30,34,39,0.22)',
                borderRadius:  6,
                padding:       '10px 18px',
                fontSize:      11,
                cursor:        'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Drawing wasn&rsquo;t read correctly — enter manually
            </button>
          </div>
        </div>
      ) : (
        /* Nothing useful extracted */
        <div>
          <p style={{ ...sans, fontSize: 13, color: 'rgba(30,34,39,0.6)', marginBottom: 14, lineHeight: 1.5 }}>
            The AI could not extract usable values from this drawing. This is common with hand-drawn plans, low-resolution scans, or drawings that don&rsquo;t explicitly label dimensions.
          </p>
          <button
            type="button"
            onClick={onReject}
            style={{
              ...mono,
              background:    'transparent',
              color:         '#1F4E79',
              border:        '1px solid rgba(31,78,121,0.35)',
              borderRadius:  6,
              padding:       '9px 18px',
              fontSize:      11,
              cursor:        'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Continue with manual entry →
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Condensed new-project form ───────────────────────────────────────────────

function NewProjectForm({ onSubmit }: { onSubmit: (info: ProjectInfo) => void }) {
  const [state,         setState]         = useState('')
  const [city,          setCity]          = useState('')
  const [floorArea,     setFloorArea]     = useState('')
  const [numFloors,     setNumFloors]     = useState('')
  const [wallLengthFt,  setWallLengthFt]  = useState('')
  const [errors,        setErrors]        = useState<Record<string, string>>({})

  // Drawing upload state
  const [drawingFile,         setDrawingFile]         = useState<File | null>(null)
  const [drawingPhase,        setDrawingPhase]        = useState<DrawingPhase>('idle')
  const [drawingError,        setDrawingError]        = useState('')
  const [drawingExtracted,    setDrawingExtracted]    = useState<DrawingExtractionResult | null>(null)
  // Pending values shown in the confirmation panel — editable by user before they commit
  const [pendingFloorArea,         setPendingFloorArea]         = useState('')
  const [pendingNumFloors,         setPendingNumFloors]         = useState('')
  const [pendingColumnGrid,        setPendingColumnGrid]        = useState('')
  const [pendingConcreteGrade,     setPendingConcreteGrade]     = useState('')
  const [pendingSteelGrade,        setPendingSteelGrade]        = useState('')

  const drawingInputRef = useRef<HTMLInputElement>(null)

  const cities = state ? (STATE_CITIES[state] ?? []) : []

  function handleStateChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setState(e.target.value)
    setCity('')
    setErrors(prev => ({ ...prev, state: '', city: '' }))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!state)     e.state     = 'State is required'
    if (!city)      e.city      = 'City is required'
    if (!floorArea.trim() || isNaN(Number(floorArea)) || Number(floorArea) <= 0)
                    e.floorArea = 'Enter a valid floor area'
    if (!numFloors) e.numFloors = 'Select number of floors'
    if (wallLengthFt.trim() && (isNaN(Number(wallLengthFt)) || Number(wallLengthFt) <= 0))
                    e.wallLengthFt = 'Enter a valid length, or leave blank'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    const parsedWall = wallLengthFt.trim() ? Number(wallLengthFt) : null
    onSubmit({ city, state, floorArea: Number(floorArea), numFloors: Number(numFloors), projectName: null, wallLengthFt: parsedWall })
  }

  // Kick off the drawing upload + extraction pipeline
  async function handleDrawingExtract() {
    if (!drawingFile) return
    setDrawingError('')

    // Phase 1 — upload
    setDrawingPhase('uploading')
    let storagePath = ''
    let fileType    = ''
    try {
      const fd = new FormData()
      fd.append('file', drawingFile)
      const uploadRes  = await fetch('/api/compare-quote/upload', { method: 'POST', body: fd })
      const uploadJson = await uploadRes.json()
      if (!uploadRes.ok || !uploadJson.success) {
        setDrawingError(uploadJson.error ?? 'Upload failed — please try again.')
        setDrawingPhase('failed')
        return
      }
      storagePath = uploadJson.storagePath
      fileType    = uploadJson.fileType
    } catch {
      setDrawingError('Network error during upload — please check your connection.')
      setDrawingPhase('failed')
      return
    }

    // Phase 2 — AI extraction
    setDrawingPhase('extracting')
    try {
      const extractRes  = await fetch('/api/compare-quote/extract-drawing', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ storagePath, fileType }),
      })
      const extractJson = await extractRes.json()
      if (!extractRes.ok || !extractJson.success) {
        setDrawingError(extractJson.error ?? 'Could not read the drawing — please enter your project details manually below.')
        setDrawingPhase('failed')
        return
      }

      const extraction = extractJson.extraction as DrawingExtractionResult | { error: string }
      if ('error' in extraction) {
        setDrawingError(`AI says: ${extraction.error}. Please enter your project details manually below.`)
        setDrawingPhase('failed')
        return
      }

      // Pre-fill the pending confirmation fields
      setDrawingExtracted(extraction)
      setPendingFloorArea(     extraction.floorArea         !== null ? String(extraction.floorArea)  : '')
      setPendingNumFloors(     extraction.numFloors          !== null ? String(extraction.numFloors)  : '')
      setPendingColumnGrid(    extraction.columnGridSpacing  ?? '')
      setPendingConcreteGrade( extraction.concreteGrade      ?? '')
      setPendingSteelGrade(    extraction.steelGrade         ?? '')
      setDrawingPhase('confirming')
    } catch {
      setDrawingError('Network error during AI extraction — please enter your project details manually below.')
      setDrawingPhase('failed')
    }
  }

  // User actively confirms the extracted values — only now do they flow into the main form
  function handleConfirmDrawing() {
    if (pendingFloorArea.trim() && !isNaN(Number(pendingFloorArea)) && Number(pendingFloorArea) > 0) {
      setFloorArea(pendingFloorArea)
      setErrors(prev => ({ ...prev, floorArea: '' }))
    }
    if (pendingNumFloors) {
      setNumFloors(pendingNumFloors)
      setErrors(prev => ({ ...prev, numFloors: '' }))
    }
    setDrawingPhase('confirmed')
  }

  // User rejects the extraction — reset drawing state, manual entry remains available
  function handleRejectDrawing() {
    setDrawingFile(null)
    setDrawingExtracted(null)
    setDrawingPhase('idle')
    setDrawingError('')
    if (drawingInputRef.current) drawingInputRef.current.value = ''
  }

  const drawingLoadingMsg =
    drawingPhase === 'uploading'   ? 'Uploading drawing…' :
    drawingPhase === 'extracting'  ? 'AI is reading your drawing — this takes 15–30 seconds…' :
    ''

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '48px 24px' }}>
      <p style={{ ...mono, fontSize: 11, color: '#1F4E79', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
        STEP 01 · PROJECT DETAILS
      </p>
      <h2 style={{ ...serif, fontSize: 28, fontWeight: 700, color: '#1E2227', lineHeight: 1.2, marginBottom: 6 }}>
        Tell us about your project
      </h2>
      <p style={{ ...sans, fontSize: 15, color: 'rgba(30,34,39,0.55)', marginBottom: 32 }}>
        We need these to contextualise the quote. No structural details — just location and scale.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ ...sans, fontSize: 12, fontWeight: 600, color: '#1E2227', display: 'block', marginBottom: 6 }}>State *</label>
            <select value={state} onChange={handleStateChange} style={{ ...inputStyle(!!errors.state), appearance: 'auto' }}>
              <option value="">Select state</option>
              {INDIAN_STATES_LIST.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {errors.state && <p style={{ ...mono, fontSize: 10, color: '#8C3A22', marginTop: 4 }}>{errors.state}</p>}
          </div>
          <div>
            <label style={{ ...sans, fontSize: 12, fontWeight: 600, color: '#1E2227', display: 'block', marginBottom: 6 }}>City / Town *</label>
            <select value={city} onChange={e => { setCity(e.target.value); setErrors(prev => ({ ...prev, city: '' })) }} disabled={!state} style={{ ...inputStyle(!!errors.city), appearance: 'auto', opacity: state ? 1 : 0.5 }}>
              <option value="">{state ? 'Select city' : 'Select state first'}</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.city && <p style={{ ...mono, fontSize: 10, color: '#8C3A22', marginTop: 4 }}>{errors.city}</p>}
          </div>
        </div>

        {/* Optional structural drawing upload — pre-fills floor area & floor count only after user confirmation */}
        <div style={{ border: '1px dashed rgba(30,34,39,0.2)', borderRadius: 6, padding: '16px 18px', background: 'rgba(30,34,39,0.015)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ ...sans, fontSize: 13, fontWeight: 600, color: '#1E2227' }}>
              Upload your structural drawing
            </span>
            <span style={{ ...mono, fontSize: 10, color: '#14532D', background: 'rgba(20,83,45,0.08)', border: '1px solid rgba(20,83,45,0.2)', borderRadius: 2, padding: '1px 6px' }}>OPTIONAL</span>
          </div>
          <p style={{ ...sans, fontSize: 12, color: 'rgba(30,34,39,0.5)', marginBottom: 12, lineHeight: 1.5 }}>
            If you have a structural or architectural plan, upload it and AI will try to read the floor area and floor count for you. You&rsquo;ll review everything before it&rsquo;s applied.
          </p>

          {drawingPhase === 'idle' || drawingPhase === 'failed' ? (
            <div>
              {/* File selector */}
              <div
                onClick={() => { drawingInputRef.current?.click() }}
                style={{
                  border:     `1.5px dashed ${drawingFile ? '#1F4E79' : 'rgba(30,34,39,0.2)'}`,
                  borderRadius: 4,
                  padding:    '16px',
                  textAlign:  'center',
                  cursor:     'pointer',
                  background: drawingFile ? 'rgba(31,78,121,0.03)' : '#fff',
                  marginBottom: 10,
                }}
              >
                <input
                  ref={drawingInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  style={{ display: 'none' }}
                  onChange={e => {
                    setDrawingFile(e.target.files?.[0] ?? null)
                    setDrawingError('')
                    setDrawingPhase('idle')
                  }}
                />
                {drawingFile ? (
                  <>
                    <p style={{ ...mono, fontSize: 12, color: '#1F4E79', fontWeight: 500, marginBottom: 2 }}>{drawingFile.name}</p>
                    <p style={{ ...mono, fontSize: 10, color: 'rgba(30,34,39,0.45)' }}>
                      {(drawingFile.size / 1024).toFixed(0)} KB
                      {' '}· <span style={{ color: '#1F4E79', cursor: 'pointer' }} onClick={ev => { ev.stopPropagation(); setDrawingFile(null); setDrawingError(''); setDrawingPhase('idle'); if (drawingInputRef.current) drawingInputRef.current.value = '' }}>Change</span>
                    </p>
                  </>
                ) : (
                  <>
                    <p style={{ ...sans, fontSize: 13, color: 'rgba(30,34,39,0.5)', marginBottom: 2 }}>Click to select a structural drawing</p>
                    <p style={{ ...mono, fontSize: 10, color: 'rgba(30,34,39,0.35)' }}>PDF, JPG, or PNG · max 10 MB</p>
                  </>
                )}
              </div>

              {/* Failure banner */}
              {drawingPhase === 'failed' && drawingError && (
                <div style={{ background: 'rgba(140,58,34,0.06)', border: '1px solid rgba(140,58,34,0.22)', borderRadius: 3, padding: '10px 12px', marginBottom: 10 }}>
                  <p style={{ ...sans, fontSize: 12, color: '#8C3A22', lineHeight: 1.5 }}>
                    ⚠ {drawingError}
                  </p>
                </div>
              )}

              {drawingFile && (
                <button
                  type="button"
                  onClick={handleDrawingExtract}
                  style={{
                    ...sans,
                    background:    '#1F4E79',
                    color:         '#F4F4F0',
                    border:        'none',
                    borderRadius:  6,
                    padding:       '9px 18px',
                    fontSize:      13,
                    fontWeight:    600,
                    cursor:        'pointer',
                    letterSpacing: '0.01em',
                  }}
                >
                  Read Drawing →
                </button>
              )}
            </div>
          ) : drawingPhase === 'uploading' || drawingPhase === 'extracting' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0' }}>
              <span style={{ ...mono, fontSize: 18, color: '#1F4E79', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
              <span style={{ ...sans, fontSize: 13, color: '#1F4E79' }}>{drawingLoadingMsg}</span>
              <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
            </div>
          ) : drawingPhase === 'confirming' && drawingExtracted ? (
            <DrawingConfirmPanel
              extracted={drawingExtracted}
              pendingFloorArea={pendingFloorArea}
              pendingNumFloors={pendingNumFloors}
              pendingColumnGrid={pendingColumnGrid}
              pendingConcreteGrade={pendingConcreteGrade}
              pendingSteelGrade={pendingSteelGrade}
              onChangePendingFloorArea={setPendingFloorArea}
              onChangePendingNumFloors={setPendingNumFloors}
              onChangePendingColumnGrid={setPendingColumnGrid}
              onChangePendingConcreteGrade={setPendingConcreteGrade}
              onChangePendingSteelGrade={setPendingSteelGrade}
              onConfirm={handleConfirmDrawing}
              onReject={handleRejectDrawing}
            />
          ) : drawingPhase === 'confirmed' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(20,83,45,0.06)', border: '1px solid rgba(20,83,45,0.2)', borderRadius: 4 }}>
              <span style={{ color: '#14532D', fontSize: 14 }}>✓</span>
              <p style={{ ...sans, fontSize: 13, color: '#14532D', fontWeight: 600 }}>Drawing values applied to floor area and floor count below.</p>
              <button
                type="button"
                onClick={handleRejectDrawing}
                style={{ ...mono, background: 'transparent', border: 'none', color: 'rgba(30,34,39,0.45)', fontSize: 10, cursor: 'pointer', marginLeft: 'auto', textDecoration: 'underline', textTransform: 'uppercase' }}
              >
                Reset
              </button>
            </div>
          ) : null}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ ...sans, fontSize: 12, fontWeight: 600, color: '#1E2227', display: 'block', marginBottom: 6 }}>
              Approximate floor area (sqft) *
              {drawingPhase === 'confirmed' && floorArea && (
                <span style={{ ...mono, fontSize: 10, color: '#1F4E79', fontWeight: 400, marginLeft: 6 }}>from drawing</span>
              )}
            </label>
            <input type="number" value={floorArea} onChange={e => { setFloorArea(e.target.value); setErrors(prev => ({ ...prev, floorArea: '' })) }} placeholder="e.g. 1200" min={1} style={{ ...inputStyle(!!errors.floorArea), ...mono }} />
            {errors.floorArea && <p style={{ ...mono, fontSize: 10, color: '#8C3A22', marginTop: 4 }}>{errors.floorArea}</p>}
          </div>
          <div>
            <label style={{ ...sans, fontSize: 12, fontWeight: 600, color: '#1E2227', display: 'block', marginBottom: 6 }}>
              Number of floors *
              {drawingPhase === 'confirmed' && numFloors && (
                <span style={{ ...mono, fontSize: 10, color: '#1F4E79', fontWeight: 400, marginLeft: 6 }}>from drawing</span>
              )}
            </label>
            <select value={numFloors} onChange={e => { setNumFloors(e.target.value); setErrors(prev => ({ ...prev, numFloors: '' })) }} style={{ ...inputStyle(!!errors.numFloors), appearance: 'auto', ...mono }}>
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

        {/* Optional wall-length field — improves masonry comparison accuracy */}
        <div style={{ borderTop: '1px dashed rgba(30,34,39,0.15)', paddingTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
            <label style={{ ...sans, fontSize: 12, fontWeight: 600, color: '#1E2227' }}>
              Total exterior wall length, if known (ft)
            </label>
            <span style={{ ...mono, fontSize: 10, color: '#14532D', background: 'rgba(20,83,45,0.08)', border: '1px solid rgba(20,83,45,0.2)', borderRadius: 2, padding: '1px 6px' }}>OPTIONAL</span>
          </div>
          <input
            type="number"
            value={wallLengthFt}
            onChange={e => { setWallLengthFt(e.target.value); setErrors(prev => ({ ...prev, wallLengthFt: '' })) }}
            placeholder="e.g. 160  — sum of all outer wall faces"
            min={1}
            style={{ ...inputStyle(!!errors.wallLengthFt), ...mono }}
          />
          {errors.wallLengthFt
            ? <p style={{ ...mono, fontSize: 10, color: '#8C3A22', marginTop: 4 }}>{errors.wallLengthFt}</p>
            : <p style={{ ...sans, fontSize: 12, color: 'rgba(30,34,39,0.45)', marginTop: 5, lineHeight: 1.5 }}>
                Walk the perimeter and add up all outer wall faces. Used for masonry comparison only — skip if you don&rsquo;t know it.
              </p>
          }
        </div>

        <button type="submit" style={{ ...sans, background: '#8C3A22', color: '#F4F4F0', border: 'none', borderRadius: 6, padding: '14px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer', letterSpacing: '0.02em', marginTop: 8, alignSelf: 'flex-start' }}>
          Continue to Upload →
        </button>
      </form>
    </div>
  )
}

// ─── Upload section ────────────────────────────────────────────────────────────

function UploadSection({ projectInfo, onDone }: { projectInfo: ProjectInfo; onDone: (extraction: ExtractionResult) => void }) {
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
      setLoadingMsg('Uploading your quote…')
      const fd = new FormData()
      fd.append('file', file)
      const uploadRes  = await fetch('/api/compare-quote/upload', { method: 'POST', body: fd })
      const uploadJson = await uploadRes.json()
      if (!uploadRes.ok || !uploadJson.success) {
        setError(uploadJson.error ?? 'Upload failed — please try again.')
        setLoading(false); return
      }

      setLoadingMsg('AI is reading your quote — this takes 15–30 seconds…')
      const extractRes  = await fetch('/api/compare-quote/extract', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storagePath: uploadJson.storagePath, fileType: uploadJson.fileType }),
      })
      const extractJson = await extractRes.json()
      if (!extractRes.ok || !extractJson.success) {
        setError(extractJson.error ?? 'Extraction failed — please try a clearer image or PDF.')
        setLoading(false); return
      }

      const extraction = extractJson.extraction as ExtractionResult | { error: string }
      if ('error' in extraction) {
        setError(`AI says: ${extraction.error}`)
        setLoading(false); return
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
        We&rsquo;ll extract every line item, quantity, and price — then compare against IS-code-calculated figures.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(31,78,121,0.06)', border: '1px solid rgba(31,78,121,0.18)', borderRadius: 4, padding: '10px 14px', marginBottom: 28 }}>
        <span style={{ ...mono, fontSize: 10, color: '#1F4E79', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Project</span>
        <span style={{ ...mono, fontSize: 12, color: '#1E2227' }}>{projectInfo.projectName ?? 'New project'}</span>
        <span style={{ ...mono, fontSize: 11, color: 'rgba(30,34,39,0.45)' }}>·</span>
        <span style={{ ...mono, fontSize: 12, color: '#1E2227' }}>{projectInfo.city}, {projectInfo.state}</span>
        {floorLabel && (<><span style={{ ...mono, fontSize: 11, color: 'rgba(30,34,39,0.45)' }}>·</span><span style={{ ...mono, fontSize: 12, color: '#1E2227' }}>{floorLabel}</span></>)}
        {projectInfo.floorArea && (<><span style={{ ...mono, fontSize: 11, color: 'rgba(30,34,39,0.45)' }}>·</span><span style={{ ...mono, fontSize: 12, color: '#1E2227' }}>{projectInfo.floorArea.toLocaleString('en-IN')} sqft</span></>)}
      </div>

      <div onClick={() => !loading && inputRef.current?.click()} style={{ border: `2px dashed ${file ? '#14532D' : 'rgba(30,34,39,0.25)'}`, borderRadius: 6, padding: '36px 24px', textAlign: 'center', cursor: loading ? 'not-allowed' : 'pointer', background: file ? 'rgba(20,83,45,0.03)' : '#fff', marginBottom: 16, transition: 'border-color 0.2s' }}>
        <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => { setFile(e.target.files?.[0] ?? null); setError('') }} style={{ display: 'none' }} disabled={loading} />
        {file ? (
          <>
            <div style={{ ...mono, fontSize: 22, marginBottom: 8 }}>📄</div>
            <p style={{ ...mono, fontSize: 13, color: '#14532D', fontWeight: 500, marginBottom: 4 }}>{file.name}</p>
            <p style={{ ...mono, fontSize: 11, color: 'rgba(30,34,39,0.45)' }}>
              {(file.size / 1024).toFixed(0)} KB · {file.type.includes('pdf') ? 'PDF' : 'Image'}
              {' '}· <span style={{ color: '#1F4E79', cursor: 'pointer' }} onClick={ev => { ev.stopPropagation(); setFile(null); if (inputRef.current) inputRef.current.value = '' }}>Change file</span>
            </p>
          </>
        ) : (
          <>
            <div style={{ ...mono, fontSize: 28, marginBottom: 12, color: 'rgba(30,34,39,0.3)' }}>⬆</div>
            <p style={{ ...sans, fontSize: 14, fontWeight: 600, color: '#1E2227', marginBottom: 4 }}>Click to select your contractor&rsquo;s quote</p>
            <p style={{ ...sans, fontSize: 12, color: 'rgba(30,34,39,0.45)' }}>PDF, JPG, or PNG · max 10 MB</p>
          </>
        )}
      </div>

      {loading && (
        <div style={{ background: 'rgba(31,78,121,0.05)', border: '1px solid rgba(31,78,121,0.15)', borderRadius: 4, padding: '14px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ ...mono, fontSize: 18, animation: 'spin 1s linear infinite' }}>⟳</span>
          <span style={{ ...sans, fontSize: 13, color: '#1F4E79' }}>{loadingMsg}</span>
          <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(140,58,34,0.06)', border: '1px solid rgba(140,58,34,0.25)', borderRadius: 4, padding: '12px 14px', marginBottom: 16 }}>
          <p style={{ ...sans, fontSize: 13, color: '#8C3A22' }}>⚠ {error}</p>
        </div>
      )}

      <button onClick={handleExtract} disabled={!file || loading} style={{ ...sans, background: !file || loading ? 'rgba(140,58,34,0.35)' : '#8C3A22', color: '#F4F4F0', border: 'none', borderRadius: 6, padding: '14px 28px', fontSize: 15, fontWeight: 600, cursor: !file || loading ? 'not-allowed' : 'pointer', letterSpacing: '0.02em', width: '100%' }}>
        {loading ? 'Extracting…' : 'Extract from Quote →'}
      </button>
      <p style={{ ...sans, fontSize: 12, color: 'rgba(30,34,39,0.4)', marginTop: 12, textAlign: 'center' }}>Your file is stored securely. No payment required.</p>
    </div>
  )
}

// ─── Comparison status badge ───────────────────────────────────────────────────

function StatusBadge({ status }: { status: MatchStatus | 'unverifiable' }) {
  const configs: Record<string, { label: string; bg: string; border: string; color: string }> = {
    within_range:      { label: 'WITHIN RANGE',  bg: 'rgba(20,83,45,0.06)',    border: '#14532D',       color: '#14532D'  },
    contractor_higher: { label: 'HIGHER',         bg: 'rgba(140,58,34,0.06)',   border: '#8C3A22',       color: '#8C3A22'  },
    contractor_lower:  { label: 'LOWER',          bg: 'rgba(31,78,121,0.06)',   border: '#1F4E79',       color: '#1F4E79'  },
    expected_missing:  { label: 'MISSING',        bg: 'rgba(217,154,6,0.08)',   border: '#D99A06',       color: '#7a5800'  },
    unverifiable:      { label: 'UNABLE TO VERIFY', bg: 'rgba(30,34,39,0.04)', border: 'rgba(30,34,39,0.2)', color: 'rgba(30,34,39,0.5)' },
  }
  const c = configs[status] ?? configs.unverifiable
  return (
    <span style={{
      ...mono,
      fontSize: 9,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      padding: '3px 7px',
      border: `1px solid ${c.border}`,
      borderRadius: 2,
      background: c.bg,
      color: c.color,
      whiteSpace: 'nowrap',
      transform: 'rotate(-1deg)',
      display: 'inline-block',
    }}>
      {c.label}
    </span>
  )
}

// ─── Engine total card ─────────────────────────────────────────────────────────

function EngineTotalCard({ engineKey, total, contractorSubtotal }: {
  engineKey: string
  total: { label: string; calculated: { low: number; high: number }; isCodeBasis: string }
  contractorSubtotal: number | null
}) {
  const engineLabels: Record<string, { short: string; color: string }> = {
    structopro:  { short: 'Structure',   color: '#1F4E79' },
    masonpro:    { short: 'Masonry',     color: '#1F4E79' },
    electropro:  { short: 'Electrical',  color: '#1F4E79' },
    plumbpro:    { short: 'Plumbing',    color: '#1F4E79' },
    interiorpro: { short: 'Interior',    color: '#1F4E79' },
  }
  const meta = engineLabels[engineKey] ?? { short: engineKey, color: '#1F4E79' }
  const mid  = (total.calculated.low + total.calculated.high) / 2

  return (
    <div style={{ border: '1px solid rgba(30,34,39,0.12)', borderRadius: 4, padding: '14px 16px', background: '#fff', minWidth: 200 }}>
      <p style={{ ...mono, fontSize: 10, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{meta.short}</p>
      <p style={{ ...mono, fontSize: 11, color: 'rgba(30,34,39,0.5)', marginBottom: 8, lineHeight: 1.4 }}>{total.label}</p>
      <p style={{ ...mono, fontSize: 13, color: '#1E2227', fontWeight: 500, marginBottom: 2 }}>
        IS-code: <span style={{ color: '#1F4E79' }}>{formatMoney(total.calculated.low)} – {formatMoney(total.calculated.high)}</span>
      </p>
      {contractorSubtotal !== null && contractorSubtotal > 0 && (
        <p style={{ ...mono, fontSize: 13, color: '#1E2227', marginBottom: 2 }}>
          Contractor: <span style={{ color: contractorSubtotal > mid * 1.2 ? '#8C3A22' : contractorSubtotal < mid * 0.8 ? '#1F4E79' : '#14532D' }}>
            {formatMoney(contractorSubtotal)}
          </span>
        </p>
      )}
      <p style={{ ...mono, fontSize: 10, color: 'rgba(30,34,39,0.4)', marginTop: 4 }}>{total.isCodeBasis}</p>
    </div>
  )
}

// ─── Comparison table ──────────────────────────────────────────────────────────

function ComparisonTable({ rows }: { rows: ComparisonRow[] }) {
  if (rows.length === 0) {
    return (
      <div style={{ border: '1px solid rgba(30,34,39,0.12)', borderRadius: 4, padding: '28px', textAlign: 'center' }}>
        <p style={{ ...sans, fontSize: 14, color: 'rgba(30,34,39,0.5)' }}>No matchable line items found. All items were flagged as unverifiable.</p>
      </div>
    )
  }

  return (
    <div style={{ border: '1px solid rgba(30,34,39,0.15)', borderRadius: 4, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr 130px 130px 80px', background: '#1E2227', padding: '9px 14px', gap: 12 }}>
        {['Status', 'Work Item', 'Contractor', 'IS-Code', 'Diff'].map(h => (
          <span key={h} style={{ ...mono, fontSize: 10, color: 'rgba(244,244,240,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: h === 'Contractor' || h === 'IS-Code' || h === 'Diff' ? 'right' : 'left' }}>{h}</span>
        ))}
      </div>

      {rows.map((row, i) => (
        <div key={row.id}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '130px 1fr 130px 130px 80px',
            padding: '11px 14px',
            gap: 12,
            borderTop: i > 0 ? '1px solid rgba(30,34,39,0.07)' : undefined,
            background: i % 2 === 1 ? 'rgba(30,34,39,0.02)' : '#fff',
            alignItems: 'start',
          }}>
            {/* Status */}
            <div style={{ paddingTop: 2 }}>
              <StatusBadge status={row.status} />
            </div>

            {/* Work item */}
            <div>
              <p style={{ ...sans, fontSize: 13, fontWeight: 600, color: '#1E2227', marginBottom: 2 }}>{row.categoryLabel}</p>
              {row.contractorItems.map((ci, j) => (
                <p key={j} style={{ ...sans, fontSize: 11, color: 'rgba(30,34,39,0.6)', lineHeight: 1.4, marginBottom: 1 }}>
                  {ci.description}
                  {ci.quantity && ci.unit && (
                    <span style={{ ...mono, fontSize: 10, color: 'rgba(30,34,39,0.4)' }}> — {ci.quantity} {ci.unit}</span>
                  )}
                </p>
              ))}
              {row.status === 'expected_missing' && (
                <p style={{ ...mono, fontSize: 10, color: '#7a5800', marginTop: 3 }}>NOT FOUND IN QUOTE</p>
              )}
              {row.isCodeLabel && row.status !== 'unverifiable' && (
                <p style={{ ...mono, fontSize: 10, color: 'rgba(30,34,39,0.35)', marginTop: 4 }}>{row.isCodeClause}</p>
              )}
              {row.inlineCaveat && (
                <div style={{ marginTop: 6, padding: '4px 8px', background: 'rgba(217,154,6,0.07)', border: '1px solid rgba(217,154,6,0.28)', borderRadius: 2 }}>
                  <p style={{ ...mono, fontSize: 10, color: '#7a5800', lineHeight: 1.55 }}>⚠ {row.inlineCaveat}</p>
                </div>
              )}
              {row.qtyComparison && (
                <div style={{ marginTop: 5, padding: '5px 8px', background: 'rgba(31,78,121,0.04)', border: '1px solid rgba(31,78,121,0.12)', borderRadius: 3 }}>
                  <p style={{ ...mono, fontSize: 10, color: '#1F4E79' }}>
                    Qty: contractor {row.qtyComparison.contractorQty.toLocaleString('en-IN')} {row.qtyComparison.contractorUnit} vs IS-code {row.qtyComparison.isCodeQty.toLocaleString('en-IN')} {row.qtyComparison.isCodeUnit}
                    {row.qtyComparison.diffPercent !== 0 && (
                      <span style={{ color: row.qtyComparison.diffPercent > 20 ? '#D99A06' : row.qtyComparison.diffPercent < -20 ? '#8C3A22' : '#1F4E79' }}>
                        {' '}({row.qtyComparison.diffPercent > 0 ? '+' : ''}{row.qtyComparison.diffPercent}%)
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Contractor total */}
            <div style={{ textAlign: 'right', paddingTop: 2 }}>
              {row.contractorTotal !== null && row.contractorTotal > 0
                ? <span style={{ ...mono, fontSize: 13, color: '#1E2227', fontWeight: 500 }}>{formatMoney(row.contractorTotal)}</span>
                : <span style={{ ...mono, fontSize: 12, color: 'rgba(30,34,39,0.3)' }}>—</span>
              }
            </div>

            {/* IS-code calculated */}
            <div style={{ textAlign: 'right', paddingTop: 2 }}>
              {row.isCodeAmount !== null
                ? <span style={{ ...mono, fontSize: 13, color: '#1F4E79', fontWeight: 500 }}>{formatMoney(row.isCodeAmount)}</span>
                : <span style={{ ...mono, fontSize: 11, color: 'rgba(30,34,39,0.35)', fontStyle: 'italic' }}>n/a</span>
              }
            </div>

            {/* Diff */}
            <div style={{ textAlign: 'right', paddingTop: 4 }}>
              {row.differencePercent !== null
                ? <span style={{ ...mono, fontSize: 12, color: row.differencePercent > 20 ? '#8C3A22' : row.differencePercent < -20 ? '#1F4E79' : '#14532D', fontWeight: 500 }}>
                    {row.differencePercent > 0 ? '+' : ''}{row.differencePercent}%
                  </span>
                : <span style={{ ...mono, fontSize: 11, color: 'rgba(30,34,39,0.25)' }}>—</span>
              }
            </div>
          </div>

          {/* Flag message row */}
          {row.flagMessage && (
            <div style={{
              padding: '8px 14px 10px',
              paddingLeft: 14 + 130 + 12,
              background: row.status === 'expected_missing' ? 'rgba(217,154,6,0.04)' : row.status === 'contractor_higher' ? 'rgba(140,58,34,0.03)' : 'rgba(31,78,121,0.03)',
              borderTop: '1px dashed rgba(30,34,39,0.08)',
            }}>
              <p style={{ ...sans, fontSize: 12, color: 'rgba(30,34,39,0.6)', lineHeight: 1.5 }}>{row.flagMessage}</p>
              {row.isCodeBasis && row.status !== 'unverifiable' && (
                <p style={{ ...mono, fontSize: 10, color: 'rgba(30,34,39,0.4)', marginTop: 4 }}>Basis: {row.isCodeBasis}</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Comparison panel (scope select + run + results) ──────────────────────────

function ComparisonPanel({
  projectInfo,
  scope,
  setScope,
  comparison,
  loading,
  error,
  onRunComparison,
}: {
  projectInfo:     ProjectInfo
  scope:           ComparisonScope
  setScope:        (s: ComparisonScope) => void
  comparison:      ComparisonResult | null
  loading:         boolean
  error:           string
  onRunComparison: () => void
}) {
  const engines: { key: keyof ComparisonScope; label: string; desc: string }[] = [
    { key: 'structopro',  label: 'RCC Structure',  desc: 'Concrete, steel, formwork, foundation' },
    { key: 'masonpro',    label: 'Masonry',         desc: 'Brickwork, plastering, waterproofing' },
    { key: 'electropro',  label: 'Electrical',      desc: 'Wiring, DB panel, MCB, earthing' },
    { key: 'plumbpro',    label: 'Plumbing',        desc: 'CPVC/SWR pipes, tanks, pump' },
    { key: 'interiorpro', label: 'Interior',        desc: 'Flooring, painting, kitchen, doors' },
  ]

  const anySelected = Object.values(scope).some(Boolean)

  // Contractor subtotals per engine for the totals panel
  const contractorSubtotals: Partial<Record<keyof ComparisonScope, number>> = {}
  if (comparison) {
    for (const row of comparison.rows) {
      if (row.contractorTotal && row.status !== 'unverifiable') {
        const k = row.engine as keyof ComparisonScope
        contractorSubtotals[k] = (contractorSubtotals[k] ?? 0) + row.contractorTotal
      }
    }
  }

  return (
    <div style={{ marginTop: 32 }}>
      {/* Section header */}
      <div style={{ borderTop: '2px solid #1E2227', paddingTop: 24, marginBottom: 20 }}>
        <p style={{ ...mono, fontSize: 11, color: '#1F4E79', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
          IS-CODE COMPARISON · FREE
        </p>
        <h3 style={{ ...serif, fontSize: 22, fontWeight: 700, color: '#1E2227', lineHeight: 1.25, marginBottom: 8 }}>
          Compare against IS-code calculations
        </h3>
        <p style={{ ...sans, fontSize: 14, color: 'rgba(30,34,39,0.6)', lineHeight: 1.5, maxWidth: 600 }}>
          Select which phases of work this quote covers. We&rsquo;ll run the relevant NirmanShastra engines and compare each line item against IS-code-calculated figures.
        </p>
      </div>

      {/* Scope selector */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
        {engines.map(e => {
          const checked = scope[e.key]
          return (
            <button
              key={e.key}
              onClick={() => setScope({ ...scope, [e.key]: !checked })}
              style={{
                ...sans,
                display:   'flex',
                alignItems: 'center',
                gap:        8,
                padding:   '10px 14px',
                border:    `1.5px solid ${checked ? '#1F4E79' : 'rgba(30,34,39,0.2)'}`,
                borderRadius: 4,
                background: checked ? 'rgba(31,78,121,0.07)' : '#fff',
                color:      checked ? '#1F4E79' : 'rgba(30,34,39,0.5)',
                cursor:    'pointer',
                transition: 'all 0.12s',
              }}
            >
              <span style={{ ...mono, fontSize: 13, color: checked ? '#1F4E79' : 'rgba(30,34,39,0.3)', lineHeight: 1 }}>{checked ? '☑' : '☐'}</span>
              <div style={{ textAlign: 'left' }}>
                <p style={{ ...sans, fontSize: 13, fontWeight: 600, color: checked ? '#1F4E79' : 'rgba(30,34,39,0.6)', margin: 0 }}>{e.label}</p>
                <p style={{ ...mono, fontSize: 10, color: 'rgba(30,34,39,0.4)', margin: 0 }}>{e.desc}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Assumptions note */}
      <div style={{ background: 'rgba(217,154,6,0.06)', border: '1px solid rgba(217,154,6,0.25)', borderRadius: 4, padding: '10px 14px', marginBottom: 18, display: 'flex', gap: 8 }}>
        <span style={{ fontSize: 13, flexShrink: 0 }}>⚠</span>
        <p style={{ ...sans, fontSize: 12, color: '#1E2227', lineHeight: 1.55 }}>
          Calculations use your project inputs ({projectInfo.floorArea?.toLocaleString('en-IN')} sqft, {projectInfo.numFloors === 1 ? 'G' : `G+${(projectInfo.numFloors ?? 1) - 1}`}, {projectInfo.city}) plus specs detected from the quote (concrete grade, wall type, steel grade). Material costs only — labour and overhead excluded. Not a professional quantity survey.
        </p>
      </div>

      {/* Run button */}
      {!comparison && (
        <button
          onClick={onRunComparison}
          disabled={!anySelected || loading}
          style={{
            ...sans,
            background:    !anySelected || loading ? 'rgba(140,58,34,0.35)' : '#8C3A22',
            color:         '#F4F4F0',
            border:        'none',
            borderRadius:  6,
            padding:       '13px 28px',
            fontSize:      15,
            fontWeight:    600,
            cursor:        !anySelected || loading ? 'not-allowed' : 'pointer',
            letterSpacing: '0.02em',
            marginBottom:  16,
            display:       'flex',
            alignItems:    'center',
            gap:           10,
          }}
        >
          {loading ? (
            <>
              <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
              Running IS-code comparison…
            </>
          ) : (
            'Run IS-Code Comparison →'
          )}
        </button>
      )}

      {error && (
        <div style={{ background: 'rgba(140,58,34,0.06)', border: '1px solid rgba(140,58,34,0.25)', borderRadius: 4, padding: '12px 14px', marginBottom: 16 }}>
          <p style={{ ...sans, fontSize: 13, color: '#8C3A22' }}>⚠ {error}</p>
        </div>
      )}

      {/* Results */}
      {comparison && (
        <div>
          {/* Re-run button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <p style={{ ...mono, fontSize: 11, color: '#14532D', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              ✓ COMPARISON COMPLETE
            </p>
            <button
              onClick={onRunComparison}
              style={{ ...mono, background: 'transparent', border: '1px solid rgba(30,34,39,0.2)', borderRadius: 4, padding: '6px 14px', fontSize: 11, color: 'rgba(30,34,39,0.5)', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.04em' }}
            >
              Re-run
            </button>
          </div>

          {/* Engine totals */}
          {Object.keys(comparison.engineTotals).length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <p style={{ ...mono, fontSize: 10, color: 'rgba(30,34,39,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                PHASE TOTALS (IS-CODE RANGE vs CONTRACTOR)
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {(Object.entries(comparison.engineTotals) as [keyof ComparisonScope, typeof comparison.engineTotals[keyof ComparisonScope]][]).map(([k, t]) => t && (
                  <EngineTotalCard
                    key={k}
                    engineKey={k}
                    total={t}
                    contractorSubtotal={contractorSubtotals[k] ?? null}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Assumptions */}
          <details style={{ marginBottom: 20 }}>
            <summary style={{ ...mono, fontSize: 11, color: '#1F4E79', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em', userSelect: 'none' }}>
              ▸ CALCULATION ASSUMPTIONS ({comparison.assumptions.length})
            </summary>
            <div style={{ marginTop: 10, padding: '12px 14px', background: 'rgba(31,78,121,0.04)', border: '1px solid rgba(31,78,121,0.12)', borderRadius: 4 }}>
              {comparison.assumptions.map((a, i) => (
                <p key={i} style={{ ...sans, fontSize: 12, color: 'rgba(30,34,39,0.65)', lineHeight: 1.5, marginBottom: i < comparison.assumptions.length - 1 ? 6 : 0 }}>
                  {i + 1}. {a}
                </p>
              ))}
            </div>
          </details>

          {/* Comparison table */}
          <p style={{ ...mono, fontSize: 10, color: 'rgba(30,34,39,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
            LINE-ITEM COMPARISON ({comparison.rows.length} items)
          </p>
          <ComparisonTable rows={comparison.rows} />

          {/* Disclaimer */}
          <div style={{ marginTop: 16, padding: '12px 14px', background: 'rgba(30,34,39,0.03)', border: '1px solid rgba(30,34,39,0.1)', borderRadius: 4 }}>
            <p style={{ ...mono, fontSize: 10, color: 'rgba(30,34,39,0.5)', lineHeight: 1.6 }}>
              DISCLAIMER — This comparison is for informational purposes only. NirmanShastra uses IS-code thumb rules and Pune 2026 average material rates. Actual quantities depend on structural drawings. This is not a professional quantity survey or engineering certificate. Engage a licensed structural engineer and quantity surveyor before finalising any contract.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Results section ───────────────────────────────────────────────────────────

function ResultsSection({
  extraction,
  projectInfo,
  scope,
  setScope,
  comparison,
  comparisonLoading,
  comparisonError,
  onRunComparison,
  onStartOver,
}: {
  extraction:          ExtractionResult
  projectInfo:         ProjectInfo
  scope:               ComparisonScope
  setScope:            (s: ComparisonScope) => void
  comparison:          ComparisonResult | null
  comparisonLoading:   boolean
  comparisonError:     string
  onRunComparison:     () => void
  onStartOver:         () => void
}) {
  const [feedback, setFeedback] = useState<FeedbackState>({ rating: null, comment: '', submitted: false })

  const hasLineItems = extraction.lineItems && extraction.lineItems.length > 0

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '48px 24px' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ ...mono, fontSize: 11, color: '#1F4E79', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          STEP 03 · EXTRACTION &amp; COMPARISON
        </p>
        <h2 style={{ ...serif, fontSize: 28, fontWeight: 700, color: '#1E2227', lineHeight: 1.2, marginBottom: 8 }}>
          Here&rsquo;s what we found in your quote
        </h2>
        <p style={{ ...sans, fontSize: 15, color: 'rgba(30,34,39,0.6)' }}>
          Check the extraction below, then compare each line item against NirmanShastra&rsquo;s IS-code calculations.
        </p>
      </div>

      {/* Scope + Total summary */}
      <div style={{ display: 'grid', gridTemplateColumns: extraction.totalAmount ? '1fr auto' : '1fr', gap: 16, marginBottom: 20 }}>
        <div style={{ background: 'rgba(31,78,121,0.04)', border: '1px solid rgba(31,78,121,0.15)', borderRadius: 4, padding: '14px 18px' }}>
          <p style={{ ...mono, fontSize: 10, color: '#1F4E79', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Scope of Work</p>
          <p style={{ ...sans, fontSize: 14, color: '#1E2227', lineHeight: 1.5 }}>{extraction.scopeOfWork || '—'}</p>
        </div>
        {extraction.totalAmount && (
          <div style={{ background: 'rgba(20,83,45,0.04)', border: '1px solid rgba(20,83,45,0.18)', borderRadius: 4, padding: '14px 24px', textAlign: 'center', minWidth: 140 }}>
            <p style={{ ...mono, fontSize: 10, color: '#14532D', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Total Quoted</p>
            <p style={{ ...mono, fontSize: 24, fontWeight: 500, color: '#1E2227' }}>{formatMoney(extraction.totalAmount)}</p>
            <p style={{ ...mono, fontSize: 10, color: 'rgba(30,34,39,0.45)', marginTop: 2 }}>{projectInfo.city}, {projectInfo.state}</p>
          </div>
        )}
      </div>

      {/* Notes */}
      {extraction.notes && (
        <div style={{ background: 'rgba(217,154,6,0.08)', border: '1px solid rgba(217,154,6,0.3)', borderRadius: 4, padding: '12px 14px', marginBottom: 20, display: 'flex', gap: 10 }}>
          <span style={{ fontSize: 14, flexShrink: 0 }}>⚠</span>
          <p style={{ ...sans, fontSize: 13, color: '#1E2227' }}>{extraction.notes}</p>
        </div>
      )}

      {/* Extraction table */}
      {hasLineItems ? (
        <div style={{ border: '1px solid rgba(30,34,39,0.15)', borderRadius: 4, overflow: 'hidden', marginBottom: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 100px 80px 110px 110px', background: '#1E2227', padding: '8px 14px', gap: 12 }}>
            {['#', 'Description', 'Qty', 'Unit', 'Rate (₹)', 'Total (₹)'].map(h => (
              <span key={h} style={{ ...mono, fontSize: 10, color: 'rgba(244,244,240,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: h === '#' || h === 'Description' ? 'left' : 'right' }}>{h}</span>
            ))}
          </div>
          {extraction.lineItems.map((item: ExtractedLineItem, i: number) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '32px 1fr 100px 80px 110px 110px', padding: '10px 14px', gap: 12, borderTop: i > 0 ? '1px solid rgba(30,34,39,0.07)' : undefined, background: i % 2 === 1 ? 'rgba(30,34,39,0.025)' : '#fff', alignItems: 'start' }}>
              <span style={{ ...mono, fontSize: 11, color: 'rgba(30,34,39,0.35)', paddingTop: 1 }}>{i + 1}</span>
              <span style={{ ...sans, fontSize: 13, color: '#1E2227', lineHeight: 1.4 }}>{item.description}</span>
              <span style={{ ...mono, fontSize: 12, color: '#1E2227', textAlign: 'right' }}>{item.quantity ?? '—'}</span>
              <span style={{ ...mono, fontSize: 11, color: 'rgba(30,34,39,0.55)', textAlign: 'right' }}>{item.unit ?? '—'}</span>
              <span style={{ ...mono, fontSize: 12, color: '#1E2227', textAlign: 'right' }}>{item.unitRate ? `₹${Number(item.unitRate).toLocaleString('en-IN')}` : '—'}</span>
              <span style={{ ...mono, fontSize: 12, color: '#1E2227', textAlign: 'right', fontWeight: 500 }}>{item.totalPrice ? formatMoney(item.totalPrice) : '—'}</span>
            </div>
          ))}
          {extraction.totalAmount && (
            <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 100px 80px 110px 110px', padding: '10px 14px', gap: 12, borderTop: '2px solid rgba(30,34,39,0.15)', background: 'rgba(30,34,39,0.03)' }}>
              <span /><span style={{ ...mono, fontSize: 11, color: 'rgba(30,34,39,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Grand Total (as stated)</span>
              <span /><span /><span />
              <span style={{ ...mono, fontSize: 14, color: '#1E2227', fontWeight: 500, textAlign: 'right' }}>{formatMoney(extraction.totalAmount)}</span>
            </div>
          )}
        </div>
      ) : (
        <div style={{ border: '1px solid rgba(30,34,39,0.12)', borderRadius: 4, padding: '28px', textAlign: 'center', marginBottom: 24 }}>
          <p style={{ ...sans, fontSize: 14, color: 'rgba(30,34,39,0.5)' }}>No individual line items detected. The scope and total above are what the AI found.</p>
        </div>
      )}

      {/* IS-Code Comparison panel */}
      <ComparisonPanel
        projectInfo={projectInfo}
        scope={scope}
        setScope={setScope}
        comparison={comparison}
        loading={comparisonLoading}
        error={comparisonError}
        onRunComparison={onRunComparison}
      />

      {/* Extraction accuracy feedback */}
      <div style={{ border: '1px solid rgba(30,34,39,0.15)', borderRadius: 4, padding: '20px 24px', margin: '32px 0' }}>
        <p style={{ ...mono, fontSize: 10, color: '#1F4E79', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>EXTRACTION ACCURACY</p>
        <p style={{ ...serif, fontSize: 17, fontWeight: 700, color: '#1E2227', marginBottom: 4 }}>Was the extraction accurate?</p>
        <p style={{ ...sans, fontSize: 14, color: 'rgba(30,34,39,0.55)', marginBottom: 16 }}>Your feedback helps improve AI extraction quality across different quote formats.</p>

        {feedback.submitted ? (
          <div style={{ background: 'rgba(20,83,45,0.06)', border: '1px solid rgba(20,83,45,0.2)', borderRadius: 4, padding: '12px 14px' }}>
            <p style={{ ...sans, fontSize: 14, color: '#14532D', fontWeight: 600 }}>✓ Thank you — feedback recorded.</p>
          </div>
        ) : (
          <form onSubmit={e => { e.preventDefault(); setFeedback(prev => ({ ...prev, submitted: true })) }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              {(['yes', 'no'] as const).map(r => (
                <button key={r} type="button" onClick={() => setFeedback(prev => ({ ...prev, rating: r }))} style={{ ...mono, padding: '9px 20px', borderRadius: 6, border: feedback.rating === r ? `2px solid ${r === 'yes' ? '#14532D' : '#8C3A22'}` : '1.5px solid rgba(30,34,39,0.2)', background: feedback.rating === r ? (r === 'yes' ? 'rgba(20,83,45,0.08)' : 'rgba(140,58,34,0.08)') : '#fff', color: feedback.rating === r ? (r === 'yes' ? '#14532D' : '#8C3A22') : 'rgba(30,34,39,0.6)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer' }}>
                  {r === 'yes' ? '✓ Yes' : '✗ Needs correction'}
                </button>
              ))}
            </div>
            <textarea value={feedback.comment} onChange={e => setFeedback(prev => ({ ...prev, comment: e.target.value }))} placeholder="What was missing or wrong? (optional)" rows={2} style={{ ...sans, width: '100%', boxSizing: 'border-box', border: '1px solid rgba(30,34,39,0.2)', borderRadius: 6, padding: '10px 12px', fontSize: 13, color: '#1E2227', resize: 'vertical', marginBottom: 10 }} />
            <button type="submit" disabled={!feedback.rating} style={{ ...sans, background: feedback.rating ? '#1F4E79' : 'rgba(31,78,121,0.3)', color: '#F4F4F0', border: 'none', borderRadius: 6, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: feedback.rating ? 'pointer' : 'not-allowed' }}>
              Submit Feedback
            </button>
          </form>
        )}
      </div>

      <button onClick={onStartOver} style={{ ...mono, background: 'transparent', color: 'rgba(30,34,39,0.5)', border: '1px solid rgba(30,34,39,0.2)', borderRadius: 6, padding: '10px 20px', fontSize: 12, cursor: 'pointer', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        ← Upload Another Quote
      </button>
    </div>
  )
}

// ─── Landing banner ────────────────────────────────────────────────────────────

function LandingBanner() {
  return (
    <div style={{ background: '#1E2227', borderBottom: '1px solid rgba(244,244,240,0.06)', padding: '28px 24px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <h1 style={{ ...serif, fontSize: 26, fontWeight: 700, color: '#F4F4F0', lineHeight: 1.25, marginBottom: 10 }}>
          Upload your contractor&rsquo;s quote.
          <br />
          <span style={{ color: 'rgba(244,244,240,0.55)' }}>
            We&rsquo;ll compare every line item against IS-code-calculated figures.
          </span>
        </h1>
        <p style={{ ...sans, fontSize: 14, color: 'rgba(244,244,240,0.45)', lineHeight: 1.6 }}>
          Free to use · No payment required · Materials comparison only
        </p>
      </div>
    </div>
  )
}

// ─── Page orchestrator ─────────────────────────────────────────────────────────

export default function CompareQuotePage() {
  const [step,               setStep]               = useState<Step>('project_pick')
  const [projectInfo,        setProjectInfo]        = useState<ProjectInfo | null>(null)
  const [extraction,         setExtraction]         = useState<ExtractionResult | null>(null)
  const [scope,              setScope]              = useState<ComparisonScope>({ structopro: false, masonpro: false, electropro: false, plumbpro: false, interiorpro: false })
  const [comparison,         setComparison]         = useState<ComparisonResult | null>(null)
  const [comparisonLoading,  setComparisonLoading]  = useState(false)
  const [comparisonError,    setComparisonError]    = useState('')

  const handleProjectSelect = useCallback((project: SelectedProject | null) => {
    if (project) {
      setProjectInfo({
        city:         project.city,
        state:        project.state,
        floorArea:    project.perFloorAreas ? project.perFloorAreas.reduce((a, b) => a + b, 0) / (project.numFloors ?? 1) : null,
        numFloors:    project.numFloors,
        projectName:  project.projectName,
        wallLengthFt: null,
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
    setComparison(null)
    setComparisonError('')
    // Auto-detect scope from extraction
    const detected = detectScopeFromExtraction(result)
    setScope(detected)
    setStep('results')
  }

  async function handleRunComparison() {
    if (!extraction || !projectInfo) return
    if (!projectInfo.floorArea || !projectInfo.numFloors) return

    setComparisonLoading(true)
    setComparisonError('')
    setComparison(null)

    try {
      const res = await fetch('/api/compare-quote/compare', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          extraction,
          projectInfo: {
            city:         projectInfo.city,
            state:        projectInfo.state,
            floorArea:    projectInfo.floorArea,
            numFloors:    projectInfo.numFloors,
            wallLengthFt: projectInfo.wallLengthFt ?? null,
          },
          scope,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setComparisonError(json.error ?? 'Comparison failed — please try again.')
      } else {
        setComparison(json.comparison as ComparisonResult)
      }
    } catch {
      setComparisonError('Network error — please check your connection.')
    } finally {
      setComparisonLoading(false)
    }
  }

  function handleStartOver() {
    setStep('project_pick')
    setProjectInfo(null)
    setExtraction(null)
    setComparison(null)
    setScope({ structopro: false, masonpro: false, electropro: false, plumbpro: false, interiorpro: false })
    setComparisonError('')
  }

  return (
    <div style={{ background: '#F4F4F0', minHeight: '100vh' }}>
      <LandingBanner />
      <StepBar current={step} />
      <div style={{ minHeight: 'calc(100vh - 200px)' }}>
        {step === 'project_pick' && (
          <ProjectPicker onSelect={handleProjectSelect} toolName="Compare Contractor Quote" />
        )}
        {step === 'new_project_form' && (
          <NewProjectForm onSubmit={handleNewProjectSubmit} />
        )}
        {step === 'upload' && projectInfo && (
          <UploadSection projectInfo={projectInfo} onDone={handleExtractionDone} />
        )}
        {step === 'results' && extraction && projectInfo && (
          <ResultsSection
            extraction={extraction}
            projectInfo={projectInfo}
            scope={scope}
            setScope={setScope}
            comparison={comparison}
            comparisonLoading={comparisonLoading}
            comparisonError={comparisonError}
            onRunComparison={handleRunComparison}
            onStartOver={handleStartOver}
          />
        )}
      </div>
    </div>
  )
}
