'use client'

export interface LiveSummaryData {
  floors?:         string
  bua?:            number
  siteCondition?:  string
  concreteGrade?:  string
  steelGrade?:     string
  wallType?:       string
  totalArea?:      number
  grade?:          string
  labourEnabled?:  boolean
  [key: string]:   unknown
}

interface BaseRegData {
  name:        string
  projectName: string
  city:        string
  state:       string
}

interface LiveSummaryPanelProps {
  toolName:  string
  toolPhase: string
  price:     string
  regData:   BaseRegData
  liveData:  LiveSummaryData
}

function Row({ label, value }: { label: string; value: string | number | undefined }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '10px 0', borderBottom: '1px solid rgba(244,244,240,0.07)' }}>
      <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: 'rgba(244,244,240,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 13, color: '#F4F4F0', textAlign: 'right', maxWidth: '55%' }}>{value}</span>
    </div>
  )
}

export default function LiveSummaryPanel({ toolName, toolPhase, price, regData, liveData }: LiveSummaryPanelProps) {
  return (
    <div
      className="h-full"
      style={{ background: 'var(--bg-surface)', padding: '32px 28px', borderLeft: '1px solid rgba(255,255,255,0.06)', minHeight: '100%', position: 'sticky', top: 0 }}
    >
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, color: 'rgba(244,244,240,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
          LIVE SUMMARY
        </p>
        <h2 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 22, fontWeight: 600, color: '#F4F4F0', lineHeight: 1.2 }}>
          {regData.projectName || 'Your Project'}
        </h2>
        <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 13, color: 'rgba(244,244,240,0.45)', marginTop: 4 }}>
          {regData.name && `${regData.name} · `}{regData.city}{regData.state ? `, ${regData.state}` : ''}
        </p>
      </div>

      {/* Live data rows */}
      <div style={{ borderTop: '1px solid rgba(244,244,240,0.07)' }}>
        <Row label="Floors"         value={liveData.floors} />
        <Row label="Built-up Area"  value={liveData.bua ? `${liveData.bua.toLocaleString('en-IN')} sqft` : undefined} />
        <Row label="Site Condition" value={liveData.siteCondition} />
        <Row label="Concrete Grade" value={liveData.concreteGrade} />
        <Row label="Steel Grade"    value={liveData.steelGrade} />
        <Row label="Wall Type"      value={liveData.wallType} />
        <Row label="Total Area"     value={liveData.totalArea ? `${liveData.totalArea.toLocaleString('en-IN')} sqm` : undefined} />
        <Row label="Interior Grade" value={liveData.grade} />
        <Row label="Labour"         value={liveData.labourEnabled === true ? 'Included' : liveData.labourEnabled === false ? 'Not included' : undefined} />
      </div>

      {/* Engineering note */}
      <div
        style={{
          marginTop: 32,
          padding: '16px',
          border: '1px solid rgba(31,78,121,0.35)',
          background: 'rgba(31,78,121,0.08)',
        }}
      >
        <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, color: '#7BA7CC', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
          IS-CODE VERIFIED
        </p>
        <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 12, color: 'rgba(244,244,240,0.5)', lineHeight: 1.65 }}>
          All calculations use locked IS code values. Rates auto-filled from city database.
          Your estimate updates as you fill each section.
        </p>
      </div>

      {/* Phase context — bottom of panel */}
      <div style={{ marginTop: 'auto', paddingTop: 32 }}>
        <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, color: 'rgba(244,244,240,0.25)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {toolName}
        </p>
        <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: '#8C3A22', marginTop: 4 }}>
          Unlock full report — {price}
        </p>
      </div>
    </div>
  )
}
