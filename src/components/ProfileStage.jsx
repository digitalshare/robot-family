import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'
import * as THREE from 'three'
import useMusic from '../hooks/useMusic'
import useMissionProgress from '../hooks/useMissionProgress'
import useScrapbook from '../hooks/useScrapbook'
import { getShape, IntegratedBodyDetails, NameLabel, ProfessionRig } from './RobotAvatar3D'

function webglIsAvailable() {
  try {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('webgl2') || canvas.getContext('webgl')
    if (context?.getSupportedExtensions()?.includes('WEBGL_lose_context')) {
      context.getExtension('WEBGL_lose_context')?.loseContext()
    }
    return Boolean(context)
  } catch {
    return false
  }
}

const WALK_SPEED = 2.5
const STEP_FREQ = 8
const STEP_LEG = 0.45
const STEP_ARM = 0.35
const BOB_AMOUNT = 0.04
const WHEEL_BOB = 0.02
const TURN_LERP = 8
const ARRIVE_DIST = 0.12
const ACTION_DURATION = 2.5

function easeOut(t) { return 1 - (1 - Math.min(1, Math.max(0, t))) ** 3 }

function standoff(point, out) {
  const len = Math.hypot(point.x, point.z)
  if (len > STANDOFF + 0.05) {
    const factor = (len - STANDOFF) / len
    out.set(point.x * factor, 0, point.z * factor)
  } else {
    out.set(point.x, 0, Math.min(point.z + STANDOFF, FLOOR_LIMIT))
  }
  return out
}

const PROP_WAYPOINTS = {
  housecleaning: {
    shelf: { target: [-3.0, 0, -3.8] },
    broom: { target: [-3.2, 0, -2.8] },
    bucket: { target: [-2.6, 0, -2.6] },
  },
  'vehicle-repair': {
    workbench: { target: [-2.0, 0, -3.2] },
    tire: { target: [2.2, 0, -3.0] },
    toolrack: { target: [3.2, 0, -4.0] },
  },
  'knowledge-teacher': {
    bookshelf: { target: [-2.4, 0, -3.6] },
    desk: { target: [1.8, 0, -3.2] },
    chalkboard: { target: [0, 0, -3.8] },
  },
  constructor: {
    workbench: { target: [-2.0, 0, -3.2] },
    blueprints: { target: [2.0, 0, -3.0] },
    hardhat: { target: [2.6, 0, -2.8] },
  },
  'soccer-coach': {
    goal: { target: [-2.4, 0, -3.5] },
    soccerball: { target: [1.8, 0, -2.8] },
  },
  'art-assistant': {
    easel: { target: [-2.2, 0, -3.4] },
    paintcans: { target: [2.0, 0, -3.0] },
  },
  delivery: {
    packages: { target: [-2.2, 0, -3.2] },
    scooter: { target: [2.0, 0, -2.8] },
  },
}

const PROP_ACTIONS = {
  housecleaning: {
    shelf: (t, p) => {
      const r = t < 1.2 ? easeOut(t / 1.2) : easeOut(1 - (t - 1.2) / 1.3)
      p.leftArm.rotation.x = -1.2 * r
      p.rightArm.rotation.x = -1.2 * r
      p.head.rotation.x = -0.15 * r
    },
    broom: (t, p) => {
      const sweep = Math.sin(t * 5) * 0.3
      p.body.rotation.y = sweep
      p.leftArm.rotation.x = -0.5
      p.rightArm.rotation.x = -0.5
    },
    bucket: (t, p) => {
      const bend = t < 1.2 ? easeOut(t / 1.2) : easeOut(1 - (t - 1.2) / 1.3)
      p.body.rotation.x = 0.4 * bend
      p.leftArm.rotation.x = -0.8 * bend
      p.rightArm.rotation.x = -0.8 * bend
    },
  },
  'vehicle-repair': {
    workbench: (t, p) => {
      p.body.rotation.x = 0.35
      p.rightArm.rotation.x = -0.4 + Math.sin(t * 12) * 0.15
    },
    tire: (t, p) => {
      const reach = easeOut(Math.min(t / 0.8, 1))
      p.leftArm.rotation.x = -0.9 * reach
      p.body.rotation.z = 0.1 * reach
      p.rightArm.rotation.x = Math.sin(t * 4) * 0.2 * reach
    },
    toolrack: (t, p) => {
      const pull = t < 1 ? easeOut(t) : easeOut(1 - (t - 1) / 1.5)
      p.rightArm.rotation.x = -1.4 * pull
      p.head.rotation.x = -0.1 * pull
    },
  },
  'knowledge-teacher': {
    bookshelf: (t, p) => {
      const pull = t < 0.8 ? easeOut(t / 0.8) : t < 1.6 ? 1 : easeOut(1 - (t - 1.6) / 0.9)
      p.rightArm.rotation.x = -1.1 * pull
      p.head.rotation.x = -0.1 * pull
    },
    desk: (t, p) => {
      p.body.position.y = -0.15
      p.leftArm.rotation.x = Math.sin(t * 8) * 0.12
      p.rightArm.rotation.x = Math.sin(t * 8 + 1.5) * 0.12
    },
    chalkboard: (t, p) => {
      const reach = easeOut(Math.min(t / 0.6, 1))
      p.rightArm.rotation.x = -1.3 * reach
      p.rightArm.rotation.z = Math.sin(t * 8) * 0.1 * reach
    },
  },
  constructor: {
    workbench: (t, p) => {
      const hit = Math.abs(Math.sin(t * 5)) * easeOut(Math.min(t / 0.4, 1))
      p.rightArm.rotation.x = -0.3 - 0.7 * hit
      p.body.rotation.x = 0.08 * hit
    },
    blueprints: (t, p) => {
      const bend = easeOut(Math.min(t / 0.8, 1)) * (t < 2 ? 1 : easeOut(1 - (t - 2) / 0.5))
      p.body.rotation.x = 0.5 * bend
      p.leftArm.rotation.x = -0.6 * bend
      p.rightArm.rotation.x = -0.6 * bend
      p.head.rotation.x = 0.15 * bend
    },
    hardhat: (t, p) => {
      const grab = t < 1.2 ? easeOut(t / 1.2) : easeOut(1 - (t - 1.2) / 1.3)
      p.rightArm.rotation.x = -0.8 - 0.7 * grab
      p.head.rotation.x = -0.12 * grab
    },
  },
  'soccer-coach': {
    goal: (t, p) => {
      const kick = t < 0.6 ? easeOut(t / 0.6) : easeOut(1 - (t - 0.6) / 0.6)
      const repeat = t > 1.4 ? (t < 2 ? easeOut((t - 1.4) / 0.6) : easeOut(1 - (t - 2) / 0.5)) : 0
      p.rightLeg.rotation.x = -0.8 * (kick + repeat * 0.6)
      p.body.rotation.x = -0.15 * kick
      p.leftArm.rotation.x = 0.2 * kick
      p.rightArm.rotation.x = -0.2 * kick
    },
    soccerball: (t, p) => {
      p.leftLeg.rotation.x = Math.sin(t * 6) * 0.2
      p.rightLeg.rotation.x = Math.sin(t * 6 + Math.PI) * 0.2
      p.body.rotation.y = Math.sin(t * 3) * 0.1
    },
  },
  'art-assistant': {
    easel: (t, p) => {
      const reach = easeOut(Math.min(t / 0.6, 1))
      p.rightArm.rotation.x = -0.6 * reach
      p.rightArm.rotation.y = Math.sin(t * 4) * 0.15 * reach
      p.head.rotation.y = 0.08 * reach
    },
    paintcans: (t, p) => {
      const dip = t < 0.8 ? easeOut(t / 0.8) : easeOut(1 - (t - 0.8) / 0.6)
      const sweep = t > 1 ? easeOut((t - 1) / 1) : 0
      p.body.rotation.x = 0.3 * dip
      p.rightArm.rotation.x = -0.5 * dip + 0.3 * sweep
    },
  },
  delivery: {
    packages: (t, p) => {
      const cycle = (t * 2) % 2
      const reach = cycle < 1 ? easeOut(cycle) : easeOut(1 - (cycle - 1))
      p.leftArm.rotation.x = -0.7 * reach
      p.rightArm.rotation.x = -0.7 * (1 - reach)
    },
    scooter: (t, p) => {
      const mount = t < 1 ? easeOut(t) : 1
      p.body.position.y = 0.1 * mount
      p.body.rotation.x = 0.05 * mount
    },
  },
}

const PROP_LAYOUT = {
  shelf: { pos: [-3.6, 1.2, -5.2], rotY: 0, hit: [2.0, 1.0, 0.8], hitY: 0.15, movable: false },
  toolrack: { pos: [4.2, 1.2, -5.2], rotY: 0, hit: [0.6, 2.6, 0.8], hitY: 0, movable: false },
  chalkboard: { pos: [0, 1.8, -5.7], rotY: 0, hit: [3.0, 1.8, 0.4], hitY: 0, movable: false },
  broom: { pos: [-4.5, 0, -3.5], rotY: 0.3, hit: [0.8, 2.2, 0.6], hitY: 1, movable: true, carryY: 0.95 },
  bucket: { pos: [-3.8, 0, -3.2], rotY: 0, hit: [0.8, 0.8, 0.8], hitY: 0.3, movable: true, carryY: 0.75 },
  workbench: { pos: [-3.2, 0, -4.6], rotY: 0.2, hit: [2.8, 1.4, 1.4], hitY: 0.7, movable: true, carryY: 1.05 },
  tire: { pos: [3.2, 0, -4.2], rotY: 0, hit: [1.4, 1.4, 0.6], hitY: 0.55, movable: true, carryY: 0.85 },
  bookshelf: { pos: [-3.5, 0, -5], rotY: 0.15, hit: [2.0, 2.8, 0.6], hitY: 1.3, movable: true, carryY: 1.2 },
  desk: { pos: [3, 0, -4.5], rotY: -0.2, hit: [2.4, 1.2, 1.4], hitY: 0.6, movable: true, carryY: 1 },
  blueprints: { pos: [3.2, 0, -4.2], rotY: -0.4, hit: [1.4, 0.3, 1.0], hitY: 0.15, movable: true, carryY: 0.85 },
  hardhat: { pos: [3.8, 0, -3.6], rotY: 0, hit: [0.8, 0.5, 0.8], hitY: 0.25, movable: true, carryY: 0.8 },
  goal: { pos: [-3.5, 0, -5], rotY: 0, hit: [2.8, 1.4, 0.4], hitY: 0.6, movable: true, carryY: 1.05 },
  soccerball: { pos: [2.8, 0, -3.8], rotY: 0, hit: [0.8, 0.8, 0.8], hitY: 0.35, movable: true, carryY: 0.8 },
  easel: { pos: [-3.4, 0, -4.6], rotY: 0.25, hit: [1.2, 2.4, 0.6], hitY: 1.2, movable: true, carryY: 1.15 },
  paintcans: { pos: [3.2, 0, -4.4], rotY: 0, hit: [1.4, 0.6, 0.8], hitY: 0.25, movable: true, carryY: 0.8 },
  packages: { pos: [-3.4, 0, -4.4], rotY: 0, hit: [1.4, 1.0, 1.0], hitY: 0.4, movable: true, carryY: 0.9 },
  scooter: { pos: [3.2, 0, -4], rotY: -0.3, hit: [1.6, 0.8, 0.8], hitY: 0.4, movable: true, carryY: 0.9 },
}

const PROP_LABELS = {
  soccerball: 'soccer ball',
  paintcans: 'paint cans',
  toolrack: 'tool rack',
  hardhat: 'hard hat',
  blueprints: 'plans',
}

const propLabel = (name) => PROP_LABELS[name] ?? name

const CARRY_REACH = 0.5
const STANDOFF = 1
const PICK_TIME = 0.8
const FLOOR_LIMIT = 4.4

function ClickableProp({ name, layout, position, selected, accent, register, onClick, children }) {
  const groupRef = useRef(null)
  const ringRef = useRef(null)

  useEffect(() => {
    register(name, groupRef.current)
    return () => register(name, null)
  }, [name, register])

  useFrame((state) => {
    if (!ringRef.current) return
    ringRef.current.scale.setScalar(1 + Math.sin(state.clock.getElapsedTime() * 4) * 0.09)
  })

  return (
    <group ref={groupRef} position={position} rotation={[0, layout.rotY, 0]}>
      {children}
      {selected && (
        <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[0.46, 0.62, 28]} />
          <meshBasicMaterial color={accent} transparent opacity={0.8} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}
      <mesh
        position={[0, layout.hitY, 0]}
        onClick={(event) => { event.stopPropagation(); onClick(name) }}
        onPointerOver={(event) => { event.stopPropagation(); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { document.body.style.cursor = '' }}
      >
        <boxGeometry args={layout.hit} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}

function Room({ member }) {
  const wallColor = new THREE.Color(member.room.wall)
  const floorColor = new THREE.Color(member.room.floor)
  const accentColor = new THREE.Color(member.room.accent)
  const trimColor = new THREE.Color(member.trim)
  const dark = new THREE.Color('#071019')
  const wallPaint = wallColor.clone().lerp(dark, 0.22)
  const floorPaint = floorColor.clone().lerp(dark, 0.12)

  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color={floorPaint} roughness={0.8} />
      </mesh>
      <mesh receiveShadow position={[0, 3, -5.9]}>
        <planeGeometry args={[12, 6]} />
        <meshStandardMaterial color={wallPaint} roughness={0.9} />
      </mesh>
      <mesh receiveShadow rotation={[0, Math.PI / 2, 0]} position={[-5.9, 3, 0]}>
        <planeGeometry args={[12, 6]} />
        <meshStandardMaterial color={wallPaint} roughness={0.9} />
      </mesh>
      <mesh receiveShadow rotation={[0, -Math.PI / 2, 0]} position={[5.9, 3, 0]}>
        <planeGeometry args={[12, 6]} />
        <meshStandardMaterial color={wallPaint} roughness={0.9} />
      </mesh>
      <mesh receiveShadow rotation={[Math.PI / 2, 0, 0]} position={[0, 5.9, 0]}>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color={wallPaint} roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color={accentColor} transparent opacity={0.22} roughness={1} />
      </mesh>
      <mesh position={[-5.86, 0.14, 0]} rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[12, 0.28, 0.08]} /><meshStandardMaterial color={trimColor} /></mesh>
      <mesh position={[5.86, 0.14, 0]} rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[12, 0.28, 0.08]} /><meshStandardMaterial color={trimColor} /></mesh>
    </group>
  )
}

function Bookshelf({ color, accent }) {
  return (
    <group>
      <mesh castShadow position={[0, 1.25, 0]}><boxGeometry args={[1.6, 2.5, 0.35]} /><meshStandardMaterial color={color} /></mesh>
      {[0.4, 1.1, 1.8].map((y, i) => (
        <group key={i}>
          <mesh position={[-0.55, y, 0.05]}><boxGeometry args={[0.35, 0.28, 0.2]} /><meshStandardMaterial color={accent} /></mesh>
          <mesh position={[0, y, 0.05]}><boxGeometry args={[0.35, 0.32, 0.2]} /><meshStandardMaterial color="#8ec5ff" /></mesh>
          <mesh position={[0.55, y, 0.05]}><boxGeometry args={[0.35, 0.26, 0.2]} /><meshStandardMaterial color="#ffd1a6" /></mesh>
        </group>
      ))}
    </group>
  )
}

function Desk({ color, accent }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.85, 0]}><boxGeometry args={[2, 0.1, 1]} /><meshStandardMaterial color={color} /></mesh>
      <mesh castShadow position={[-0.85, 0.4, 0]}><boxGeometry args={[0.1, 0.8, 0.8]} /><meshStandardMaterial color={color} /></mesh>
      <mesh castShadow position={[0.85, 0.4, 0]}><boxGeometry args={[0.1, 0.8, 0.8]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[0, 0.95, 0.05]}><boxGeometry args={[0.7, 0.5, 0.06]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.6} /></mesh>
    </group>
  )
}

function Chalkboard({ color, accent }) {
  return (
    <group>
      <mesh castShadow><boxGeometry args={[2.8, 1.6, 0.08]} /><meshStandardMaterial color="#2a3a2a" /></mesh>
      <mesh position={[0, 0, 0.05]}><boxGeometry args={[2.6, 1.4, 0.02]} /><meshStandardMaterial color="#1f2f1f" roughness={0.9} /></mesh>
      <Text position={[0, 0.1, 0.07]} fontSize={0.18} color={accent} anchorX="center" anchorY="middle">Learn & Share</Text>
      <Text position={[0, -0.25, 0.07]} fontSize={0.1} color="#aaddaa" anchorX="center" anchorY="middle">1 + 1 = 2</Text>
    </group>
  )
}

function Workbench({ color, accent }) {
  return (
    <group>
      <mesh castShadow position={[0, 1, 0]}><boxGeometry args={[2.4, 0.12, 1.1]} /><meshStandardMaterial color={color} metalness={0.6} /></mesh>
      <mesh castShadow position={[-1, 0.45, 0]}><boxGeometry args={[0.15, 0.9, 0.9]} /><meshStandardMaterial color={color} /></mesh>
      <mesh castShadow position={[1, 0.45, 0]}><boxGeometry args={[0.15, 0.9, 0.9]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[0.6, 1.1, 0.2]} rotation={[0, 0, 0.4]}><cylinderGeometry args={[0.06, 0.06, 0.5, 8]} /><meshStandardMaterial color={accent} /></mesh>
    </group>
  )
}

function Tire({ accent }) {
  return (
    <group position={[0, 0.55, 0]} rotation={[Math.PI / 2, 0, -0.2]}>
      <mesh castShadow><torusGeometry args={[0.55, 0.18, 12, 32]} /><meshStandardMaterial color="#1a1a1a" roughness={0.9} /></mesh>
      <mesh><cylinderGeometry args={[0.3, 0.3, 0.1, 16]} /><meshStandardMaterial color={accent} metalness={0.5} /></mesh>
    </group>
  )
}

function Toolrack({ color, accent }) {
  return (
    <group>
      <mesh castShadow><boxGeometry args={[0.15, 2.2, 0.5]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[0, 0.6, 0.3]} rotation={[0, 0, 0.3]}><cylinderGeometry args={[0.04, 0.04, 0.6, 8]} /><meshStandardMaterial color={accent} /></mesh>
      <mesh position={[0, -0.1, 0.3]} rotation={[0, 0, -0.2]}><cylinderGeometry args={[0.04, 0.04, 0.5, 8]} /><meshStandardMaterial color={accent} /></mesh>
    </group>
  )
}

function Shelf({ color, accent }) {
  return (
    <group>
      <mesh castShadow><boxGeometry args={[1.8, 0.08, 0.45]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[-0.5, 0.2, 0.05]}><boxGeometry args={[0.3, 0.35, 0.25]} /><meshStandardMaterial color={accent} /></mesh>
      <mesh position={[0.2, 0.18, 0.05]}><cylinderGeometry args={[0.1, 0.1, 0.3, 12]} /><meshStandardMaterial color="#ffffff" /></mesh>
    </group>
  )
}

function Broom({ accent }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.9, 0]}><cylinderGeometry args={[0.04, 0.04, 1.8, 8]} /><meshStandardMaterial color="#8b6f4e" /></mesh>
      <mesh position={[0, 0.05, 0]}><boxGeometry args={[0.3, 0.35, 0.15]} /><meshStandardMaterial color={accent} /></mesh>
    </group>
  )
}

function Bucket({ color }) {
  return (
    <mesh castShadow position={[0, 0.28, 0]}>
      <cylinderGeometry args={[0.28, 0.22, 0.55, 16]} />
      <meshStandardMaterial color={color} metalness={0.3} />
    </mesh>
  )
}

function Blueprints({ accent }) {
  return (
    <group position={[0, 0.06, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1.2, 0.8]} /><meshStandardMaterial color="#b8d4ff" side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1, 0.6]} /><meshBasicMaterial color={accent} transparent opacity={0.4} /></mesh>
    </group>
  )
}

function Hardhat({ accent }) {
  return (
    <mesh castShadow position={[0, 0.18, 0]}>
      <sphereGeometry args={[0.28, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial color={accent} />
    </mesh>
  )
}

function Goal({ color, accent }) {
  return (
    <group>
      <mesh castShadow position={[0, 1, 0]}><boxGeometry args={[2.4, 0.08, 0.08]} /><meshStandardMaterial color={color} /></mesh>
      <mesh castShadow position={[-1.16, 0.5, 0]}><boxGeometry args={[0.08, 1, 0.08]} /><meshStandardMaterial color={color} /></mesh>
      <mesh castShadow position={[1.16, 0.5, 0]}><boxGeometry args={[0.08, 1, 0.08]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[0, 0.5, 0]}><planeGeometry args={[2.3, 1]} /><meshBasicMaterial color={accent} transparent opacity={0.25} side={THREE.DoubleSide} /></mesh>
    </group>
  )
}

function SoccerBall({ accent }) {
  return (
    <mesh castShadow position={[0, 0.35, 0]}>
      <sphereGeometry args={[0.32, 16, 16]} />
      <meshStandardMaterial color="#ffffff" roughness={0.5} />
    </mesh>
  )
}

function Easel({ color, accent }) {
  return (
    <group>
      <mesh castShadow position={[0, 1, 0]} rotation={[0, 0, 0.15]}><cylinderGeometry args={[0.04, 0.04, 2.1, 8]} /><meshStandardMaterial color={color} /></mesh>
      <mesh castShadow position={[-0.35, 1, 0]} rotation={[0, 0, -0.15]}><cylinderGeometry args={[0.04, 0.04, 2.1, 8]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[0, 1.25, 0.05]}><boxGeometry args={[0.8, 0.7, 0.04]} /><meshStandardMaterial color="#f0f0f0" /></mesh>
      <mesh position={[0, 1.25, 0.06]}><circleGeometry args={[0.22, 16]} /><meshBasicMaterial color={accent} /></mesh>
    </group>
  )
}

function PaintCans({ accent }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.22, 0]}><cylinderGeometry args={[0.18, 0.18, 0.44, 16]} /><meshStandardMaterial color={accent} /></mesh>
      <mesh castShadow position={[0.45, 0.18, 0.1]}><cylinderGeometry args={[0.16, 0.16, 0.36, 16]} /><meshStandardMaterial color="#ff9e86" /></mesh>
      <mesh castShadow position={[-0.4, 0.18, 0.15]}><cylinderGeometry args={[0.16, 0.16, 0.36, 16]} /><meshStandardMaterial color="#88caff" /></mesh>
    </group>
  )
}

function Packages({ color, accent }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.35, 0]}><boxGeometry args={[0.7, 0.7, 0.7]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[0, 0.36, 0]}><boxGeometry args={[0.72, 0.08, 0.72]} /><meshStandardMaterial color={accent} /></mesh>
      <mesh castShadow position={[0.55, 0.25, 0.3]}><boxGeometry args={[0.5, 0.5, 0.5]} /><meshStandardMaterial color="#c9d4dc" /></mesh>
    </group>
  )
}

function Scooter({ color, accent }) {
  return (
    <group position={[0, 0.25, 0]}>
      <mesh castShadow position={[0, 0, 0]}><boxGeometry args={[1.2, 0.08, 0.4]} /><meshStandardMaterial color={color} /></mesh>
      <mesh castShadow position={[-0.45, -0.2, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.22, 0.22, 0.12, 16]} /><meshStandardMaterial color="#1a1a1a" /></mesh>
      <mesh castShadow position={[0.45, -0.2, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.22, 0.22, 0.12, 16]} /><meshStandardMaterial color="#1a1a1a" /></mesh>
      <mesh position={[0.55, 0.35, 0]}><cylinderGeometry args={[0.04, 0.04, 0.7, 8]} /><meshStandardMaterial color={accent} /></mesh>
    </group>
  )
}

function WallPoster({ member }) {
  const [texture, setTexture] = useState(null)

  useEffect(() => {
    let disposed = false
    const loader = new THREE.TextureLoader()
    loader.load(
      `/images/posters/${member.id}.png`,
      (tex) => {
        if (disposed) { tex.dispose(); return }
        tex.colorSpace = THREE.SRGBColorSpace
        setTexture(tex)
      },
      undefined,
      () => {}
    )
    return () => {
      disposed = true
      setTexture((prev) => { prev?.dispose(); return null })
    }
  }, [member.id])

  if (!texture) return null

  return (
    <mesh position={[0, 3, -5.87]}>
      <planeGeometry args={[12, 6]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  )
}

function RoomProps({ member, positions, selected, register, onPropClick }) {
  const { room, profile } = member
  const accent = room.accent
  const wall = room.wall
  const wrap = (name, child) => {
    const layout = PROP_LAYOUT[name]
    const moved = positions[name]
    const position = moved ? [moved[0], layout.pos[1], moved[1]] : layout.pos
    return (
      <ClickableProp
        key={name}
        name={name}
        layout={layout}
        position={position}
        selected={selected === name}
        accent={accent}
        register={register}
        onClick={onPropClick}
      >
        {child}
      </ClickableProp>
    )
  }

  switch (profile) {
    case 'knowledge-teacher':
      return <>{wrap('bookshelf', <Bookshelf color={wall} accent={accent} />)}{wrap('desk', <Desk color={wall} accent={accent} />)}{wrap('chalkboard', <Chalkboard color={wall} accent={accent} />)}</>
    case 'vehicle-repair':
      return <>{wrap('workbench', <Workbench color={wall} accent={accent} />)}{wrap('tire', <Tire accent={accent} />)}{wrap('toolrack', <Toolrack color={wall} accent={accent} />)}</>
    case 'constructor':
      return <>{wrap('workbench', <Workbench color={wall} accent={accent} />)}{wrap('blueprints', <Blueprints accent={accent} />)}{wrap('hardhat', <Hardhat accent={accent} />)}</>
    case 'soccer-coach':
      return <>{wrap('goal', <Goal color={wall} accent={accent} />)}{wrap('soccerball', <SoccerBall accent={accent} />)}</>
    case 'art-assistant':
      return <>{wrap('easel', <Easel color={wall} accent={accent} />)}{wrap('paintcans', <PaintCans accent={accent} />)}</>
    case 'delivery':
      return <>{wrap('packages', <Packages color={wall} accent={accent} />)}{wrap('scooter', <Scooter color={wall} accent={accent} />)}</>
    case 'housecleaning':
    default:
      return <>{wrap('shelf', <Shelf color={wall} accent={accent} />)}{wrap('broom', <Broom accent={accent} />)}{wrap('bucket', <Bucket color={wall} />)}</>
  }
}

const RobotAvatar = forwardRef(function RobotAvatar({ member, getPropGroup, onPlaced, onCarryChange }, ref) {
  const rootRef = useRef(null)
  const bodyRef = useRef(null)
  const headRef = useRef(null)
  const leftArmRef = useRef(null)
  const rightArmRef = useRef(null)
  const leftLegRef = useRef(null)
  const rightLegRef = useRef(null)
  const wheelsRef = useRef(null)

  const plate = new THREE.Color(member.plate)
  const core = new THREE.Color(member.core)
  const trim = new THREE.Color(member.trim)
  const shape = getShape(member.profile)
  const scale = 0.75

  const stateRef = useRef({
    phase: 'idle',
    targetProp: null,
    targetPos: new THREE.Vector3(),
    walkPhase: 0,
    actionTime: 0,
    idleBlend: 0,
    carry: null,
    carried: false,
  })

  useImperativeHandle(ref, () => ({
    isIdle() { return stateRef.current.phase === 'idle' },
    goToProp(name) {
      const s = stateRef.current
      const waypoints = PROP_WAYPOINTS[member.profile]
      if (!waypoints?.[name]) return
      if (s.phase !== 'idle' && s.targetProp === name) {
        s.phase = 'returning'
        s.targetProp = null
        s.targetPos.set(0, 0, 0)
        s.idleBlend = 1
        return
      }
      const [tx, ty, tz] = waypoints[name].target
      s.targetProp = name
      s.targetPos.set(tx, ty, tz)
      s.phase = 'walking'
      s.idleBlend = 0
    },
    carryProp(name, dropX, dropZ) {
      const s = stateRef.current
      const layout = PROP_LAYOUT[name]
      const group = getPropGroup?.(name)
      if (s.phase !== 'idle' || !layout?.movable || !group) return
      s.carry = {
        name,
        layout,
        from: new THREE.Vector3(group.position.x, 0, group.position.z),
        to: new THREE.Vector3(dropX, 0, dropZ),
      }
      s.carried = false
      s.targetProp = null
      s.actionTime = 0
      s.idleBlend = 0
      standoff(s.carry.from, s.targetPos)
      s.phase = 'fetching'
      onCarryChange?.(name)
    },
  }))

  const shoulderX = shape.torso[0] / 2 + shape.shoulderR
  const hipX = shape.torso[0] / 2 - 0.29
  const torsoFrontZ = shape.torso[2] / 2

  useFrame((state, delta) => {
    if (!rootRef.current || !bodyRef.current) return
    const dt = Math.min(delta, 0.05)
    const time = state.clock.getElapsedTime()
    const s = stateRef.current
    const partRefs = {
      body: bodyRef.current,
      head: headRef.current,
      leftArm: leftArmRef.current,
      rightArm: rightArmRef.current,
      leftLeg: leftLegRef.current,
      rightLeg: rightLegRef.current,
      wheels: wheelsRef.current,
    }

    bodyRef.current.rotation.set(0, 0, 0)
    bodyRef.current.position.y = 0
    if (leftArmRef.current) leftArmRef.current.rotation.set(0, 0, 0)
    if (rightArmRef.current) rightArmRef.current.rotation.set(0, 0, 0)
    if (leftLegRef.current) leftLegRef.current.rotation.set(0, 0, 0)
    if (rightLegRef.current) rightLegRef.current.rotation.set(0, 0, 0)
    if (wheelsRef.current) wheelsRef.current.rotation.x = 0

    const travelling = s.phase === 'walking' || s.phase === 'returning' || s.phase === 'fetching' || s.phase === 'carrying'
    if (travelling) {
      const pos = rootRef.current.position
      const dx = s.targetPos.x - pos.x
      const dz = s.targetPos.z - pos.z
      const dist = Math.sqrt(dx * dx + dz * dz)
      const targetAngle = Math.atan2(dx, dz)
      let angleDiff = targetAngle - rootRef.current.rotation.y
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
      rootRef.current.rotation.y += angleDiff * Math.min(1, TURN_LERP * dt)

      if (dist > ARRIVE_DIST) {
        const step = Math.min(WALK_SPEED * dt, dist)
        pos.x += (dx / dist) * step
        pos.z += (dz / dist) * step
        s.walkPhase += STEP_FREQ * dt
      } else if (s.phase === 'walking') {
        s.phase = 'performing'
        s.actionTime = 0
      } else if (s.phase === 'fetching') {
        s.phase = 'picking'
        s.actionTime = 0
      } else if (s.phase === 'carrying') {
        s.phase = 'placing'
        s.actionTime = 0
      } else {
        s.phase = 'idle'
        s.targetProp = null
      }

      if (s.phase === 'walking' || s.phase === 'returning' || s.phase === 'fetching' || s.phase === 'carrying') {
        const walkActive = 1 - s.idleBlend
        const bob = Math.abs(Math.sin(s.walkPhase)) * (shape.hasLegs ? BOB_AMOUNT : WHEEL_BOB)
        bodyRef.current.position.y = bob
        if (shape.hasLegs) {
          if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(s.walkPhase) * STEP_LEG * walkActive
          if (rightLegRef.current) rightLegRef.current.rotation.x = Math.sin(s.walkPhase + Math.PI) * STEP_LEG * walkActive
        } else if (wheelsRef.current) {
          wheelsRef.current.rotation.x += dt * 15
        }
        if (s.phase === 'carrying') {
          if (leftArmRef.current) leftArmRef.current.rotation.x = -1.15
          if (rightArmRef.current) rightArmRef.current.rotation.x = -1.15
        } else {
          if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(s.walkPhase + Math.PI) * STEP_ARM * walkActive
          if (rightArmRef.current) rightArmRef.current.rotation.x = Math.sin(s.walkPhase) * STEP_ARM * walkActive
        }

        if (s.idleBlend > 0) {
          s.idleBlend = Math.max(0, s.idleBlend - dt / 0.3)
        }
      }
    }

    if (s.phase === 'performing') {
      s.actionTime += dt
      const actions = PROP_ACTIONS[member.profile]
      if (actions?.[s.targetProp]) {
        actions[s.targetProp](s.actionTime, partRefs)
      }
      if (s.actionTime >= ACTION_DURATION) {
        s.phase = 'returning'
        s.targetProp = null
        s.targetPos.set(0, 0, 0)
        s.idleBlend = 1
      }
    }

    if (s.phase === 'picking' || s.phase === 'placing') {
      s.actionTime += dt
      const carry = s.carry
      const anchor = s.phase === 'picking' ? carry.from : carry.to
      const dx = anchor.x - rootRef.current.position.x
      const dz = anchor.z - rootRef.current.position.z
      const targetAngle = Math.atan2(dx, dz)
      let angleDiff = targetAngle - rootRef.current.rotation.y
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
      rootRef.current.rotation.y += angleDiff * Math.min(1, TURN_LERP * dt)

      const t = Math.min(1, s.actionTime / PICK_TIME)
      const reach = t < 0.5 ? easeOut(t / 0.5) : easeOut(1 - (t - 0.5) / 0.5)
      bodyRef.current.rotation.x = 0.32 * reach
      if (leftArmRef.current) leftArmRef.current.rotation.x = -1 * reach
      if (rightArmRef.current) rightArmRef.current.rotation.x = -1 * reach

      if (s.phase === 'picking') {
        if (t >= 0.5) s.carried = true
        if (t >= 1) {
          standoff(carry.to, s.targetPos)
          s.phase = 'carrying'
        }
      } else {
        if (s.carried && t >= 0.5) {
          s.carried = false
          const group = getPropGroup?.(carry.name)
          if (group) {
            group.position.set(carry.to.x, carry.layout.pos[1], carry.to.z)
            group.rotation.y = carry.layout.rotY
          }
          onPlaced?.(carry.name, carry.to.x, carry.to.z)
        }
        if (t >= 1) {
          s.carry = null
          s.targetPos.set(0, 0, 0)
          s.idleBlend = 1
          s.phase = 'returning'
          onCarryChange?.(null)
        }
      }
    }

    if (s.carried && s.carry) {
      const group = getPropGroup?.(s.carry.name)
      if (group) {
        const yaw = rootRef.current.rotation.y
        group.position.set(
          rootRef.current.position.x + Math.sin(yaw) * CARRY_REACH,
          s.carry.layout.carryY,
          rootRef.current.position.z + Math.cos(yaw) * CARRY_REACH,
        )
        group.rotation.y = yaw + s.carry.layout.rotY
      }
    }

    if (s.phase === 'idle') {
      rootRef.current.rotation.y += Math.sin(time * 0.4) * 0.002
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(time * 0.4) * 0.08
      }
    }
  })

  return (
    <group ref={rootRef} position={[0, 0, 0]}>
      <group ref={bodyRef} scale={[scale, scale, scale]}>
        <NameLabel name={member.name} color={member.trim} shape={shape} fontSize={0.32} />
        <group ref={headRef}>
          <mesh castShadow position={[0, shape.headY, 0]}>
            <boxGeometry args={shape.head} />
            <meshStandardMaterial color={plate} metalness={0.35} roughness={0.45} />
          </mesh>
          <mesh castShadow position={[0, shape.opticsY, torsoFrontZ + 0.02]}>
            <boxGeometry args={shape.optics} />
            <meshStandardMaterial color={core} emissive={core} emissiveIntensity={2} />
          </mesh>
        </group>
        <mesh castShadow position={[0, shape.torsoY, 0]}>
          <boxGeometry args={shape.torso} />
          <meshStandardMaterial color={plate} metalness={0.35} roughness={0.5} />
        </mesh>
        <mesh castShadow position={[0, shape.coreY, torsoFrontZ + 0.04]}>
          <cylinderGeometry args={[shape.coreRadius, shape.coreRadius, 0.09, 20]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color={core} emissive={core} emissiveIntensity={3} />
        </mesh>
        <group ref={leftArmRef} position={[-shoulderX, shape.shoulderY, 0]}>
          <mesh castShadow><sphereGeometry args={[shape.shoulderR, 16, 16]} /><meshStandardMaterial color={trim} metalness={0.4} roughness={0.4} /></mesh>
          <mesh castShadow position={[-0.18, -shape.armSize[1] / 2 - 0.07, 0]} rotation={[0, 0, -shape.armAngle]}>
            <boxGeometry args={shape.armSize} />
            <meshStandardMaterial color={plate} metalness={0.35} roughness={0.45} />
          </mesh>
        </group>
        <group ref={rightArmRef} position={[shoulderX, shape.shoulderY, 0]}>
          <mesh castShadow><sphereGeometry args={[shape.shoulderR, 16, 16]} /><meshStandardMaterial color={trim} metalness={0.4} roughness={0.4} /></mesh>
          <mesh castShadow position={[0.18, -shape.armSize[1] / 2 - 0.07, 0]} rotation={[0, 0, shape.armAngle]}>
            <boxGeometry args={shape.armSize} />
            <meshStandardMaterial color={plate} metalness={0.35} roughness={0.45} />
          </mesh>
        </group>
        <ProfessionRig profile={member.profile} trim={member.trim} core={member.core} />
        <IntegratedBodyDetails member={member} shape={shape} />
        {shape.hasLegs ? (
          <>
            <group ref={leftLegRef} position={[-hipX, shape.legY, 0]}>
              <mesh castShadow rotation={[0, 0, -0.0312]}><boxGeometry args={shape.legSize} /><meshStandardMaterial color={plate} metalness={0.35} roughness={0.45} /></mesh>
              <mesh castShadow position={[0, -shape.legSize[1] / 2 - 0.12, 0.08]}><boxGeometry args={shape.footSize} /><meshStandardMaterial color={trim} metalness={0.4} roughness={0.4} /></mesh>
            </group>
            <group ref={rightLegRef} position={[hipX, shape.legY, 0]}>
              <mesh castShadow rotation={[0, 0, 0.0312]}><boxGeometry args={shape.legSize} /><meshStandardMaterial color={plate} metalness={0.35} roughness={0.45} /></mesh>
              <mesh castShadow position={[0, -shape.legSize[1] / 2 - 0.12, 0.08]}><boxGeometry args={shape.footSize} /><meshStandardMaterial color={trim} metalness={0.4} roughness={0.4} /></mesh>
            </group>
          </>
        ) : (
          <group ref={wheelsRef}>
            <mesh castShadow position={[-0.42, 0.05, 0.22]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.2, 0.2, 0.24, 16]} /><meshStandardMaterial color={trim} /></mesh>
            <mesh castShadow position={[0.42, 0.05, 0.22]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.2, 0.2, 0.24, 16]} /><meshStandardMaterial color={trim} /></mesh>
          </group>
        )}
      </group>
    </group>
  )
})

function MissionMarker({ mission, color, isComplete, onComplete }) {
  const marker = useRef(null)
  const [x, y, z] = mission.target.position

  useEffect(() => () => { document.body.style.cursor = '' }, [])

  useFrame((state) => {
    if (!marker.current || isComplete) return

    const time = state.clock.getElapsedTime()
    marker.current.position.y = y + Math.sin(time * 3) * 0.08
    marker.current.scale.setScalar(1 + Math.sin(time * 4) * 0.08)
  })

  if (isComplete) {
    return (
      <group position={[x, y, z]}>
        <mesh><torusGeometry args={[0.18, 0.035, 8, 24]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} /></mesh>
        <mesh position={[0, 0, 0.02]}><circleGeometry args={[0.09, 16]} /><meshBasicMaterial color="#f4fbff" /></mesh>
      </group>
    )
  }

  const complete = (event) => {
    event.stopPropagation()
    onComplete()
  }

  return (
    <group ref={marker} position={[x, y, z]}>
      <mesh><torusGeometry args={[0.22, 0.045, 8, 24]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.5} /></mesh>
      <mesh><sphereGeometry args={[0.09, 16, 16]} /><meshStandardMaterial color="#f4fbff" emissive={color} emissiveIntensity={2} /></mesh>
      <mesh
        onClick={complete}
        onPointerOver={(event) => { event.stopPropagation(); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { document.body.style.cursor = '' }}
      >
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}

function FloorTarget({ active, onSelect }) {
  useEffect(() => () => { document.body.style.cursor = '' }, [])

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.015, 0]}
      onClick={(event) => {
        event.stopPropagation()
        const x = THREE.MathUtils.clamp(event.point.x, -FLOOR_LIMIT, FLOOR_LIMIT)
        const z = THREE.MathUtils.clamp(event.point.z, -FLOOR_LIMIT, FLOOR_LIMIT)
        onSelect(x, z)
      }}
      onPointerOver={() => { if (active) document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { document.body.style.cursor = '' }}
    >
      <planeGeometry args={[9.2, 9.2]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}

function ProfileWorld({ member, isMissionComplete, onCompleteMission, onHint }) {
  const accent = new THREE.Color(member.room.accent)
  const dark = new THREE.Color('#071019')
  const bg = new THREE.Color(member.room.wall).lerp(dark, 0.45)
  const robotControlRef = useRef(null)
  const propGroups = useRef({})
  const [propPositions, setPropPositions] = useState({})
  const [selected, setSelected] = useState(null)

  const registerProp = useCallback((name, group) => {
    if (group) propGroups.current[name] = group
    else delete propGroups.current[name]
  }, [])

  const getPropGroup = useCallback((name) => propGroups.current[name] ?? null, [])

  const handlePropClick = useCallback((propName) => {
    const layout = PROP_LAYOUT[propName]
    if (!robotControlRef.current?.isIdle()) return
    if (!layout.movable || selected === propName) {
      setSelected(null)
      onHint('')
      robotControlRef.current.goToProp(propName)
      return
    }
    setSelected(propName)
    onHint(`${propLabel(propName)} selected — click the floor to move it`)
  }, [onHint, selected])

  const handleFloorSelect = useCallback((x, z) => {
    if (!selected) return
    robotControlRef.current?.carryProp(selected, x, z)
    setSelected(null)
  }, [selected])

  const handlePlaced = useCallback((name, x, z) => {
    setPropPositions((current) => ({ ...current, [name]: [x, z] }))
  }, [])

  const handleCarryChange = useCallback((name) => {
    onHint(name ? `Moving ${propLabel(name)}…` : '')
  }, [onHint])

  return <>
    <color attach="background" args={[bg]} />
    <fog attach="fog" args={[bg, 8, 18]} />
    <ambientLight intensity={1.1} color="#ffffff" />
    <hemisphereLight intensity={0.6} color="#eef8ff" groundColor="#071019" position={[0, 5, 0]} />
    <directionalLight castShadow position={[3.5, 7, 5]} intensity={2.4} color="#fff5e6" shadow-mapSize={[1024, 1024]} />
    <pointLight position={[-4, 3.5, 2]} intensity={14} color={accent} distance={8} />
    <pointLight position={[4, 3, -2]} intensity={12} color={member.core} distance={8} />
    <Room member={member} />
    <WallPoster member={member} />
    <FloorTarget active={Boolean(selected)} onSelect={handleFloorSelect} />
    <RoomProps
      member={member}
      positions={propPositions}
      selected={selected}
      register={registerProp}
      onPropClick={handlePropClick}
    />
    <MissionMarker mission={member.mission} color={member.room.accent} isComplete={isMissionComplete} onComplete={onCompleteMission} />
    <RobotAvatar
      ref={robotControlRef}
      member={member}
      getPropGroup={getPropGroup}
      onPlaced={handlePlaced}
      onCarryChange={handleCarryChange}
    />
    <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 2.1} minAzimuthAngle={-0.35} maxAzimuthAngle={0.35} target={[0, 1.4, 0]} />
  </>
}

function MissionPanel({ member, isComplete, onComplete, onReset }) {
  const { mission } = member

  return (
    <section className="profile-mission" style={{ '--mission-accent': member.room.accent }} aria-labelledby={`mission-${mission.id}`}>
      <p className="profile-mission__label">Room mission</p>
      <h3 id={`mission-${mission.id}`}>{mission.title}</h3>
      <p className="profile-mission__copy">{isComplete ? mission.completeMessage : mission.instruction}</p>
      {isComplete ? (
        <>
          <p className="profile-mission__status" role="status">Mission complete</p>
          <button type="button" className="profile-mission__reset" onClick={onReset}>Reset mission</button>
        </>
      ) : (
        <button type="button" className="profile-mission__action" onClick={onComplete} aria-label={`${mission.actionLabel}: ${mission.title}`}>{mission.actionLabel}</button>
      )}
    </section>
  )
}

function ScrapbookPanel({ member, hasBadge, snapshot, canCapture, onCapture, onRemoveSnapshot, statusMessage }) {
  return (
    <section className="profile-scrapbook" style={{ '--mission-accent': member.room.accent }} aria-labelledby={`scrapbook-${member.id}`}>
      <p className="profile-mission__label">Hangar scrapbook</p>
      <h3 id={`scrapbook-${member.id}`}>{hasBadge ? member.scrapbook.badgeTitle : 'Badge locked'}</h3>
      <p className="profile-scrapbook__copy">
        {hasBadge ? 'Badge collected for this room mission.' : `Complete “${member.mission.title}” to earn this badge.`}
      </p>
      <p className="profile-scrapbook__snapshot">{snapshot ? 'Room snapshot saved' : 'No room snapshot saved'}</p>
      {canCapture ? (
        <button type="button" className="profile-scrapbook__action" onClick={onCapture}>
          {snapshot ? 'Replace room snapshot' : 'Capture room snapshot'}
        </button>
      ) : (
        <p className="profile-scrapbook__unavailable">Snapshot capture needs WebGL.</p>
      )}
      {snapshot && <button type="button" className="profile-scrapbook__remove" onClick={onRemoveSnapshot}>Remove snapshot</button>}
      <p className="profile-scrapbook__status" role="status" aria-live="polite">{statusMessage}</p>
    </section>
  )
}

function ProfileDetails({ member, isMissionComplete, onCompleteMission, onResetMission, hasBadge, snapshot, canCapture, onCapture, onRemoveSnapshot, snapshotStatus }) {
  return <>
    <p className="bubble-kicker">{member.role}</p>
    <h2>{member.name}</h2>
    <p className="bubble-copy">{member.intro}</p>
    <div className="bubble-traits">{member.traits.map((trait) => <span key={trait}>{trait}</span>)}</div>
    <MissionPanel member={member} isComplete={isMissionComplete} onComplete={onCompleteMission} onReset={onResetMission} />
    <ScrapbookPanel
      member={member}
      hasBadge={hasBadge}
      snapshot={snapshot}
      canCapture={canCapture}
      onCapture={onCapture}
      onRemoveSnapshot={onRemoveSnapshot}
      statusMessage={snapshotStatus}
    />
  </>
}

export default function ProfileStage({ member, onBack }) {
  const [available] = useState(webglIsAvailable)
  const [collapsed, setCollapsed] = useState(false)
  const [hint, setHint] = useState('')
  const [snapshotStatus, setSnapshotStatus] = useState('')
  const canvasRef = useRef(null)
  const { isComplete, completeMission, resetMission } = useMissionProgress(member.mission.id)
  const { hasBadge, snapshot, collectBadge, saveSnapshot, removeSnapshot } = useScrapbook(member.id)

  useMusic(member.profile)

  useEffect(() => {
    if (isComplete) collectBadge()
  }, [collectBadge, isComplete])

  const completeProfileMission = useCallback(() => {
    completeMission()
    collectBadge()
  }, [collectBadge, completeMission])

  const captureSnapshot = useCallback(() => {
    const source = canvasRef.current
    if (!source?.width || !source.height) {
      setSnapshotStatus('Room snapshot capture is not ready yet.')
      return
    }

    try {
      const width = Math.min(source.width, 480)
      const height = Math.max(1, Math.round(source.height * (width / source.width)))
      const thumbnail = document.createElement('canvas')
      thumbnail.width = width
      thumbnail.height = height
      thumbnail.getContext('2d')?.drawImage(source, 0, 0, width, height)

      const nextSnapshot = thumbnail.toDataURL('image/jpeg', 0.78)
      setSnapshotStatus(saveSnapshot(nextSnapshot) ? (snapshot ? 'Room snapshot replaced.' : 'Room snapshot saved.') : 'Room snapshot could not be saved.')
    } catch {
      setSnapshotStatus('Room snapshot could not be captured.')
    }
  }, [saveSnapshot, snapshot])

  const removeCurrentSnapshot = useCallback(() => {
    removeSnapshot()
    setSnapshotStatus('Room snapshot removed.')
  }, [removeSnapshot])

  const details = {
    member,
    isMissionComplete: isComplete,
    onCompleteMission: completeProfileMission,
    onResetMission: resetMission,
    hasBadge,
    snapshot,
    canCapture: available,
    onCapture: captureSnapshot,
    onRemoveSnapshot: removeCurrentSnapshot,
    snapshotStatus,
  }

  if (!available) {
    return (
      <section className="profile-stage profile-stage--fallback" aria-label={`${member.name}'s profile room`}>
        <div className="profile-card">
          <ProfileDetails {...details} />
          <button type="button" className="profile-back" onClick={onBack}>Back to family</button>
        </div>
      </section>
    )
  }

  return (
    <section className="profile-stage" aria-label={`${member.name}'s profile room`}>
      <div className={`profile-overlay${collapsed ? ' profile-overlay--collapsed' : ''}`}>
        <div className="profile-overlay__content">
          <ProfileDetails {...details} />
          <button type="button" className="profile-back" onClick={onBack}>Back to family</button>
        </div>
        <button
          type="button"
          className="profile-overlay__toggle"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? 'Expand profile panel' : 'Collapse profile panel'}
          aria-expanded={!collapsed}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" focusable="false">
            {collapsed ? (
              <path d="M7 1.5v11M1.5 7h11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            ) : (
              <path d="M2.5 7h9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>
      {hint && <p className="profile-hint" role="status" aria-live="polite">{hint}</p>}
      <Canvas
        dpr={1}
        camera={{ position: [0, 2.6, 6.5], fov: 42 }}
        gl={{ antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping }}
        onCreated={(state) => { canvasRef.current = state.gl.domElement }}
      >
        <ProfileWorld member={member} isMissionComplete={isComplete} onCompleteMission={completeProfileMission} onHint={setHint} />
      </Canvas>
    </section>
  )
}
