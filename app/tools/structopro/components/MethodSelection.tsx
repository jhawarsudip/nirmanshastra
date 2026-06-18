'use client'

interface Props {
  onSelect: (method: 'design_myself' | 'vertical_extension') => void
}

export default function MethodSelection({ onSelect }: Props) {
  return (
    <div className="w-full bg-sheet-white px-8 py-10">
      <div className="w-full">
        {/* Header */}
        <div className="mb-8 rounded-[2px] px-6 py-5 relative overflow-hidden"
          style={{ background: '#1E2227', border: '1px solid rgba(30,34,39,0.7)' }}>
          <div style={{ position: 'absolute', bottom: -10, right: -10, opacity: 0.1, pointerEvents: 'none', lineHeight: 0 }}>
            <svg width="130" height="130" viewBox="0 0 130 130" fill="none" aria-hidden="true">
              {([
                [16,16],[42,10],[70,20],[98,14],[122,24],
                [24,42],[56,38],[84,46],[116,38],
                [12,68],[38,62],[66,70],[96,64],[124,72],
                [20,94],[50,90],[80,96],[110,90],
                [16,120],[46,116],[76,122],[106,117],
              ] as [number,number][]).map(([x,y],i) => (
                <circle key={i} cx={x} cy={y} r="4" fill="#F4F4F0" />
              ))}
              <line x1="65" y1="0" x2="65" y2="130" stroke="#F4F4F0" strokeWidth="1" />
              <line x1="0" y1="65" x2="130" y2="65" stroke="#F4F4F0" strokeWidth="1" />
            </svg>
          </div>
          <p
            className="text-[10px] uppercase tracking-widest mb-2"
            style={{ color: 'rgba(201,168,76,0.5)', fontFamily: 'var(--font-plex-mono)' }}
          >
            NIRMANSHASTRA · STRUCTOPRO
          </p>
          <h2
            className="font-bold mb-2"
            style={{ color: '#F4F4F0', fontFamily: 'var(--font-plex-serif)', fontSize: 'clamp(22px,3.5vw,30px)' }}
          >
            How would you like to proceed?
          </h2>
          <p
            className="text-[14px]"
            style={{ color: 'rgba(244,244,240,0.5)', fontFamily: 'var(--font-plex-sans)' }}
          >
            Select the method that best describes your situation.
          </p>
        </div>

        {/* Step bar */}
        <div className="flex items-center mb-8">
          {(['REG', 'METHOD', 'DETAILS', 'RESULTS'] as const).map((step, i) => (
            <div key={step} className="flex items-center">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] border"
                  style={{
                    background:  i === 0 ? '#14532D' : i === 1 ? '#1F4E79' : 'transparent',
                    borderColor: i === 0 ? '#14532D' : i === 1 ? '#1F4E79' : 'rgba(30,34,39,0.22)',
                    color:       i <= 1  ? '#fff'    : 'rgba(30,34,39,0.35)',
                    fontFamily:  'var(--font-plex-mono)',
                  }}
                >
                  {i === 0 ? '✓' : i + 1}
                </div>
                <span
                  className="text-[10px] uppercase tracking-widest whitespace-nowrap hidden sm:inline"
                  style={{
                    fontFamily: 'var(--font-plex-mono)',
                    color: i === 0 ? '#14532D' : i === 1 ? '#1F4E79' : 'rgba(30,34,39,0.3)',
                  }}
                >
                  {step}
                </span>
              </div>
              {i < 3 && (
                <div className="w-6 h-px mx-2" style={{ background: 'rgba(30,34,39,0.14)' }} />
              )}
            </div>
          ))}
        </div>

        <div
          className="border-b border-iron-ink mb-6 pb-1"
          style={{ borderColor: 'rgba(30,34,39,0.12)' }}
        >
          <p
            className="text-[11px] uppercase tracking-widest"
            style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}
          >
            STEP 02 · METHOD SELECTION
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1 — Design Myself (active) */}
          <button
            onClick={() => onSelect('design_myself')}
            className="text-left rounded-[2px] p-5 transition-all"
            style={{
              border: '2px solid #1F4E79',
              background: '#F4F4F0',
            }}
          >
            {/* P1 large background numeral */}
            <div className="relative mb-3">
              <span
                className="text-[52px] font-bold leading-none select-none"
                style={{ color: 'rgba(31,78,121,0.07)', fontFamily: 'var(--font-plex-mono)' }}
              >
                P1
              </span>
            </div>
            {/* Concrete hatch motif */}
            <svg width="32" height="24" viewBox="0 0 32 24" className="mb-3" aria-hidden="true">
              {[[4,4],[12,4],[20,4],[28,5],[8,12],[16,12],[24,12],[4,20],[12,20],[20,20],[28,20]].map(([x,y],i) => (
                <circle key={i} cx={x} cy={y} r="2" fill="none" stroke="#1F4E79" strokeWidth="0.8" opacity="0.5" />
              ))}
            </svg>
            <p
              className="text-[12px] uppercase tracking-widest mb-2"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}
            >
              Design Myself
            </p>
            <p
              className="text-[13px] leading-relaxed"
              style={{ color: 'rgba(30,34,39,0.65)', fontFamily: 'var(--font-plex-sans)' }}
            >
              Answer plain questions about your building. No engineering knowledge needed.
            </p>
            <div
              className="mt-4 inline-block px-3 py-1 rounded-[2px] text-[11px]"
              style={{ background: '#1F4E79', color: '#fff', fontFamily: 'var(--font-plex-mono)' }}
            >
              START →
            </div>
          </button>

          {/* Card 2 — Structural Drawings (Coming Soon) */}
          <div
            className="rounded-[2px] p-5 relative overflow-hidden"
            style={{
              border: '1px solid rgba(30,34,39,0.18)',
              background: 'rgba(30,34,39,0.02)',
            }}
          >
            <div className="mb-3">
              <span
                className="text-[52px] font-bold leading-none select-none"
                style={{ color: 'rgba(30,34,39,0.04)', fontFamily: 'var(--font-plex-mono)' }}
              >
                P1
              </span>
            </div>
            {/* AI badge */}
            <div
              className="mb-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px]"
              style={{ background: '#1F4E79', color: '#fff', fontFamily: 'var(--font-plex-mono)' }}
            >
              ✦ USES CLAUDE AI
            </div>
            <p
              className="text-[12px] uppercase tracking-widest mb-2"
              style={{ color: 'rgba(30,34,39,0.35)', fontFamily: 'var(--font-plex-mono)' }}
            >
              I Have Structural Drawings
            </p>
            <p
              className="text-[13px] leading-relaxed"
              style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-sans)' }}
            >
              Upload your engineer&apos;s drawings. AI reads column sizes, bar diameters, and concrete grades automatically.
            </p>
            <div
              className="mt-4 inline-block px-3 py-1 rounded-[2px] text-[11px]"
              style={{ background: 'rgba(30,34,39,0.1)', color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}
            >
              COMING SOON
            </div>
          </div>

          {/* Card 3 — Add Floors (active) */}
          <button
            onClick={() => onSelect('vertical_extension')}
            className="text-left rounded-[2px] p-5 relative overflow-hidden transition-all"
            style={{
              border: '2px solid rgba(217,154,6,0.55)',
              background: 'rgba(217,154,6,0.04)',
            }}
          >
            <div className="mb-3">
              <span
                className="text-[52px] font-bold leading-none select-none"
                style={{ color: 'rgba(217,154,6,0.08)', fontFamily: 'var(--font-plex-mono)' }}
              >
                P1
              </span>
            </div>
            <div
              className="mb-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px]"
              style={{ background: '#D99A06', color: '#1E2227', fontFamily: 'var(--font-plex-mono)' }}
            >
              ⚠ STRUCT. CERT. REQUIRED
            </div>
            <p
              className="text-[12px] uppercase tracking-widest mb-2"
              style={{ color: '#8C5A00', fontFamily: 'var(--font-plex-mono)' }}
            >
              Add Floors to Existing
            </p>
            <p
              className="text-[13px] leading-relaxed"
              style={{ color: 'rgba(30,34,39,0.65)', fontFamily: 'var(--font-plex-sans)' }}
            >
              Estimate cost of additional floors on your current structure. Includes IS column safety checks and splice bar schedule.
            </p>
            <div
              className="mt-4 inline-block px-3 py-1 rounded-[2px] text-[11px]"
              style={{ background: '#D99A06', color: '#1E2227', fontFamily: 'var(--font-plex-mono)' }}
            >
              START →
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
