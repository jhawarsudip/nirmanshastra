'use client'

import BuildingMassingScene from '@/components/3d/BuildingMassingScene'
import type { FloorDatum, FloorGeometry } from '@/components/3d/types'

// Stamp Oxide for masonry walls — distinguishes from StructuroPro's Blueprint column layer
const WALL_COLOR = '#8C3A22'
// 115mm (4.5") — standard exterior brick wall thickness in metres
const WALL_THICKNESS = 0.115

function ExteriorWallLayer({ geoms }: { geoms: FloorGeometry[] }) {
  return (
    <>
      {geoms.map(({ w, d, h, y, i }) => {
        const wallH = h - 0.04  // match floor box height (4cm inter-floor gap)
        const wt = WALL_THICKNESS
        return (
          <group key={`walls-${i}`}>
            {/* North wall — wraps around corners in X so no corner gaps */}
            <mesh position={[0, y, -(d / 2 + wt / 2)]} castShadow>
              <boxGeometry args={[w + wt * 2, wallH, wt]} />
              <meshLambertMaterial color={WALL_COLOR} />
            </mesh>
            {/* South wall */}
            <mesh position={[0, y, d / 2 + wt / 2]} castShadow>
              <boxGeometry args={[w + wt * 2, wallH, wt]} />
              <meshLambertMaterial color={WALL_COLOR} />
            </mesh>
            {/* East wall */}
            <mesh position={[w / 2 + wt / 2, y, 0]} castShadow>
              <boxGeometry args={[wt, wallH, d]} />
              <meshLambertMaterial color={WALL_COLOR} />
            </mesh>
            {/* West wall */}
            <mesh position={[-(w / 2 + wt / 2), y, 0]} castShadow>
              <boxGeometry args={[wt, wallH, d]} />
              <meshLambertMaterial color={WALL_COLOR} />
            </mesh>
          </group>
        )
      })}
    </>
  )
}

interface Props {
  floors: FloorDatum[]
}

export default function MasonryMassingPreview3D({ floors }: Props) {
  return (
    <BuildingMassingScene
      floors={floors}
      renderExtras={(geoms: FloorGeometry[]) => <ExteriorWallLayer geoms={geoms} />}
    />
  )
}
