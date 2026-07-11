'use client'

import BuildingMassingScene from '@/components/3d/BuildingMassingScene'
import { SLAB_THICKNESS_M, type FloorDatum, type FloorGeometry } from '@/components/3d/types'

// Stamp Oxide for masonry walls — distinguishes from StructuroPro's Blueprint column layer
const WALL_COLOR = '#8C3A22'
// 115mm (4.5") — standard exterior brick wall thickness in metres
const WALL_THICKNESS = 0.115

function ExteriorWallLayer({ geoms }: { geoms: FloorGeometry[] }) {
  return (
    <>
      {geoms.map(({ w, d, h, y, i }) => {
        // Walls span from slab top to underside of next slab — clear height between plates
        const wallH = h - SLAB_THICKNESS_M
        // Wall center is shifted up by half the slab thickness from the old floor-box center
        const wallY = y + SLAB_THICKNESS_M / 2
        const wt = WALL_THICKNESS
        return (
          <group key={`walls-${i}`}>
            {/* North wall — wraps around corners in X so no corner gaps */}
            <mesh position={[0, wallY, -(d / 2 + wt / 2)]} castShadow>
              <boxGeometry args={[w + wt * 2, wallH, wt]} />
              <meshLambertMaterial color={WALL_COLOR} />
            </mesh>
            {/* South wall */}
            <mesh position={[0, wallY, d / 2 + wt / 2]} castShadow>
              <boxGeometry args={[w + wt * 2, wallH, wt]} />
              <meshLambertMaterial color={WALL_COLOR} />
            </mesh>
            {/* East wall */}
            <mesh position={[w / 2 + wt / 2, wallY, 0]} castShadow>
              <boxGeometry args={[wt, wallH, d]} />
              <meshLambertMaterial color={WALL_COLOR} />
            </mesh>
            {/* West wall */}
            <mesh position={[-(w / 2 + wt / 2), wallY, 0]} castShadow>
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
