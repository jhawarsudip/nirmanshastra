'use client'

interface Props {
  onSelect: () => void
}

function SLDMotif({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={Math.round(size * 0.6)} viewBox="0 0 32 20" aria-hidden="true">
      <line x1="2" y1="10" x2="30" y2="10" stroke="#1F4E79" strokeWidth="1.2" opacity="0.6" />
      <line x1="8"  y1="5" x2="8"  y2="10" stroke="#1F4E79" strokeWidth="0.8" opacity="0.5" />
      <circle cx="8"  cy="3.5" r="2.5" fill="none" stroke="#1F4E79" strokeWidth="0.8" opacity="0.7" />
      <line x1="16" y1="5" x2="16" y2="10" stroke="#1F4E79" strokeWidth="0.8" opacity="0.5" />
      <circle cx="16" cy="3.5" r="2.5" fill="none" stroke="#1F4E79" strokeWidth="0.8" opacity="0.7" />
      <line x1="24" y1="5" x2="24" y2="10" stroke="#1F4E79" strokeWidth="0.8" opacity="0.5" />
      <circle cx="24" cy="3.5" r="2.5" fill="none" stroke="#1F4E79" strokeWidth="0.8" opacity="0.7" />
      <line x1="8"  y1="10" x2="8"  y2="18" stroke="#1F4E79" strokeWidth="0.6" strokeDasharray="2,2" opacity="0.4" />
      <line x1="16" y1="10" x2="16" y2="18" stroke="#1F4E79" strokeWidth="0.6" strokeDasharray="2,2" opacity="0.4" />
      <line x1="24" y1="10" x2="24" y2="18" stroke="#1F4E79" strokeWidth="0.6" strokeDasharray="2,2" opacity="0.4" />
    </svg>
  )
}

export default function MethodSelection({ onSelect }: Props) {
  return (
    <div className="w-full bg-sheet-white px-8 py-10">
      <div className="w-full">
        <div className="mb-8">
          <p className="text-[10px] uppercase tracking-widest mb-1"
            style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
            NIRMANSHASTRA · ELECTROPRO
          </p>
          <h2 className="text-[28px] font-bold"
            style={{ color: '#1E2227', fontFamily: 'var(--font-plex-serif)' }}>
            How would you like to proceed?
          </h2>
          <p className="text-[14px] mt-2"
            style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-sans)' }}>
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
                    borderColor: i === 0 ? '#14532D' : i === 1 ? '#1F4E79' : 'rgba(30,34,39,0.22)',
                    color:       i <= 1 ? '#fff' : 'rgba(30,34,39,0.35)',
                    fontFamily:  'var(--font-plex-mono)',
                  }}>
                  {i === 0 ? '✓' : i + 1}
                </div>
                <span className="text-[10px] uppercase tracking-widest whitespace-nowrap hidden sm:inline"
                  style={{ fontFamily: 'var(--font-plex-mono)', color: i === 0 ? '#14532D' : i === 1 ? '#1F4E79' : 'rgba(30,34,39,0.3)' }}>
                  {s}
                </span>
              </div>
              {i < 3 && <div className="w-6 h-px mx-2" style={{ background: 'rgba(30,34,39,0.14)' }} />}
            </div>
          ))}
        </div>

        <div className="border-b mb-6 pb-1" style={{ borderColor: 'rgba(30,34,39,0.12)' }}>
          <p className="text-[11px] uppercase tracking-widest"
            style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
            STEP 02 · METHOD SELECTION
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1 — Design from scratch (active) */}
          <button onClick={onSelect} className="text-left rounded-[2px] p-5 transition-all"
            style={{ border: '2px solid #1F4E79', background: '#F4F4F0' }}>
            <div className="relative mb-3">
              <span className="text-[52px] font-bold leading-none select-none"
                style={{ color: 'rgba(31,78,121,0.07)', fontFamily: 'var(--font-plex-mono)' }}>
                P3
              </span>
            </div>
            <SLDMotif size={32} />
            <p className="text-[12px] uppercase tracking-widest mb-2 mt-2"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              Design from Scratch
            </p>
            <p className="text-[13px] leading-relaxed"
              style={{ color: 'rgba(30,34,39,0.65)', fontFamily: 'var(--font-plex-sans)' }}>
              Answer plain questions about your building. IS 732:2019 circuit counts, wire quantities, and DB schedule calculated automatically.
            </p>
            <div className="mt-4 inline-block px-3 py-1 rounded-[2px] text-[11px]"
              style={{ background: '#1F4E79', color: '#fff', fontFamily: 'var(--font-plex-mono)' }}>
              START →
            </div>
          </button>

          {/* Card 2 — Electrical Drawings (Coming Soon) */}
          <div className="rounded-[2px] p-5"
            style={{ border: '1px solid rgba(30,34,39,0.18)', background: 'rgba(30,34,39,0.02)' }}>
            <div className="mb-3">
              <span className="text-[52px] font-bold leading-none select-none"
                style={{ color: 'rgba(30,34,39,0.04)', fontFamily: 'var(--font-plex-mono)' }}>
                P3
              </span>
            </div>
            <div className="mb-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px]"
              style={{ background: '#1F4E79', color: '#fff', fontFamily: 'var(--font-plex-mono)' }}>
              ✦ USES CLAUDE AI
            </div>
            <p className="text-[12px] uppercase tracking-widest mb-2"
              style={{ color: 'rgba(30,34,39,0.35)', fontFamily: 'var(--font-plex-mono)' }}>
              I Have Electrical Drawings
            </p>
            <p className="text-[13px] leading-relaxed"
              style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-sans)' }}>
              Upload your single-line diagram or DB schedule. AI reads circuit counts, MCB ratings, and wire sizes automatically.
            </p>
            <div className="mt-4 inline-block px-3 py-1 rounded-[2px] text-[11px]"
              style={{ background: 'rgba(30,34,39,0.1)', color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
              COMING SOON
            </div>
          </div>

          {/* Card 3 — Retrofit/Upgrade (Coming Soon) */}
          <div className="rounded-[2px] p-5"
            style={{ border: '1px solid rgba(217,154,6,0.35)', background: 'rgba(217,154,6,0.03)' }}>
            <div className="mb-3">
              <span className="text-[52px] font-bold leading-none select-none"
                style={{ color: 'rgba(217,154,6,0.06)', fontFamily: 'var(--font-plex-mono)' }}>
                P3
              </span>
            </div>
            <div className="mb-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px]"
              style={{ background: '#D99A06', color: '#1E2227', fontFamily: 'var(--font-plex-mono)' }}>
              ⚠ CONTINGENCY +15–20%
            </div>
            <p className="text-[12px] uppercase tracking-widest mb-2"
              style={{ color: 'rgba(30,34,39,0.35)', fontFamily: 'var(--font-plex-mono)' }}>
              Retrofit / Upgrade
            </p>
            <p className="text-[13px] leading-relaxed"
              style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-sans)' }}>
              Full rewiring, additional circuits, or DB panel upgrade only. Add 15–20% contingency for concealed wall chase repair.
            </p>
            <div className="mt-4 inline-block px-3 py-1 rounded-[2px] text-[11px]"
              style={{ background: 'rgba(30,34,39,0.1)', color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
              COMING SOON
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
