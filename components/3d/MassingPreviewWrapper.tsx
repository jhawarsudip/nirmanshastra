'use client'

import React from 'react'

interface BoundaryState { crashed: boolean }

class MassingErrorBoundary extends React.Component<
  { children: React.ReactNode },
  BoundaryState
> {
  state: BoundaryState = { crashed: false }

  static getDerivedStateFromError(): BoundaryState {
    return { crashed: true }
  }

  render() {
    if (this.state.crashed) {
      return (
        <div style={fallbackStyle}>
          <p style={monoSmall}>
            3D preview couldn&apos;t load on this device — your report data is unaffected
          </p>
        </div>
      )
    }
    return this.props.children
  }
}

export function MassingPreviewContainer({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ width: '100%', height: 400, borderRadius: 2, overflow: 'hidden' }}>
      <MassingErrorBoundary>
        {children}
      </MassingErrorBoundary>
    </div>
  )
}

export function LoadingSlot() {
  return (
    <div style={loadingStyle}>
      <p style={monoSmall}>LOADING 3D SCENE…</p>
    </div>
  )
}

const loadingStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  background: '#0c1117',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const fallbackStyle: React.CSSProperties = {
  padding: '20px 24px',
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.08)',
}

const monoSmall: React.CSSProperties = {
  color: 'rgba(255,255,255,0.40)',
  fontFamily: 'var(--font-plex-mono)',
  fontSize: 12,
  letterSpacing: '0.03em',
}
