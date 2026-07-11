'use client'

import BuildingMassingScene from '@/components/3d/BuildingMassingScene'
import type { FloorDatum, FloorGeometry } from '@/components/3d/types'

// Marking Yellow — IS-site marking paint colour for electrical advisories
const DB_COLOR = '#D99A06'
// DB panel face dimensions: 350mm wide × 500mm tall × 60mm deep (surface-mounted approx)
const PANEL_W = 0.35
const PANEL_H = 0.50
const PANEL_D = 0.06

function DBPanelLayer({
  geoms,
  dbPanelPerFloor,
}: {
  geoms: FloorGeometry[]
  dbPanelPerFloor: boolean
}) {
  // Show panel on every floor if dbPanelPerFloor=true, otherwise only ground floor (index 0)
  // Position: on the near-east exterior wall face (positive X side) at mid-height of each floor
  // Approximation: exact panel wall position is not tracked by engine — corner placement assumed
  const floorsToMark = dbPanelPerFloor ? geoms : geoms.slice(0, 1)
  return (
    <>
      {floorsToMark.map(({ w, d, h, y, i }) => (
        <group key={`db-panel-${i}`}>
          {/* Panel face — sits flush on the east wall exterior */}
          <mesh
            position={[w / 2 + PANEL_D / 2, y, d / 4]}
            castShadow
          >
            <boxGeometry args={[PANEL_D, PANEL_H, PANEL_W]} />
            <meshStandardMaterial
              color={DB_COLOR}
              roughness={0.45}
              emissive={DB_COLOR}
              emissiveIntensity={0.12}
            />
          </mesh>
          {/* Conduit stub pointing down from panel toward floor */}
          <mesh
            position={[w / 2 + PANEL_D / 2 - 0.03, y - h / 2 + 0.25, d / 4]}
          >
            <boxGeometry args={[0.04, 0.5, 0.04]} />
            <meshStandardMaterial color={DB_COLOR} roughness={0.6} />
          </mesh>
        </group>
      ))}
    </>
  )
}

interface Props {
  floors: FloorDatum[]
  dbPanelPerFloor: boolean
}

export default function ElectroMassingPreview3D({ floors, dbPanelPerFloor }: Props) {
  return (
    <BuildingMassingScene
      floors={floors}
      renderExtras={(geoms: FloorGeometry[]) => (
        <DBPanelLayer geoms={geoms} dbPanelPerFloor={dbPanelPerFloor} />
      )}
    />
  )
}
