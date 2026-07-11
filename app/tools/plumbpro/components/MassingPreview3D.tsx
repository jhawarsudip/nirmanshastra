'use client'

import BuildingMassingScene from '@/components/3d/BuildingMassingScene'
import type { FloorDatum, FloorGeometry } from '@/components/3d/types'

// Teal — represents CPVC/SWR plumbing lines
const CPVC_COLOR  = '#0D9488'  // CPVC supply riser (teal)
const SWR_COLOR   = '#0F766E'  // SWR soil stack (darker teal)
const CPVC_RADIUS = 0.032      // 32mm CPVC riser (IS 1742 supply main)
const SWR_RADIUS  = 0.110      // 110mm SWR soil stack (IS 1742:1983)

function PlumbingRiserLayer({
  geoms,
  numBathrooms,
}: {
  geoms: FloorGeometry[]
  numBathrooms: number
}) {
  if (geoms.length === 0) return null
  const first = geoms[0]
  const last  = geoms[geoms.length - 1]
  const totalH = last.y + last.h / 2          // total building height
  const baseY  = first.y - first.h / 2        // ground level

  // Place risers offset from center on the south-east side of the floor plan
  // IS 1742:1983: supply riser typically near water inlet side (east/back wall)
  const riserX = first.w / 4
  const riserZ = first.d / 4

  // SWR stack is typically in wet area cluster (bathrooms on one side)
  const stackX = -(first.w / 4)
  const stackZ = first.d / 4

  // Additional wet stacks for multi-bathroom buildings (one stack per 2 bathrooms)
  const extraStackCount = Math.max(0, Math.floor((numBathrooms - 1) / 2))

  return (
    <>
      {/* CPVC 32mm supply riser — cold water main (IS 1172:1993 + IS 1742:1983) */}
      <mesh
        position={[riserX, baseY + totalH / 2, riserZ]}
        castShadow
      >
        <boxGeometry args={[CPVC_RADIUS, totalH, CPVC_RADIUS]} />
        <meshStandardMaterial color={CPVC_COLOR} roughness={0.4} metalness={0.1} />
      </mesh>

      {/* SWR 110mm soil stack — WC waste (IS 1742:1983 Cl 10) */}
      <mesh
        position={[stackX, baseY + totalH / 2, stackZ]}
        castShadow
      >
        <boxGeometry args={[SWR_RADIUS, totalH, SWR_RADIUS]} />
        <meshStandardMaterial color={SWR_COLOR} roughness={0.45} metalness={0.05} />
      </mesh>

      {/* Extra SWR stacks for additional bathroom clusters */}
      {Array.from({ length: extraStackCount }, (_, k) => (
        <mesh
          key={`extra-stack-${k}`}
          position={[stackX - (k + 1) * 0.5, baseY + totalH / 2, stackZ]}
          castShadow
        >
          <boxGeometry args={[SWR_RADIUS, totalH, SWR_RADIUS]} />
          <meshStandardMaterial color={SWR_COLOR} roughness={0.45} metalness={0.05} />
        </mesh>
      ))}

      {/* Horizontal branch connections per floor (75mm SWR waste, IS 1742:1983) */}
      {geoms.map(({ y, i }) => (
        <mesh
          key={`branch-${i}`}
          position={[(riserX + stackX) / 2, y - 0.5, (riserZ + stackZ) / 2]}
          rotation={[0, Math.PI / 4, 0]}
        >
          <boxGeometry args={[0.075, 0.075, Math.abs(riserX - stackX) * 1.5]} />
          <meshStandardMaterial color={SWR_COLOR} roughness={0.5} opacity={0.7} transparent />
        </mesh>
      ))}
    </>
  )
}

interface Props {
  floors: FloorDatum[]
  numBathrooms: number
}

export default function PlumbMassingPreview3D({ floors, numBathrooms }: Props) {
  return (
    <BuildingMassingScene
      floors={floors}
      renderExtras={(geoms: FloorGeometry[]) => (
        <PlumbingRiserLayer geoms={geoms} numBathrooms={numBathrooms} />
      )}
    />
  )
}
