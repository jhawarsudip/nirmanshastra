'use client'

import { useEffect, useState } from 'react'
import CompassWheel from './CompassWheel'
import { Field, Input, Select } from '@/components/v2/inner/kit'

interface Props {
  northDeg: number
  onChange: (deg: number) => void
}

// Which way the TOP of the drawing faces, as a compass bearing. North lies the other way round that bearing:
// if the top of the drawing faces East (90), North is 90 degrees anticlockwise from the top, which is 270 clockwise.
const FACING: { label: string; bearing: number }[] = [
  { label: 'North', bearing: 0 },
  { label: 'North-east', bearing: 45 },
  { label: 'East', bearing: 90 },
  { label: 'South-east', bearing: 135 },
  { label: 'South', bearing: 180 },
  { label: 'South-west', bearing: 225 },
  { label: 'West', bearing: 270 },
  { label: 'North-west', bearing: 315 },
]

const norm = (n: number) => ((Math.round(n) % 360) + 360) % 360

export default function NorthCard({ northDeg, onChange }: Props) {
  const [text, setText] = useState(String(norm(northDeg)))
  useEffect(() => { setText(String(norm(northDeg))) }, [northDeg])

  const current = FACING.find(f => norm(360 - f.bearing) === norm(northDeg))

  return (
    <div className="ns-plate ns-v-card ns-v-compass">
      <h2>Where is North?</h2>
      <p className="ns-v-card__sub">Turn the dial until the red N points the way North lies on your drawing. If the top of your drawing faces North, leave it at 0°.</p>

      <div className="ns-v-dial">
        <CompassWheel northDeg={northDeg} onChange={d => onChange(norm(d))} />
      </div>
      <p className="ns-v-dial__cap">The green arrow is the top of your drawing.</p>

      <div className="ns-v-compass__fields">
      <Field id="vn-facing" label="The top of my drawing faces">
        <Select
          value={current ? String(current.bearing) : 'custom'}
          onChange={e => {
            if (e.target.value === 'custom') return
            onChange(norm(360 - Number(e.target.value)))
          }}
        >
          {FACING.map(f => <option key={f.bearing} value={f.bearing}>{f.label}</option>)}
          {!current && <option value="custom">Another direction</option>}
        </Select>
      </Field>

      <Field id="vn-deg" label="North is at (degrees)" hint="Clockwise from the top of the drawing, 0 to 359.">
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          max={359}
          step={1}
          value={text}
          onChange={e => {
            setText(e.target.value)
            const n = Number(e.target.value)
            if (e.target.value !== '' && Number.isFinite(n)) onChange(norm(n))
          }}
        />
      </Field>

      <p className="ns-i-fine">
        Not sure? Stand in the middle of the house, face the way the top of your drawing points, and read a compass app. Pick that direction above.
      </p>
      </div>
    </div>
  )
}
