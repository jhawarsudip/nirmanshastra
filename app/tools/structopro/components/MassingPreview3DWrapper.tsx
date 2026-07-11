'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import type { FloorDatum } from './MassingPreview3D'

// Only download Three.js when this wrapper actually mounts — never on page load
const MassingPreview3D = dynamic(() => import('./MassingPreview3D'), {
  ssr: false,
  loading: () => (
    <div style={loadingStyle}>
      <p style={monoSmall}>LOADING 3D SCENE…</p>
    </div>
  ),
})

interface Props {
  floors: FloorDatum[]
}

interface BoundaryState {
  crashed: boolean
}

// Genuine error boundary — if Three.js fails to render for any reason the rest
// of the page is completely unaffected
class ErrorBoundary extends React.Component<
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

export default function MassingPreview3DWrapper({ floors }: Props) {
  return (
    <div style={{ width: '100%', height: 400, borderRadius: 2, overflow: 'hidden' }}>
      <ErrorBoundary>
        <MassingPreview3D floors={floors} />
      </ErrorBoundary>
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
