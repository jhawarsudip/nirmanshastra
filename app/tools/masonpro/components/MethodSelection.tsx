'use client'

interface Props {
  onSelect: () => void
}

// MasonryPro brick hatch SVG motif
function BrickHatch({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={Math.round(size * 0.75)} viewBox="0 0 32 24" aria-hidden="true">
      {[0,1].map(row => (
        <g key={row}>
          <rect x={row % 2 === 0 ? 0 : 8} y={row * 11} width="22" height="9"
            fill="none" stroke="#1F4E79" strokeWidth="0.8" opacity="0.5" />
          <rect x={row % 2 === 0 ? 24 : 16} y={row * 11} width="8" height="9"
            fill="none" stroke="#1F4E79" strokeWidth="0.8" opacity="0.5" />
        </g>
      ))}
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
            NIRMANSHASTRA · MASONRYPRO
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
          {/* Card 1 — Design from scratch (active) */}
          <button onClick={onSelect} className="text-left rounded-[2px] p-5 transition-all"
            style={{ border: '2px solid #1F4E79', background: 'var(--bg-surface)' }}>
            <div className="relative mb-3">
              <span className="text-[52px] font-bold leading-none select-none"
                style={{ color: 'rgba(31,78,121,0.07)', fontFamily: 'var(--font-plex-mono)' }}>
                P2
              </span>
            </div>
            <BrickHatch size={32} />
            <p className="text-[12px] uppercase tracking-widest mb-2 mt-2"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              Design from Scratch
            </p>
            <p className="text-[13px] leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.60)', fontFamily: 'var(--font-plex-sans)' }}>
              Answer plain questions about your walls. No engineering knowledge needed. IS code quantities calculated automatically.
            </p>
            <div className="mt-4 inline-block px-3 py-1 rounded-[2px] text-[11px]"
              style={{ background: '#1F4E79', color: '#fff', fontFamily: 'var(--font-plex-mono)' }}>
              START →
            </div>
          </button>

          {/* Card 2 — Structural Drawings (Coming Soon) */}
          <div className="rounded-[2px] p-5"
            style={{ border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.02)' }}>
            <div className="mb-3">
              <span className="text-[52px] font-bold leading-none select-none"
                style={{ color: 'rgba(255,255,255,0.03)', fontFamily: 'var(--font-plex-mono)' }}>
                P2
              </span>
            </div>
            <div className="mb-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px]"
              style={{ background: '#1F4E79', color: '#fff', fontFamily: 'var(--font-plex-mono)' }}>
              ✦ USES CLAUDE AI
            </div>
            <p className="text-[12px] uppercase tracking-widest mb-2"
              style={{ color: 'rgba(255,255,255,0.30)', fontFamily: 'var(--font-plex-mono)' }}>
              I Have Structural Drawings
            </p>
            <p className="text-[13px] leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-plex-sans)' }}>
              Upload your architect&apos;s drawings. AI reads wall specs, block types, and opening schedules automatically.
            </p>
            <div className="mt-4 inline-block px-3 py-1 rounded-[2px] text-[11px]"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-plex-mono)' }}>
              COMING SOON
            </div>
          </div>

          {/* Card 3 — Existing Structure (Coming Soon) */}
          <div className="rounded-[2px] p-5"
            style={{ border: '1px solid rgba(217,154,6,0.35)', background: 'rgba(217,154,6,0.03)' }}>
            <div className="mb-3">
              <span className="text-[52px] font-bold leading-none select-none"
                style={{ color: 'rgba(217,154,6,0.06)', fontFamily: 'var(--font-plex-mono)' }}>
                P2
              </span>
            </div>
            <div className="mb-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px]"
              style={{ background: '#D99A06', color: 'var(--text-primary)', fontFamily: 'var(--font-plex-mono)' }}>
              ⚠ VERIFY STRUCTURE FIRST
            </div>
            <p className="text-[12px] uppercase tracking-widest mb-2"
              style={{ color: 'rgba(255,255,255,0.30)', fontFamily: 'var(--font-plex-mono)' }}>
              Existing Structure / Renovation
            </p>
            <p className="text-[13px] leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-plex-sans)' }}>
              Adding masonry to new floors, horizontal extension, renovation, or partition walls only.
            </p>
            <div className="mt-4 inline-block px-3 py-1 rounded-[2px] text-[11px]"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-plex-mono)' }}>
              COMING SOON
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
