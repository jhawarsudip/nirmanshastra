'use client'

import { useRef, useState } from 'react'
import { Field, Input, Select } from '@/components/v2/inner/kit'
import type { Poly } from '../vastu-geometry'
import {
  OUTLINE_BOX,
  SHEET_UNITS,
  lShapeOutline,
  rectangleOutline,
  type PlanImage,
} from '../vastu-model'

type Shape = 'rect' | 'l' | 'own'
type LCorner = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'

interface Props {
  house: Poly
  onHouse: (p: Poly) => void
  selectedVertex: number | null
  onSelectVertex: (i: number | null) => void
  image: PlanImage | null
  onImage: (img: PlanImage | null) => void
}

/*
  Outline controls: pick a starting shape and its proportions, then drag the corners on the sheet to match the real plan.
  A picture of the plan can sit faintly behind the sheet to trace over; it never leaves the browser.
*/
export default function HouseControls({ house, onHouse, selectedVertex, onSelectVertex, image, onImage }: Props) {
  const [shape, setShape] = useState<Shape>('rect')
  const [width, setWidth] = useState('40')
  const [depth, setDepth] = useState('30')
  const [corner, setCorner] = useState<LCorner>('top-right')
  const [cut, setCut] = useState(35)
  const fileRef = useRef<HTMLInputElement>(null)

  const w = Math.max(Number(width) || 0, 1)
  const d = Math.max(Number(depth) || 0, 1)

  function apply(next: Shape, o: { w?: number; d?: number; corner?: LCorner; cut?: number } = {}) {
    const ww = o.w ?? w
    const dd = o.d ?? d
    if (next === 'rect') onHouse(rectangleOutline(ww, dd))
    else if (next === 'l') onHouse(lShapeOutline(ww, dd, o.corner ?? corner, (o.cut ?? cut) / 100))
    onSelectVertex(null)
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    // Shown from this browser only; nothing is uploaded.
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const k = OUTLINE_BOX * 1.1 / Math.max(img.width, img.height)
      onImage({
        src: url,
        w: img.width,
        h: img.height,
        scale: k,
        rot: 0,
        x: (SHEET_UNITS - img.width * k) / 2,
        y: (SHEET_UNITS - img.height * k) / 2,
      })
    }
    img.onerror = () => URL.revokeObjectURL(url)
    img.src = url
  }

  const canRemove = selectedVertex !== null && house.length > 3

  return (
    <div className="ns-plate ns-v-card ns-v-house">
      <h2>The outline of your house</h2>
      <p className="ns-v-card__sub">Start with a shape close to yours, then drag the green corners until the outline matches your plan.</p>

      <div className="ns-v-seg" role="group" aria-label="Starting shape">
        {([['rect', 'Rectangle'], ['l', 'L-shaped'], ['own', 'My own shape']] as [Shape, string][]).map(([k, label]) => (
          <button
            key={k}
            type="button"
            className="ns-v-seg__b"
            aria-pressed={shape === k}
            onClick={() => { setShape(k); if (k !== 'own') apply(k) }}
          >
            {label}
          </button>
        ))}
      </div>

      {shape !== 'own' && (
        <div className="ns-v-house__f">
          <Field id="vh-w" label="Width (ft)" hint="Left to right on your drawing.">
            <Input type="number" inputMode="decimal" min={1} value={width} onChange={e => { setWidth(e.target.value); apply(shape, { w: Math.max(Number(e.target.value) || 0, 1) }) }} />
          </Field>
          <Field id="vh-d" label="Depth (ft)" hint="Top to bottom on your drawing.">
            <Input type="number" inputMode="decimal" min={1} value={depth} onChange={e => { setDepth(e.target.value); apply(shape, { d: Math.max(Number(e.target.value) || 0, 1) }) }} />
          </Field>
          {shape === 'l' && (
            <>
              <Field id="vh-c" label="The missing corner is at the">
                <Select value={corner} onChange={e => { const c = e.target.value as LCorner; setCorner(c); apply('l', { corner: c }) }}>
                  <option value="top-right">Top right of the drawing</option>
                  <option value="top-left">Top left of the drawing</option>
                  <option value="bottom-right">Bottom right of the drawing</option>
                  <option value="bottom-left">Bottom left of the drawing</option>
                </Select>
              </Field>
              <Field id="vh-cut" label={`How much is cut away: ${cut}%`}>
                <input id="vh-cut" className="ns-v-range" type="range" min={10} max={60} step={5} value={cut} onChange={e => { const c = Number(e.target.value); setCut(c); apply('l', { cut: c }) }} />
              </Field>
            </>
          )}
        </div>
      )}

      <div className="ns-v-house__row">
        <button type="button" className="ns-v-sbtn ns-v-sbtn--danger" disabled={!canRemove} onClick={() => {
          if (selectedVertex === null || house.length <= 3) return
          onHouse(house.filter((_, i) => i !== selectedVertex))
          onSelectVertex(null)
        }}>
          Remove the selected corner
        </button>
        <small className="ns-i-fine">Tap a green corner to select it. Tap a + on an edge to add a corner.</small>
      </div>

      <div className="ns-v-house__pic">
        <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="ns-v-file" tabIndex={-1} aria-label="Add a picture of your plan" />
        <div className="ns-v-house__row">
          <button type="button" className="ns-v-sbtn ns-v-sbtn--tc" onClick={() => fileRef.current?.click()}>
            {image ? 'Change the picture of my plan' : 'Add a picture of my plan to trace'}
          </button>
          {image && <button type="button" className="ns-v-sbtn ns-v-sbtn--danger" onClick={() => { URL.revokeObjectURL(image.src); onImage(null) }}>Remove</button>}
          <small className="ns-i-fine">Optional. It stays in your browser.</small>
        </div>
        {image && (
          <details className="ns-v-pic" open>
            <summary>Fit the picture to the sheet</summary>
            <div className="ns-v-pic__g">
              <label>Size
                <input className="ns-v-range" type="range" min={0.2} max={3} step={0.01} value={image.scale / (OUTLINE_BOX * 1.1 / Math.max(image.w, image.h))}
                  onChange={e => {
                    const base = OUTLINE_BOX * 1.1 / Math.max(image.w, image.h)
                    const nk = base * Number(e.target.value)
                    // keep the middle of the picture where it is while it grows
                    const cx = image.x + (image.w * image.scale) / 2
                    const cy = image.y + (image.h * image.scale) / 2
                    onImage({ ...image, scale: nk, x: cx - (image.w * nk) / 2, y: cy - (image.h * nk) / 2 })
                  }} />
              </label>
              <label>Turn
                <input className="ns-v-range" type="range" min={-180} max={180} step={0.5} value={image.rot} onChange={e => onImage({ ...image, rot: Number(e.target.value) })} />
              </label>
              <label>Left or right
                <input className="ns-v-range" type="range" min={-300} max={SHEET_UNITS} step={1} value={image.x} onChange={e => onImage({ ...image, x: Number(e.target.value) })} />
              </label>
              <label>Up or down
                <input className="ns-v-range" type="range" min={-300} max={SHEET_UNITS} step={1} value={image.y} onChange={e => onImage({ ...image, y: Number(e.target.value) })} />
              </label>
            </div>
          </details>
        )}
      </div>
    </div>
  )
}
