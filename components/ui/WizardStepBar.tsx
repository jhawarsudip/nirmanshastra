'use client'

const STEP_LABELS = ['Registration', 'Method', 'Build Details', 'Results']

interface WizardStepBarProps {
  currentStep: string
  toolName: string
  toolPhase: string
}

const STEP_INDEX: Record<string, number> = {
  register: 0,
  method:   1,
  details:  2,
  results:  3,
}

export default function WizardStepBar({ currentStep, toolName, toolPhase }: WizardStepBarProps) {
  const current = STEP_INDEX[currentStep] ?? 0

  return (
    <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="px-6 md:px-12 py-4 flex items-center justify-between flex-wrap gap-4">
        {/* Tool identity */}
        <div className="flex items-center gap-3">
          <span style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 16, fontWeight: 600, color: '#F4F4F0' }}>{toolName}</span>
        </div>

        {/* Horizontal step timeline */}
        <div className="flex items-center gap-0">
          {STEP_LABELS.map((label, i) => {
            const done    = i < current
            const active  = i === current
            const pending = i > current
            return (
              <div key={label} className="flex items-center">
                <div className="flex items-center gap-2">
                  {/* Step dot */}
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      border: `2px solid ${done ? '#14532D' : active ? '#1F4E79' : 'rgba(244,244,240,0.2)'}`,
                      background: done ? '#14532D' : active ? '#1F4E79' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {done ? (
                      <span style={{ color: '#fff', fontSize: 11, fontFamily: 'var(--font-plex-mono)' }}>✓</span>
                    ) : (
                      <span style={{ color: active ? '#fff' : 'rgba(244,244,240,0.3)', fontSize: 10, fontFamily: 'var(--font-plex-mono)' }}>{i + 1}</span>
                    )}
                  </div>
                  {/* Label — only on md+ */}
                  <span
                    className="hidden sm:inline"
                    style={{
                      fontFamily: 'var(--font-plex-mono)',
                      fontSize: 10,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase' as const,
                      color: done ? '#14532D' : active ? '#7BA7CC' : 'rgba(244,244,240,0.28)',
                    }}
                  >
                    {label}
                  </span>
                </div>
                {/* Connector line */}
                {i < STEP_LABELS.length - 1 && (
                  <div
                    style={{
                      width: 32,
                      height: 1,
                      background: done ? '#14532D' : 'rgba(244,244,240,0.15)',
                      margin: '0 8px',
                      flexShrink: 0,
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
