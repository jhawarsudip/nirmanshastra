'use client'

import { useMemo } from 'react'
import BuildingMassingScene from '@/components/3d/BuildingMassingScene'
import { SLAB_THICKNESS_M, type FloorDatum, type FloorGeometry } from '@/components/3d/types'

// Compass colours on the charcoal stage: chalk ring, laterite North arrow, sand tail, brass axis
const RING_COLOUR  = '#EDE6D4'
const NORTH_COLOUR = '#E27B58'
const TAIL_COLOUR  = '#A89F8D'
const AXIS_COLOUR  = '#E6C97A'

// Fixed G+1 massing — VastuPro engine does not track floor count or BUA
// This is an approximation: two floors at 600 sqft each
const VASTU_DEFAULT_FLOORS: FloorDatum[] = [
  { areaSqft: 600, heightM: 3.048, name: 'Ground Floor' },
  { areaSqft: 600, heightM: 3.048, name: 'First Floor'  },
]

function CompassOverlay({
  geoms,
  northDeg,
}: {
  geoms: FloorGeometry[]
  northDeg: number
}) {
  // Map northDeg to Y-axis rotation:
  // northDeg = 0  → True North is canvas-up → -Z direction in 3D world → Y rotation 0
  // northDeg = 90 → True North is canvas-right → +X direction → Y rotation -π/2
  // Clockwise canvas rotation = negative Y rotation in Three.js (right-hand rule)
  const arrowRad = useMemo(
    () => -northDeg * (Math.PI / 180),
    [northDeg]
  )

  if (geoms.length === 0) return null
  const first   = geoms[0]
  const last    = geoms[geoms.length - 1]
  const baseY   = first.y - first.h / 2
  const totalH  = last.y + last.h / 2
  // The ring lies on the ground plane, just above it so the plane does not hide it. The arrow
  // lies on top of the ground-floor slab, so it can be seen from any side.
  const groundY = baseY + 0.03
  const arrowY  = baseY + SLAB_THICKNESS_M + 0.14
  const radius  = Math.max(first.w, first.d) * 0.65  // compass ring radius

  const arrowBodyLen = radius * 0.7
  const arrowBodyW   = 0.2
  const coneH        = 0.8
  const coneR        = 0.4

  return (
    <group>
      {/* Compass ring on the ground plane: a thin chalk disc */}
      <mesh position={[0, groundY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.08, radius, 48]} />
        <meshStandardMaterial color={RING_COLOUR} roughness={0.5} metalness={0.2} />
      </mesh>

      {/* Cardinal tick marks on the ring */}
      {[0, 90, 180, 270].map(deg => {
        const rad = deg * (Math.PI / 180)
        return (
          <mesh
            key={`tick-${deg}`}
            position={[Math.sin(rad) * radius, groundY + 0.01, -Math.cos(rad) * radius]}
          >
            <boxGeometry args={[0.08, 0.04, 0.25]} />
            <meshStandardMaterial color={RING_COLOUR} />
          </mesh>
        )
      })}

      {/* North arrow — rotated so it points toward True North */}
      <group position={[0, arrowY, 0]} rotation={[0, arrowRad, 0]}>
        {/* Arrow shaft pointing toward -Z (True North at northDeg=0) */}
        <mesh position={[0, 0, -(arrowBodyLen / 2)]}>
          <boxGeometry args={[arrowBodyW, arrowBodyW, arrowBodyLen]} />
          <meshStandardMaterial color={NORTH_COLOUR} roughness={0.3} metalness={0.25} emissive={NORTH_COLOUR} emissiveIntensity={0.18} />
        </mesh>
        {/* Arrowhead cone — tip at -Z end, pointing toward -Z */}
        <mesh position={[0, 0, -(arrowBodyLen + coneH / 2)]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[coneR, coneH, 6]} />
          <meshStandardMaterial color={NORTH_COLOUR} roughness={0.3} metalness={0.25} emissive={NORTH_COLOUR} emissiveIntensity={0.2} />
        </mesh>
        {/* South tail (short stub pointing +Z) */}
        <mesh position={[0, 0, arrowBodyLen * 0.2]}>
          <boxGeometry args={[arrowBodyW * 0.6, arrowBodyW * 0.6, arrowBodyLen * 0.3]} />
          <meshStandardMaterial color={TAIL_COLOUR} roughness={0.5} />
        </mesh>
      </group>

      {/* Vertical axis line from ground to crown — building axis indicator */}
      <mesh position={[0, baseY + totalH / 2, 0]}>
        <boxGeometry args={[0.04, totalH, 0.04]} />
        <meshStandardMaterial color={AXIS_COLOUR} roughness={0.6} opacity={0.4} transparent />
      </mesh>
    </group>
  )
}

interface Props {
  northDeg: number
}

export default function VastuMassingPreview3D({ northDeg }: Props) {
  return (
    <BuildingMassingScene
      floors={VASTU_DEFAULT_FLOORS}
      renderExtras={(geoms: FloorGeometry[]) => (
        <CompassOverlay geoms={geoms} northDeg={northDeg} />
      )}
    />
  )
}
