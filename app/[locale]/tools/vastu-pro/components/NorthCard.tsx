'use client'

import { useEffect, useState } from 'react'
import CompassWheel from './CompassWheel'
import { Field, Input, Select } from '@/components/v2/inner/kit'
import { useCopy } from '@/lib/i18n/use-copy'
import { DIRECTION_HI } from '@/lib/i18n/labels/vastu-terms'
import { COPY } from '../copy'
import { useLocale } from 'next-intl'

interface Props {
  northDeg: number
  onChange: (deg: number) => void
}

// Which way the TOP of the drawing faces, as a compass bearing. North lies the other way round that bearing:
// if the top of the drawing faces East (90), North is 90 degrees anticlockwise from the top, which is 270 clockwise.
const FACING: { label: string; bearing: number; hi: string }[] = [
  { label: 'North', bearing: 0, hi: DIRECTION_HI['north'] },
  { label: 'North-east', bearing: 45, hi: DIRECTION_HI['north-east'] },
  { label: 'East', bearing: 90, hi: DIRECTION_HI['east'] },
  { label: 'South-east', bearing: 135, hi: DIRECTION_HI['south-east'] },
  { label: 'South', bearing: 180, hi: DIRECTION_HI['south'] },
  { label: 'South-west', bearing: 225, hi: DIRECTION_HI['south-west'] },
  { label: 'West', bearing: 270, hi: DIRECTION_HI['west'] },
  { label: 'North-west', bearing: 315, hi: DIRECTION_HI['north-west'] },
]

const norm = (n: number) => ((Math.round(n) % 360) + 360) % 360

export default function NorthCard({ northDeg, onChange }: Props) {
  const t = useCopy(COPY).north
  const hi = useLocale() === 'hi'
  const [text, setText] = useState(String(norm(northDeg)))
  useEffect(() => { setText(String(norm(northDeg))) }, [northDeg])

  const current = FACING.find(f => norm(360 - f.bearing) === norm(northDeg))

  return (
    <div className="ns-plate ns-v-card ns-v-compass">
      <h2>{t.title}</h2>
      <p className="ns-v-card__sub">{t.sub}</p>

      <div className="ns-v-dial">
        <CompassWheel northDeg={northDeg} onChange={d => onChange(norm(d))} />
      </div>
      <p className="ns-v-dial__cap">{t.cap}</p>

      <div className="ns-v-compass__fields">
      <Field id="vn-facing" label={t.facing}>
        <Select
          value={current ? String(current.bearing) : 'custom'}
          onChange={e => {
            if (e.target.value === 'custom') return
            onChange(norm(360 - Number(e.target.value)))
          }}
        >
          {FACING.map(f => <option key={f.bearing} value={f.bearing}>{hi ? f.hi : f.label}</option>)}
          {!current && <option value="custom">{t.another}</option>}
        </Select>
      </Field>

      <Field id="vn-deg" label={t.degLabel} hint={t.degHint}>
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
        {t.fine}
      </p>
      </div>
    </div>
  )
}
