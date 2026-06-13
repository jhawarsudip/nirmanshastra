'use client'

interface Props {
  onSelect: () => void
}

function RiserMotif({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect x="10" y="1" width="12" height="5" fill="none" stroke="#1F4E79" strokeWidth="0.8" opacity="0.7" />
      <line x1="16" y1="6" x2="16" y2="29" stroke="#1F4E79" strokeWidth="1.2" opacity="0.7" />
      <line x1="16" y1="11" x2="25" y2="11" stroke="#1F4E79" strokeWidth="0.8" opacity="0.5" />
      <line x1="16" y1="18" x2="25" y2="18" stroke="#1F4E79" strokeWidth="0.8" opacity="0.5" />
      <path d="M25 11 L29 11 L29 15 L25 15" fill="none" stroke="#1F4E79" strokeWidth="0.6" opacity="0.6" />
      <path d="M25 18 L29 18 L29 22 L25 22" fill="none" stroke="#1F4E79" strokeWidth="0.6" opacity="0.6" />
      <rect x="8" y="26" width="16" height="4" fill="none" stroke="#1F4E79" strokeWidth="0.8" opacity="0.4" />
    </svg>
  )
}

export default function MethodSelection({ onSelect }: Props) {
  return (
    <div className="min-h-screen bg-sheet-white flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <p className="text-[10px] uppercase tracking-widest mb-1"
            style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
            NIRMANSHASTRA · PLUMBPRO
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
                P4
              </span>
            </div>
            <RiserMotif size={32} />
            <p className="text-[12px] uppercase tracking-widest mb-2 mt-2"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              Design from Scratch
            </p>
            <p className="text-[13px] leading-relaxed"
              style={{ color: 'rgba(30,34,39,0.65)', fontFamily: 'var(--font-plex-sans)' }}>
              Answer plain questions. IS 1172:1993 water demand, tank sizing, pipe schedule, and pump HP calculated automatically.
            </p>
            <div className="mt-4 inline-block px-3 py-1 rounded-[2px] text-[11px]"
              style={{ background: '#1F4E79', color: '#fff', fontFamily: 'var(--font-plex-mono)' }}>
              START →
            </div>
          </button>

          {/* Card 2 — Plumbing Drawings (Coming Soon) */}
          <div className="rounded-[2px] p-5"
            style={{ border: '1px solid rgba(30,34,39,0.18)', background: 'rgba(30,34,39,0.02)' }}>
            <div className="mb-3">
              <span className="text-[52px] font-bold leading-none select-none"
                style={{ color: 'rgba(30,34,39,0.04)', fontFamily: 'var(--font-plex-mono)' }}>
                P4
              </span>
            </div>
            <div className="mb-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px]"
              style={{ background: '#1F4E79', color: '#fff', fontFamily: 'var(--font-plex-mono)' }}>
              ✦ USES CLAUDE AI
            </div>
            <p className="text-[12px] uppercase tracking-widest mb-2"
              style={{ color: 'rgba(30,34,39,0.35)', fontFamily: 'var(--font-plex-mono)' }}>
              I Have Plumbing Drawings
            </p>
            <p className="text-[13px] leading-relaxed"
              style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-sans)' }}>
              Upload your isometric or riser diagram. AI reads pipe sizes, fixture counts, and tank dimensions automatically.
            </p>
            <div className="mt-4 inline-block px-3 py-1 rounded-[2px] text-[11px]"
              style={{ background: 'rgba(30,34,39,0.1)', color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
              COMING SOON
            </div>
          </div>

          {/* Card 3 — Retrofit/Extension */}
          <div className="rounded-[2px] p-5"
            style={{ border: '1px solid rgba(217,154,6,0.35)', background: 'rgba(217,154,6,0.03)' }}>
            <div className="mb-3">
              <span className="text-[52px] font-bold leading-none select-none"
                style={{ color: 'rgba(217,154,6,0.06)', fontFamily: 'var(--font-plex-mono)' }}>
                P4
              </span>
            </div>
            <div className="mb-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px]"
              style={{ background: '#D99A06', color: '#1E2227', fontFamily: 'var(--font-plex-mono)' }}>
              ⚠ CONTINGENCY +20–30%
            </div>
            <p className="text-[12px] uppercase tracking-widest mb-2"
              style={{ color: 'rgba(30,34,39,0.35)', fontFamily: 'var(--font-plex-mono)' }}>
              Retrofit / Extension
            </p>
            <p className="text-[13px] leading-relaxed"
              style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-sans)' }}>
              Extend riser, add new bathrooms, or re-route drainage. If replacing GI pipes &gt;20 years old, add 20–30% for removal and wall chase repair.
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
