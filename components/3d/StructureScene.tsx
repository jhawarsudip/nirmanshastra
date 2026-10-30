'use client'

// The 3D model of the structure. It builds itself up on arrival (footings, the plinth beams and the ground floor, then each storey's columns, beams and slab, then the stair and the head-room),
// then turns slowly. Nothing to click. With reduced motion, it shows the finished model at once and does not move by itself.
//
// Model coordinates are x along the length, y along the width, z up. Three.js is y-up, so a model point (x, y, z) is drawn at (x - L/2, z, y - W/2).

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useEffect, useLayoutEffect, useMemo, useRef, type MutableRefObject, type ReactNode } from 'react'
import type { SceneBox, SceneModel } from '@/lib/structopro-qty/scene'
import { COLOR, type LayerKey, type ViewKey } from './structure-colors'

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const ease = (v: number) => 1 - Math.pow(1 - clamp01(v), 3)

type Kind = 'grow' | 'slide' | 'plate'

interface Timing { a: number; b: number }

/** When each part of the build-up starts and ends, in seconds. */
function timeline(model: SceneModel) {
  const F = Math.max(1, model.storeys)
  const step = Math.min(0.9, 4.2 / F)
  const base = 1.4
  const storey = (k: number) => {
    const s = base + k * step
    return { columns: { a: s, b: s + 0.6 }, beams: { a: s + 0.4, b: s + 0.95 }, slabs: { a: s + 0.8, b: s + 1.3 } }
  }
  const end = base + (F - 1) * step + 1.3
  return {
    foundation: { a: 0, b: 1.0 } as Timing,
    plinth: { a: 0.8, b: 1.5 } as Timing,
    storey,
    stair: { a: end, b: end + 0.7 } as Timing,
    mumty: { a: end + 0.5, b: end + 1.1 } as Timing,
    total: end + 1.2,
  }
}

/** Boxes of one kind drawn as a single instanced mesh. They appear in time with `t`. */
function Boxes({ boxes, color, kind, window: w, t, model, opacity = 1, visible = true }: {
  boxes: SceneBox[]
  color: string
  kind: Kind
  window: Timing
  t: MutableRefObject<number>
  model: SceneModel
  opacity?: number
  visible?: boolean
}) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const last = useRef(-1)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const L = model.lengthM
  const W = model.widthM

  const apply = (p: number) => {
    const mesh = ref.current
    if (!mesh) return
    for (let i = 0; i < boxes.length; i++) {
      const b = boxes[i]
      const e = Math.max(p, 0.0001)
      let x = b.cx - L / 2
      let y = b.cz
      let z = b.cy - W / 2
      let sx = b.sx
      let sy = b.sz
      let sz = b.sy
      if (kind === 'grow') {
        sy = b.sz * e
        y = b.cz - b.sz / 2 + sy / 2
      } else if (kind === 'slide') {
        if (b.sx >= b.sy) {
          sx = b.sx * e
          x = b.cx - b.sx / 2 + sx / 2 - L / 2
        } else {
          sz = b.sy * e
          z = b.cy - b.sy / 2 + sz / 2 - W / 2
        }
      } else {
        sx = b.sx * e
        sz = b.sy * e
      }
      dummy.position.set(x, y, z)
      dummy.scale.set(sx, sy, sz)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  }

  const progress = () => ease((t.current - w.a) / (w.b - w.a))

  useLayoutEffect(() => {
    const p = progress()
    last.current = p
    apply(p)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boxes, kind, L, W])

  useFrame(() => {
    const p = progress()
    if (p !== last.current) {
      last.current = p
      apply(p)
    }
  })

  if (boxes.length === 0) return null
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, boxes.length]} frustumCulled={false} visible={visible}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} roughness={0.92} metalness={0} transparent={opacity < 1} opacity={opacity} depthWrite={opacity >= 1} />
    </instancedMesh>
  )
}

/** The dog-legged stair: two flights and a mid-landing in every storey, ending at the head-room. */
function Stair({ model, t, window: w, visible }: { model: SceneModel; t: MutableRefObject<number>; window: Timing; visible: boolean }) {
  const g = useRef<THREE.Group>(null)
  const { stair } = model
  const L = model.lengthM
  const W = model.widthM
  const hs = stair.floorHeight
  const flightW = Math.max(0.6, stair.widthM / 2 - 0.05)
  const landing = Math.min(1.2, stair.lengthM * 0.3)
  const run = Math.max(1.2, stair.lengthM - landing)
  const n = Math.max(6, Math.round(hs / 2 / 0.15))
  const rise = hs / 2 / n
  const going = run / n
  const waist = 0.15

  const geo = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(0, -waist)
    s.lineTo(run, hs / 2 - waist)
    s.lineTo(run, hs / 2)
    for (let i = n - 1; i >= 0; i--) {
      s.lineTo(i * going, (i + 1) * rise)
      s.lineTo(i * going, i * rise)
    }
    s.closePath()
    return new THREE.ExtrudeGeometry(s, { depth: flightW, bevelEnabled: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, hs, n, flightW])

  useEffect(() => () => geo.dispose(), [geo])

  const last = useRef(-1)
  useFrame(() => {
    const p = ease((t.current - w.a) / (w.b - w.a))
    if (p !== last.current && g.current) {
      last.current = p
      g.current.scale.y = Math.max(p, 0.0001)
    }
  })
  useLayoutEffect(() => {
    if (g.current) g.current.scale.y = Math.max(ease((t.current - w.a) / (w.b - w.a)), 0.0001)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const floors = Math.max(1, stair.floors)
  const x0 = stair.x0 - L / 2
  const y0 = stair.y0 - W / 2
  const items: ReactNode[] = []
  for (let k = 0; k < floors; k++) {
    const z = k * hs
    items.push(
      <mesh key={`f1-${k}`} geometry={geo} position={[x0, z, y0]}>
        <meshStandardMaterial color={COLOR.stair} roughness={0.9} />
      </mesh>,
      <mesh key={`f2-${k}`} geometry={geo} position={[x0 + run, z + hs / 2, y0 + stair.widthM]} rotation={[0, Math.PI, 0]}>
        <meshStandardMaterial color={COLOR.stair} roughness={0.9} />
      </mesh>,
      <mesh key={`l-${k}`} position={[x0 + run + landing / 2, z + hs / 2 - 0.075, y0 + stair.widthM / 2]}>
        <boxGeometry args={[landing, 0.15, stair.widthM]} />
        <meshStandardMaterial color={COLOR.stair} roughness={0.9} />
      </mesh>,
    )
  }
  return (
    <group ref={g} position={[0, stair.baseZ, 0]} visible={visible}>
      {items}
    </group>
  )
}

/** The head-room over the stair on the roof. */
function Mumty({ model, t, window: w, visible }: { model: SceneModel; t: MutableRefObject<number>; window: Timing; visible: boolean }) {
  const g = useRef<THREE.Group>(null)
  const last = useRef(-1)
  const m = model.mumty
  useFrame(() => {
    const p = ease((t.current - w.a) / (w.b - w.a))
    if (p !== last.current && g.current) {
      last.current = p
      g.current.scale.y = Math.max(p, 0.0001)
    }
  })
  useLayoutEffect(() => {
    if (g.current) g.current.scale.y = Math.max(ease((t.current - w.a) / (w.b - w.a)), 0.0001)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  if (!m) return null
  const L = model.lengthM
  const W = model.widthM
  const w0 = m.x1 - m.x0
  const d0 = m.y1 - m.y0
  const th = 0.115
  const cx = (m.x0 + m.x1) / 2 - L / 2
  const cz = (m.y0 + m.y1) / 2 - W / 2
  const h = m.height
  const mat = <meshStandardMaterial color={COLOR.mumty} roughness={0.95} />
  return (
    <group ref={g} position={[0, m.zBase, 0]} visible={visible}>
      <mesh position={[cx, h / 2, m.y0 - W / 2 + th / 2]}><boxGeometry args={[w0, h, th]} />{mat}</mesh>
      <mesh position={[cx, h / 2, m.y1 - W / 2 - th / 2]}><boxGeometry args={[w0, h, th]} />{mat}</mesh>
      <mesh position={[m.x0 - L / 2 + th / 2, h / 2, cz]}><boxGeometry args={[th, h, d0 - 2 * th]} />{mat}</mesh>
      <mesh position={[m.x1 - L / 2 - th / 2, h / 2, cz]}><boxGeometry args={[th, h, d0 - 2 * th]} />{mat}</mesh>
      <mesh position={[cx, h + 0.05, cz]}><boxGeometry args={[w0 + 0.1, 0.1, d0 + 0.1]} />{mat}</mesh>
    </group>
  )
}

/** Moves the camera to the chosen view, and fits it to the screen. */
function Rig({ model, view, motion, replayKey }: { model: SceneModel; view: ViewKey; motion: boolean; replayKey: number }) {
  const { camera, size, controls, invalidate } = useThree()
  const anim = useRef<{ from: THREE.Vector3; to: THREE.Vector3; t: number } | null>(null)
  const first = useRef(true)

  const H = model.totalHeightM
  const target = useMemo(() => new THREE.Vector3(0, H / 2 - model.depthM * 0.15, 0), [H, model.depthM])
  const R = useMemo(() => Math.sqrt(model.lengthM ** 2 + model.widthM ** 2 + (H + model.depthM) ** 2) / 2, [model, H])

  const aspectKey = Math.max(2, Math.round((size.width / Math.max(1, size.height)) * 4))
  const aspect = aspectKey / 4
  const fov = (camera as THREE.PerspectiveCamera).fov ?? 36
  const half = THREE.MathUtils.degToRad(fov / 2)
  const halfH = Math.atan(Math.tan(half) * aspect)
  const dist = (R / Math.sin(Math.min(half, halfH))) * 1.02

  const dest = useMemo(() => {
    if (view === 'plan') return new THREE.Vector3(0, target.y + dist * 0.92, 0.002)
    if (view === 'front') return new THREE.Vector3(0, target.y + H * 0.05, dist * 0.98)
    const dir = new THREE.Vector3(0.78, 0.5, 0.95).normalize()
    return target.clone().addScaledVector(dir, dist)
  }, [view, target, dist, H])


  useEffect(() => {
    const c = controls as unknown as { target: THREE.Vector3; update: () => void } | null
    if (first.current || !motion) {
      first.current = false
      camera.position.copy(dest)
      if (c) { c.target.copy(target); c.update() } else camera.lookAt(target)
      invalidate()
      return
    }
    anim.current = { from: camera.position.clone(), to: dest.clone(), t: 0 }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dest, replayKey, controls])

  useFrame((_, dt) => {
    const a = anim.current
    if (!a) return
    a.t = Math.min(1, a.t + dt / 0.9)
    camera.position.lerpVectors(a.from, a.to, ease(a.t))
    const c = controls as unknown as { target: THREE.Vector3; update: () => void } | null
    if (c) { c.target.copy(target); c.update() } else camera.lookAt(target)
    if (a.t >= 1) anim.current = null
  })
  return null
}

/** OrbitControls claims every touch (touch-action: none), which would trap a phone visitor's scroll inside the model.
 *  Hand vertical swipes back to the page; sideways drags still turn the model and a pinch still zooms. */
function TouchGuard() {
  const controls = useThree(s => s.controls) as unknown as { domElement?: HTMLElement } | null
  useEffect(() => {
    const el = controls?.domElement
    if (el) el.style.touchAction = 'pan-y'
  }, [controls])
  return null
}

/** Advances the build-up clock. */
function Clock({ t, total, motion, onDone }: { t: MutableRefObject<number>; total: number; motion: boolean; onDone?: () => void }) {
  const done = useRef(false)
  const invalidate = useThree(st => st.invalidate)
  useEffect(() => { invalidate() }, [motion, invalidate])
  useFrame((_, dt) => {
    if (!motion) return
    if (t.current < total) t.current += Math.min(dt, 0.05)
    if (t.current >= total && !done.current) {
      done.current = true
      onDone?.()
    }
    if (t.current < total) done.current = false
  })
  return null
}

export default function StructureScene({ model, motion, active, replayKey, autoRotate, view, layers, onInteract, onLost, onReady }: {
  model: SceneModel
  motion: boolean
  active: boolean
  replayKey: number
  autoRotate: boolean
  view: ViewKey
  layers: Record<LayerKey, boolean>
  onInteract?: () => void
  onLost?: () => void
  /** called once the first frame has been drawn, so the viewer can drop its loading note */
  onReady?: () => void
}) {
  const tl = useMemo(() => timeline(model), [model])
  const t = useRef(motion ? 0 : 1e6)

  // restart the build-up when asked to
  useEffect(() => {
    t.current = motion ? 0 : 1e6
  }, [replayKey, motion])

  const L = model.lengthM
  const W = model.widthM
  const H = model.totalHeightM
  const R = Math.sqrt(L * L + W * W + H * H) / 2

  const plinthBoxes = useMemo(() => model.beams.filter(b => b.floor < 0), [model.beams])
  const byFloor = <T extends SceneBox & { floor: number }>(arr: T[], k: number) => arr.filter(b => b.floor === k)
  const colsBy = (k: number) => model.columns.filter(c => c.storey === k)

  const storeys = Array.from({ length: Math.max(1, model.storeys) }, (_, k) => k)
  const gridSize = Math.max(L, W) * 3
  const initial = useMemo(() => {
    const dir = new THREE.Vector3(0.78, 0.5, 0.95).normalize()
    return dir.multiplyScalar(R * 3.2).add(new THREE.Vector3(0, H / 2, 0)).toArray() as [number, number, number]
  }, [R, H])

  return (
    <Canvas
      frameloop={!active ? 'never' : motion ? 'always' : 'demand'}
      dpr={[1, 1.75]}
      camera={{ position: initial, fov: 36, near: 0.1, far: 800 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0)
        gl.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); onLost?.() })
        // two animation frames: the first draws the scene, the second is when it is on screen
        requestAnimationFrame(() => requestAnimationFrame(() => onReady?.()))
      }}
      aria-hidden="true"
    >
      <hemisphereLight args={['#ffffff', '#6b655b', 1.05]} />
      <directionalLight position={[L * 1.2, H * 2 + 6, W * 1.4]} intensity={1.7} />
      <directionalLight position={[-L, H, -W * 1.2]} intensity={0.45} />

      {/* ground: see-through so the footings below it show */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]}>
        <circleGeometry args={[gridSize * 0.62, 64]} />
        <meshBasicMaterial color={COLOR.ground} transparent opacity={0.28} depthWrite={false} />
      </mesh>
      <gridHelper args={[gridSize, Math.max(8, Math.round(gridSize / 2)), COLOR.grid, COLOR.grid]} position={[0, 0.002, 0]} material-transparent material-opacity={0.22} material-depthWrite={false} />

      <group>
        {model.raft ? <Boxes boxes={[model.raft]} color={COLOR.foundation} kind="plate" window={tl.foundation} t={t} model={model} visible={layers.foundation} /> : null}
        <Boxes boxes={model.footings} color={COLOR.foundation} kind="grow" window={tl.foundation} t={t} model={model} visible={layers.foundation} />
        <Boxes boxes={plinthBoxes} color={COLOR.plinth} kind="slide" window={tl.plinth} t={t} model={model} visible={layers.foundation} />
        {/* the ground floor: laid on filled earth, not a structural slab, so it is drawn grey and is in no count */}
        <Boxes boxes={[model.groundFloor]} color={COLOR.groundFloor} kind="plate" window={tl.plinth} t={t} model={model} opacity={0.6} visible={layers.ground} />
        {storeys.map(k => {
          const w = tl.storey(k)
          return (
            <group key={k}>
              <Boxes boxes={colsBy(k)} color={COLOR.columns} kind="grow" window={w.columns} t={t} model={model} visible={layers.columns} />
              <Boxes boxes={byFloor(model.beams, k)} color={COLOR.beams} kind="slide" window={w.beams} t={t} model={model} visible={layers.beams} />
              <Boxes boxes={byFloor(model.slabs, k).filter(b => !b.balcony)} color={COLOR.slabs} kind="plate" window={w.slabs} t={t} model={model} opacity={0.62} visible={layers.slabs} />
              <Boxes boxes={byFloor(model.slabs, k).filter(b => b.balcony)} color={COLOR.balcony} kind="plate" window={w.slabs} t={t} model={model} opacity={0.9} visible={layers.balconies} />
            </group>
          )
        })}
        <Stair model={model} t={t} window={tl.stair} visible={layers.stair} />
        <Mumty model={model} t={t} window={tl.mumty} visible={layers.stair} />
      </group>

      <Clock t={t} total={tl.total} motion={motion} />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={R * 1.1}
        maxDistance={R * 7}
        maxPolarAngle={Math.PI / 2 - 0.02}
        autoRotate={motion && autoRotate && view === '3d'}
        autoRotateSpeed={0.8}
        onStart={onInteract}
      />
      <TouchGuard />
      <Rig model={model} view={view} motion={motion} replayKey={replayKey} />
    </Canvas>
  )
}
