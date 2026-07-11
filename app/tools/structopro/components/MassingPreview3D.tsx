'use client'

import BuildingMassingScene from '@/components/3d/BuildingMassingScene'
import type { FloorDatum, FloorGeometry } from '@/components/3d/types'

// Light structural concrete blue — contrasts against the darker Blueprint floor boxes
const COLUMN_COLOR = '#6aacce'
const COLUMN_SECTION = 0.28  // 280mm column cross-section (m) — IS 456 minimum is 230mm
const BAY_SIZE_M = 4.0       // target bay size for column grid derivation
const MAX_COLS_PER_AXIS = 4  // cap visual complexity

function ColumnGrid({ geoms }: { geoms: FloorGeometry[] }) {
  return (
    <>
      {geoms.flatMap(({ w, d, h, y, i }) => {
        // Derive column count per axis using IS 456 bay sizing (target ~4m bays)
        const nX = Math.min(MAX_COLS_PER_AXIS, Math.max(2, Math.ceil(w / BAY_SIZE_M) + 1))
        const nZ = Math.min(MAX_COLS_PER_AXIS, Math.max(2, Math.ceil(d / BAY_SIZE_M) + 1))

        const meshes = []
        for (let ci = 0; ci < nX; ci++) {
          for (let cj = 0; cj < nZ; cj++) {
            const x = nX === 1 ? 0 : -w / 2 + (w / (nX - 1)) * ci
            const z = nZ === 1 ? 0 : -d / 2 + (d / (nZ - 1)) * cj
            // Column protrudes 7cm above and below each floor box, making stubs
            // visible in the inter-floor gap and above the building crown
            meshes.push(
              <mesh key={`col-${i}-${ci}-${cj}`} position={[x, y, z]} castShadow>
                <boxGeometry args={[COLUMN_SECTION, h + 0.14, COLUMN_SECTION]} />
                <meshStandardMaterial color={COLUMN_COLOR} roughness={0.55} metalness={0.1} />
              </mesh>
            )
          }
        }
        return meshes
      })}
    </>
  )
}

interface Props {
  floors: FloorDatum[]
}

export default function MassingPreview3D({ floors }: Props) {
  return (
    <BuildingMassingScene
      floors={floors}
      renderExtras={(geoms: FloorGeometry[]) => <ColumnGrid geoms={geoms} />}
    />
  )
}
