'use client'

interface Props {
  onSelect: () => void
}

function TileGridMotif({ size = 32 }: { size?: number }) {
  const cell = size / 4
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {[0, 1, 2, 3].map(row =>
        [0, 1, 2, 3].map(col => (
          <rect
            key={`${row}-${col}`}
            x={col * cell + 0.5}
            y={row * cell + 0.5}
            width={cell - 1}
            height={cell - 1}
            fill="none"
            stroke="#1F4E79"
            strokeWidth="0.7"
            opacity={row === 1 && col === 1 ? 0.8 : 0.3}
          />
        ))
      )}
      <line x1={cell + 0.5} y1={cell + 0.5} x2={2 * cell - 0.5} y2={2 * cell - 0.5} stroke="#1F4E79" strokeWidth="0.5" opacity="0.5" />
    </svg>
  )
}

export default function MethodSelection({ onSelect }: Props) {
  return (
    <div className="w-full px-8 py-10" style={{ background: "var(--bg-base)" }}>
      <div className="w-full">
        <div className="mb-8">
          <p className="text-[10px] uppercase tracking-widest mb-1"
            style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-plex-mono)' }}>
            NIRMANSHASTRA · INTERIORPRO
          </p>
          <h2 className="text-[28px] font-bold"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-serif)' }}>
            How would you like to proceed?
          </h2>
          <p className="text-[14px] mt-2"
            style={{ color: 'rgba(255,255,255,0.50)', fontFamily: 'var(--font-plex-sans)' }}>
            Select the method that best describes your situation.
          </p>
        </div>

        {/* Step bar */}
        <div className="flex items-center mb-8">
          {(['REG', 'METHOD', 'DETAILS', 'RESULTS'] as const).map((s, i) => (
            <div key={s} className="flex items-center">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] border"
                  style={{
                    background:  i === 0 ? '#14532D' : i === 1 ? '#1F4E79' : 'transparent',
                    borderColor: i === 0 ? '#14532D' : i === 1 ? '#1F4E79' : 'rgba(255,255,255,0.18)',
                    color:       i <= 1 ? '#fff' : 'rgba(255,255,255,0.30)',
                    fontFamily:  'var(--font-plex-mono)',
                  }}>
                  {i === 0 ? '✓' : i + 1}
                </div>
                <span className="text-[10px] uppercase tracking-widest whitespace-nowrap hidden sm:inline"
                  style={{ fontFamily: 'var(--font-plex-mono)', color: i === 0 ? '#14532D' : i === 1 ? '#1F4E79' : 'rgba(255,255,255,0.25)' }}>
                  {s}
                </span>
              </div>
              {i < 3 && <div className="w-6 h-px mx-2" style={{ background: 'rgba(255,255,255,0.08)' }} />}
            </div>
          ))}
        </div>

        <div className="border-b mb-6 pb-1" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <p className="text-[11px] uppercase tracking-widest"
            style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
            STEP 02 · METHOD SELECTION
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          {/* Card 1 — Quick Estimate (active) */}
          <button onClick={onSelect} className="text-left rounded-[2px] p-5 transition-all"
            style={{ border: '2px solid #1F4E79', background: 'var(--bg-surface)' }}>
            <div className="relative mb-3">
              <span className="text-[52px] font-bold leading-none select-none"
                style={{ color: 'rgba(31,78,121,0.07)', fontFamily: 'var(--font-plex-mono)' }}>
                P5
              </span>
            </div>
            <TileGridMotif size={32} />
            <div className="mt-2 mb-2 flex items-center gap-2">
              <p className="text-[12px] uppercase tracking-widest"
                style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                Quick Estimate
              </p>
              <span className="px-2 py-0.5 rounded-[2px] text-[9px]"
                style={{ background: 'rgba(31,78,121,0.1)', color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                ±15% ACCURACY
              </span>
            </div>
            <p className="text-[13px] leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.60)', fontFamily: 'var(--font-plex-sans)' }}>
              Best for budgeting. Enter total floor area and key parameters. All 4 grade tiers compared live — Basic to Luxury.
            </p>
            <div className="mt-4 inline-block px-3 py-1 rounded-[2px] text-[11px]"
              style={{ background: '#1F4E79', color: '#fff', fontFamily: 'var(--font-plex-mono)' }}>
              START →
            </div>
          </button>

          {/* Card 2 — Exact Dimensions + AI floor plan */}
          <div className="rounded-[2px] p-5"
            style={{ border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.02)' }}>
            <div className="mb-3">
              <span className="text-[52px] font-bold leading-none select-none"
                style={{ color: 'rgba(255,255,255,0.03)', fontFamily: 'var(--font-plex-mono)' }}>
                P5
              </span>
            </div>
            <div className="flex flex-col gap-1 mb-3">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] w-fit"
                style={{ background: '#1F4E79', color: '#fff', fontFamily: 'var(--font-plex-mono)' }}>
                ✦ USES CLAUDE AI
              </div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] w-fit"
                style={{ background: 'rgba(31,78,121,0.1)', color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                ±5% ACCURACY
              </div>
            </div>
            <p className="text-[12px] uppercase tracking-widest mb-2"
              style={{ color: 'rgba(255,255,255,0.30)', fontFamily: 'var(--font-plex-mono)' }}>
              Exact Dimensions
            </p>
            <p className="text-[13px] leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-plex-sans)' }}>
              Best for contractor briefing. Upload your floor plan — AI auto-fills room dimensions. Or enter room-by-room measurements manually.
            </p>
            <div className="mt-4 inline-block px-3 py-1 rounded-[2px] text-[11px]"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-plex-mono)' }}>
              COMING SOON
            </div>
          </div>

          {/* Card 3 — AI Floor Plan Upload info */}
          <div className="rounded-[2px] p-5"
            style={{ border: '1px solid rgba(217,154,6,0.35)', background: 'rgba(217,154,6,0.03)' }}>
            <div className="mb-3">
              <span className="text-[52px] font-bold leading-none select-none"
                style={{ color: 'rgba(217,154,6,0.06)', fontFamily: 'var(--font-plex-mono)' }}>
                P5
              </span>
            </div>
            <div className="mb-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px]"
              style={{ background: '#D99A06', color: 'var(--text-primary)', fontFamily: 'var(--font-plex-mono)' }}>
              ✦ AI FLOOR PLAN READ
            </div>
            <p className="text-[12px] uppercase tracking-widest mb-2"
              style={{ color: 'rgba(255,255,255,0.30)', fontFamily: 'var(--font-plex-mono)' }}>
              I Have Floor Plan Drawings
            </p>
            <p className="text-[13px] leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-plex-sans)' }}>
              Upload your architect&apos;s floor plan. Claude AI reads room sizes, kitchen layout, and bathroom count automatically. Available with Exact Dimensions path.
            </p>
            <div className="mt-4 inline-block px-3 py-1 rounded-[2px] text-[11px]"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-plex-mono)' }}>
              COMING SOON
            </div>
          </div>

        </div>

        {/* Grade comparison free preview hint */}
        <div className="mt-6 p-4 rounded-[2px]"
          style={{ border: '1px solid rgba(31,78,121,0.25)', background: 'rgba(31,78,121,0.03)' }}>
          <p className="text-[11px] uppercase tracking-widest mb-1"
            style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
            ✦ UNIQUE FREE FEATURE — GRADE COMPARISON TABLE
          </p>
          <p className="text-[13px]"
            style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-plex-sans)' }}>
            InteriorPro shows the full 4-grade comparison (Basic → Luxury) for your project — completely free. No other app does this. Interior grade affects your total project cost more than any single phase.
          </p>
        </div>

      </div>
    </div>
  )
}
