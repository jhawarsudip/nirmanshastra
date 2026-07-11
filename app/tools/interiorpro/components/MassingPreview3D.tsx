'use client'

import BuildingMassingScene from '@/components/3d/BuildingMassingScene'
import type { FloorDatum, FloorGeometry } from '@/components/3d/types'
import type { InteriorGrade } from '../interiorpro-engine'

// Finish grade colours — warm tan spectrum representing flooring finish level
const GRADE_COLOR: Record<InteriorGrade, string> = {
  basic:    '#C4A882',  // light warm tan  — basic ceramic
  standard: '#B07952',  // mid tan          — standard vitrified
  premium:  '#8B5E3C',  // rich brown       — premium marble/granite
  luxury:   '#C9A84C',  // Vastu Gold tone  — luxury stone/wood
}

const PLANE_THICKNESS = 0.06  // 60mm thick finish plane (tile + screed + adhesive layer)

function FinishGradeLayer({
  geoms,
  grade,
}: {
  geoms: FloorGeometry[]
  grade: InteriorGrade
}) {
  const color = GRADE_COLOR[grade]
  return (
    <>
      {geoms.map(({ w, d, h, y, i }) => {
        const top = y + h / 2  // top face of each floor box
        return (
          <group key={`finish-${i}`}>
            {/* Thin finish plane sitting on top of each floor slab */}
            <mesh position={[0, top + PLANE_THICKNESS / 2, 0]} receiveShadow>
              <boxGeometry args={[w - 0.04, PLANE_THICKNESS, d - 0.04]} />
              <meshStandardMaterial
                color={color}
                roughness={0.35}
                metalness={grade === 'luxury' ? 0.12 : 0.02}
              />
            </mesh>
          </group>
        )
      })}
    </>
  )
}

interface Props {
  floors: FloorDatum[]
  grade: InteriorGrade
}

export default function InteriorMassingPreview3D({ floors, grade }: Props) {
  return (
    <BuildingMassingScene
      floors={floors}
      renderExtras={(geoms: FloorGeometry[]) => (
        <FinishGradeLayer geoms={geoms} grade={grade} />
      )}
    />
  )
}
