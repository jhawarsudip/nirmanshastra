'use client'

// The 3D model with its controls. It starts by itself the moment it is on the page: nothing to open or click.
// The controls (view, replay, pause, layers) are real buttons, so everything can be done from a keyboard too.

import dynamic from 'next/dynamic'
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import type { SceneModel } from '@/lib/structopro-qty/scene'
import { LAYERS, type LayerKey, type ViewKey } from './structure-colors'
import PlanFallback from './PlanFallback'
import { useMotionOK } from '@/lib/v2/store'
import { useCopy } from '@/lib/i18n/use-copy'
import { COPY } from './copy'

function Loading() {
  const t = useCopy(COPY)
  return (
    <div className="ns-r-loading" role="status">
      <span className="ns-i-spin" aria-hidden="true" />
      <span>{t.loading}</span>
    </div>
  )
}

const Scene = dynamic(() => import('./StructureScene'), { ssr: false, loading: () => <Loading /> })

class Boundary extends Component<{ onCrash: () => void; children: ReactNode }, { crashed: boolean }> {
  state = { crashed: false }
  static getDerivedStateFromError() { return { crashed: true } }
  componentDidCatch() { this.props.onCrash() }
  render() { return this.state.crashed ? null : this.props.children }
}

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

const VIEWS: ViewKey[] = ['3d', 'plan', 'front']

export default function StructureViewer({ model, caption }: { model: SceneModel; caption?: string }) {
  const t = useCopy(COPY)
  const motion = useMotionOK()
  const [view, setView] = useState<ViewKey>('3d')
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({ foundation: true, ground: true, columns: true, beams: true, slabs: true, balconies: true, stair: true })
  const [replayKey, setReplayKey] = useState(0)
  const [spin, setSpin] = useState(true)
  const [active, setActive] = useState(true)
  const [failed, setFailed] = useState(false)
  const [ready, setReady] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => { if (!hasWebGL()) setFailed(true) }, [])

  // do no work while the model is off-screen
  useEffect(() => {
    const el = box.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    setActive(true)
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { threshold: 0.05 })
    io.observe(el)
    return () => io.disconnect()
  }, [failed]) // the stage element is rebuilt after a fallback and a retry, so watch the new one

  // The page must stay scrollable. The wheel zooms the model only once the visitor has clicked into it
  // (or holds Ctrl / ⌘, which is also how a trackpad pinch arrives); otherwise it scrolls the page.
  const [coarse, setCoarse] = useState(false)
  const armed = useRef(false)
  useEffect(() => {
    setCoarse(typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches)
    const el = box.current
    if (!el) return
    const arm = () => { armed.current = true }
    const disarm = () => { armed.current = false }
    const wheel = (e: WheelEvent) => { if (!armed.current && !e.ctrlKey && !e.metaKey) e.stopPropagation() }
    el.addEventListener('pointerdown', arm)
    el.addEventListener('pointerleave', disarm)
    el.addEventListener('wheel', wheel, { capture: true, passive: true })
    return () => {
      el.removeEventListener('pointerdown', arm)
      el.removeEventListener('pointerleave', disarm)
      el.removeEventListener('wheel', wheel, { capture: true })
    }
  }, [failed])

  const onInteract = useCallback(() => setSpin(false), [])
  const onCrash = useCallback(() => setFailed(true), [])
  const onReady = useCallback(() => setReady(true), [])

  const nominal = model.mode === 'nominal'
  const desc = caption ?? t.desc(model.counts.columns, model.counts.beams, model.counts.slabs - model.counts.balconies, model.counts.balconies, model.storeys, model.lengthM.toFixed(1), model.widthM.toFixed(1))

  if (failed) return <PlanFallback model={model} onRetry={hasWebGL() ? () => { setReady(false); setFailed(false) } : undefined} />

  return (
    <figure className="ns-r-viewer">
      <div ref={box} className="ns-r-stage" role="img" aria-label={desc}>
        <Boundary onCrash={onCrash}>
          <Scene
            model={model}
            motion={motion}
            active={active}
            replayKey={replayKey}
            autoRotate={spin}
            view={view}
            layers={layers}
            onInteract={onInteract}
            onLost={onCrash}
            onReady={onReady}
          />
        </Boundary>
        {!ready && <Loading />}
        <span className="ns-r-stage__tag">{nominal ? t.tagNominal : t.tagDesigned}</span>
        <span className="ns-r-stage__hint" aria-hidden="true">{coarse ? t.hintTouch : t.hintMouse}</span>
      </div>

      <div className="ns-r-ctl">
        <div className="ns-r-ctl__row">
          <div className="ns-i-seg" role="radiogroup" aria-label={t.viewAria}>
            {VIEWS.map(v => (
              <label key={v} className="ns-i-segopt">
                <input type="radio" name="sv-view" checked={view === v} onChange={() => setView(v)} />
                <span>{t.views[v]}</span>
              </label>
            ))}
          </div>
          {motion && (
            <div className="ns-r-ctl__btns">
              <button type="button" className="ns-btn ns-btn--paper ns-btn--sm" onClick={() => { setView('3d'); setSpin(true); setReplayKey(k => k + 1) }}>{t.replay}</button>
              <button type="button" className="ns-btn ns-btn--paper ns-btn--sm" aria-pressed={!spin} onClick={() => setSpin(s => !s)}>{spin ? t.pause : t.turn}</button>
            </div>
          )}
        </div>
        <fieldset className="ns-r-layers">
          <legend className="ns-sr">{t.layersSr}</legend>
          {LAYERS.filter(l => l.key !== 'balconies' || model.counts.balconies > 0).map(l => (
            <label key={l.key} className="ns-r-layer" title={t.layers[l.key].note}>
              <input type="checkbox" checked={layers[l.key]} onChange={e => setLayers(p => ({ ...p, [l.key]: e.target.checked }))} />
              <i style={{ background: l.color }} aria-hidden="true" />
              <span>{t.layers[l.key].label}</span>
            </label>
          ))}
        </fieldset>
      </div>
      <figcaption className="ns-i-fine">
        {nominal ? t.capNominal : t.capDesigned}
        {' '}{t.capGround}
      </figcaption>
    </figure>
  )
}
