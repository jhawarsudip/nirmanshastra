'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useMemo, type ReactNode } from 'react'
import { SQFT_TO_M2, ASPECT_RATIO, type FloorDatum, type FloorGeometry } from './types'

const FLOOR_COLORS = ['#1F4E79', '#1b4470', '#173a62', '#133055', '#102748']

export function computeFloorGeometry(floors: FloorDatum[]): {
  geoms: FloorGeometry[]
  totalH: number
  groundW: number
  groundD: number
} {
  let yOffset = 0
  const geoms = floors.map((floor, i) => {
    const a = Math.max(floor.areaSqft, 50) * SQFT_TO_M2
    const w = Math.sqrt(a * ASPECT_RATIO)
    const d = Math.sqrt(a / ASPECT_RATIO)
    const h = floor.heightM
    const y = yOffset + h / 2
    yOffset += h
    return { w, d, h, y, i }
  })
  const first = geoms[0] ?? { w: 6, d: 5 }
  return { geoms, totalH: yOffset, groundW: first.w * 3.5, groundD: first.d * 3.5 }
}

export function FloorBox({
  position,
  dims,
  color,
}: {
  position: [number, number, number]
  dims: [number, number, number]
  color: string
}) {
  const [w, h, d] = dims
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={[w, h - 0.04, d]} />
      <meshLambertMaterial color={color} />
    </mesh>
  )
}

interface Props {
  floors: FloorDatum[]
  renderExtras?: (geoms: FloorGeometry[]) => ReactNode
}

export default function BuildingMassingScene({ floors, renderExtras }: Props) {
  const { geoms, totalH, groundW, groundD } = useMemo(
    () => computeFloorGeometry(floors),
    [floors]
  )
  const camDist = Math.max(totalH * 2, 10)

  return (
    <Canvas
      shadows
      camera={{
        position: [camDist * 0.85, totalH * 0.65, camDist * 0.85],
        fov: 42,
        near: 0.1,
        far: 500,
      }}
      style={{ width: '100%', height: '100%' }}
    >
      <color attach="background" args={['#0c1117']} />
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[camDist * 0.6, camDist * 1.2, camDist * 0.4]}
        intensity={1.1}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight
        position={[-camDist * 0.4, camDist * 0.3, -camDist * 0.3]}
        intensity={0.25}
        color="#aac8e8"
      />

      {geoms.map(b => (
        <FloorBox
          key={b.i}
          position={[0, b.y, 0]}
          dims={[b.w, b.h, b.d]}
          color={FLOOR_COLORS[b.i % FLOOR_COLORS.length]}
        />
      ))}

      {renderExtras?.(geoms)}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[groundW, groundD]} />
        <meshLambertMaterial color="#141a22" />
      </mesh>

      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={camDist * 3}
        target={[0, totalH / 2, 0]}
        makeDefault
      />
    </Canvas>
  )
}
