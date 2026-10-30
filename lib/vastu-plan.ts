/*
  Server only. Reads the plan the VastuPro page sends (outline, North, doors, rooms) and checks every number and name
  against the catalogue, so nothing the page says is trusted. Used by the findings-PDF route.
*/

import { CATALOGUE, DOOR_KINDS } from '@/app/[locale]/tools/vastu-pro/vastu-catalogue'
import { SHEET_UNITS, type DoorMark, type PlacedItem } from '@/app/[locale]/tools/vastu-pro/vastu-model'
import type { Poly } from '@/app/[locale]/tools/vastu-pro/vastu-geometry'

const MAX_ITEMS = 60
const MAX_CORNERS = 40

export interface VastuPlan {
  northDeg: number
  house: Poly
  items: PlacedItem[]
  doors: DoorMark[]
}

const num = (v: unknown, lo: number, hi: number): number | null => {
  const n = Number(v)
  return Number.isFinite(n) && n >= lo && n <= hi ? n : null
}

export function parseVastuPlan(body: unknown): { ok: true; plan: VastuPlan } | { ok: false; error: string } {
  const b = (body ?? {}) as Record<string, unknown>
  const bad = (error: string) => ({ ok: false as const, error })

  const northRaw = Number(b.northDeg)
  if (!Number.isFinite(northRaw)) return bad('The North angle is missing.')
  const northDeg = ((Math.round(northRaw) % 360) + 360) % 360

  // the house outline
  const rawHouse = Array.isArray(b.house) ? (b.house as Array<{ x?: unknown; y?: unknown }>) : null
  if (!rawHouse || rawHouse.length < 3) return bad('The outline of the house is missing.')
  if (rawHouse.length > MAX_CORNERS) return bad('The outline of the house has too many corners.')
  const house: Poly = []
  for (const p of rawHouse) {
    const x = num(p?.x, 0, SHEET_UNITS)
    const y = num(p?.y, 0, SHEET_UNITS)
    if (x === null || y === null) return bad('One corner of the house outline is not valid.')
    house.push({ x, y })
  }

  // rooms
  const rawItems = Array.isArray(b.items) ? (b.items as Array<Record<string, unknown>>) : []
  if (rawItems.length > MAX_ITEMS) return bad('That is more rooms than the plan can hold.')
  const items: PlacedItem[] = []
  const seen = new Set<string>()
  const perKind: Record<string, number> = {}
  for (const r of rawItems) {
    const entry = typeof r?.kind === 'string' ? CATALOGUE[r.kind] : undefined
    const id = typeof r?.id === 'string' ? r.id.slice(0, 60) : ''
    const x = num(r?.x, -SHEET_UNITS, 2 * SHEET_UNITS)
    const y = num(r?.y, -SHEET_UNITS, 2 * SHEET_UNITS)
    const w = num(r?.w, 1, SHEET_UNITS)
    const h = num(r?.h, 1, SHEET_UNITS)
    if (!entry || entry.category === 'Doors' || !id || seen.has(id) || x === null || y === null || w === null || h === null) {
      return bad('One of the rooms is not valid.')
    }
    perKind[entry.key] = (perKind[entry.key] ?? 0) + 1
    if (!entry.multi && perKind[entry.key] > 1) return bad(`${entry.label} can be placed only once.`)
    seen.add(id)
    items.push({ id, kind: entry.key, x, y, w, h })
  }

  // doors
  const rawDoors = Array.isArray(b.doors) ? (b.doors as Array<{ kind?: unknown; pt?: { x?: unknown; y?: unknown } }>) : []
  if (rawDoors.length > DOOR_KINDS.length) return bad('That is more doors than the plan can hold.')
  const doors: DoorMark[] = []
  const doorKinds = new Set<string>()
  for (const d of rawDoors) {
    const kind = DOOR_KINDS.find(k => k.key === d?.kind)?.key
    const x = num(d?.pt?.x, 0, SHEET_UNITS)
    const y = num(d?.pt?.y, 0, SHEET_UNITS)
    if (!kind || x === null || y === null || doorKinds.has(kind)) return bad('One of the doors is not valid.')
    doorKinds.add(kind)
    doors.push({ id: kind, kind, pt: { x, y } })
  }

  if (items.length + doors.length === 0) return bad('Mark at least one door or room on the plan first.')

  return { ok: true, plan: { northDeg, house, items, doors } }
}
