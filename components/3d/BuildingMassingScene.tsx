'use client'

import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useLayoutEffect, useMemo, type ReactNode } from 'react'
import type { PerspectiveCamera } from 'three'
import { SQFT_TO_M2, ASPECT_RATIO, SLAB_THICKNESS_M, type FloorDatum, type FloorGeometry } from './types'

// Warm chalk slabs on the charcoal "wet concrete" stage, the same family as the structure model. Never blue.
const SLAB_COLORS = ['#EDE6D4', '#E2D9C3', '#D8CFBD', '#CDC3AC', '#C2B79F']

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

// SlabPlate renders a single 125mm structural slab — replaces the old solid floor box.
// Each floor gets one slab at the bottom of its height span; a roof slab caps the building.
export function SlabPlate({
  position,
  dims,
  color,
}: {
  position: [number, number, number]
  dims: [number, number, number]
  color: string
}) {
  const [w, , d] = dims
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={[w, SLAB_THICKNESS_M, d]} />
      <meshLambertMaterial color={color} />
    </mesh>
  )
}

interface Props {
  floors: FloorDatum[]
  renderExtras?: (geoms: FloorGeometry[]) => ReactNode
}

// Puts the camera far enough back that the whole block fits in the frame, whatever the shape of
// the frame is. On a phone the frame is taller than wide, so the width, not the height, sets the
// distance. Runs again only when the shape of the frame changes, so it never undoes a drag.
function FitCamera({ radius, centerY }: { radius: number; centerY: number }) {
  const camera = useThree(s => s.camera) as PerspectiveCamera
  const width = useThree(s => s.size.width)
  const height = useThree(s => s.size.height)

  useLayoutEffect(() => {
    const vfov = (camera.fov * Math.PI) / 180
    const aspect = width / Math.max(height, 1)
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * aspect)
    const dist = (radius * 1.18) / Math.sin(Math.min(vfov, hfov) / 2)
    // Looking down from the south-east at about 28 degrees, so the slabs read as slabs
    const dx = 0.8, dy = 0.6, dz = 0.8
    const len = Math.hypot(dx, dy, dz)
    camera.position.set((dx / len) * dist, centerY + (dy / len) * dist, (dz / len) * dist)
    camera.lookAt(0, centerY, 0)
    camera.updateProjectionMatrix()
  }, [camera, radius, centerY, width, height])

  return null
}

export default function BuildingMassingScene({ floors, renderExtras }: Props) {
  const { geoms, totalH, groundW, groundD } = useMemo(
    () => computeFloorGeometry(floors),
    [floors]
  )
  const camDist = Math.max(totalH * 2, 10)
  // Smallest sphere around the block, centred half-way up, that holds every slab
  const fitRadius = useMemo(() => {
    const halfW = Math.max(...geoms.map(g => g.w), 6) / 2
    const halfD = Math.max(...geoms.map(g => g.d), 5) / 2
    return Math.hypot(halfW, halfD, totalH / 2)
  }, [geoms, totalH])

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
      <color attach="background" args={['#403E3A']} />
      <FitCamera radius={fitRadius} centerY={totalH / 2} />
      <ambientLight intensity={1.0} />
      <directionalLight
        position={[camDist * 0.6, camDist * 1.2, camDist * 0.4]}
        intensity={0.55}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-camera-left={-camDist}
        shadow-camera-right={camDist}
        shadow-camera-top={camDist}
        shadow-camera-bottom={-camDist}
        shadow-camera-near={1}
        shadow-camera-far={camDist * 4}
      />
      <directionalLight
        position={[-camDist * 0.4, camDist * 0.3, -camDist * 0.3]}
        intensity={0.25}
        color="#ffe9c9"
      />

      {/* Floor slabs — one per floor, at the bottom of each floor's height span */}
      {geoms.map(b => (
        <SlabPlate
          key={b.i}
          position={[0, b.y - b.h / 2 + SLAB_THICKNESS_M / 2, 0]}
          dims={[b.w, SLAB_THICKNESS_M, b.d]}
          color={SLAB_COLORS[b.i % SLAB_COLORS.length]}
        />
      ))}
      {/* Roof slab — caps the building at totalH */}
      {geoms.length > 0 && (() => {
        const last = geoms[geoms.length - 1]
        const roofY = last.y + last.h / 2 + SLAB_THICKNESS_M / 2
        return (
          <SlabPlate
            key="roof"
            position={[0, roofY, 0]}
            dims={[last.w, SLAB_THICKNESS_M, last.d]}
            color={SLAB_COLORS[Math.min(geoms.length, SLAB_COLORS.length - 1)]}
          />
        )
      })()}

      {renderExtras?.(geoms)}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[groundW, groundD]} />
        <meshLambertMaterial color="#55524B" />
      </mesh>

      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={Math.max(camDist * 3, fitRadius * 5)}
        target={[0, totalH / 2, 0]}
        makeDefault
      />
    </Canvas>
  )
}
