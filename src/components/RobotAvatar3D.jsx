import { Text } from '@react-three/drei'
import * as THREE from 'three'

const defaultShape = {
  head: [1.1, 0.72, 0.72],
  headY: 2.05,
  optics: [0.76, 0.18, 0.08],
  opticsY: 2.09,
  torso: [1.42, 1.12, 0.72],
  torsoY: 1.2,
  coreRadius: 0.23,
  coreY: 1.25,
  shoulderY: 1.35,
  shoulderR: 0.22,
  armSize: [0.28, 0.82, 0.29],
  armAngle: 0.22,
  legY: 0.28,
  legSize: [0.34, 1.05, 0.36],
  footSize: [0.58, 0.21, 0.62],
  hasLegs: true,
}

const shapeByProfile = {
  housecleaning: {
    torso: [1.32, 1.16, 0.72],
    torsoY: 1.16,
    head: [1.0, 0.68, 0.68],
    headY: 2.03,
  },
  'vehicle-repair': {
    torso: [1.58, 1.08, 0.74],
    torsoY: 1.22,
    head: [1.12, 0.7, 0.74],
    headY: 2.07,
    shoulderR: 0.26,
    armSize: [0.32, 0.86, 0.32],
  },
  'knowledge-teacher': {
    torso: [1.22, 1.28, 0.66],
    torsoY: 1.26,
    head: [0.92, 0.78, 0.66],
    headY: 2.12,
  },
  constructor: {
    torso: [1.62, 1.18, 0.78],
    torsoY: 1.18,
    head: [1.18, 0.76, 0.78],
    headY: 2.06,
    shoulderR: 0.3,
    armSize: [0.36, 0.9, 0.34],
    legSize: [0.42, 1.1, 0.4],
    footSize: [0.66, 0.24, 0.7],
  },
  'soccer-coach': {
    torso: [1.38, 1.1, 0.7],
    torsoY: 1.22,
    head: [1.02, 0.68, 0.7],
    headY: 2.05,
  },
  'art-assistant': {
    torso: [1.3, 1.14, 0.68],
    torsoY: 1.18,
    head: [1.0, 0.7, 0.68],
    headY: 2.04,
  },
  delivery: {
    torso: [1.0, 0.86, 0.62],
    torsoY: 0.92,
    head: [0.82, 0.56, 0.58],
    headY: 1.68,
    shoulderR: 0.16,
    armSize: [0.2, 0.6, 0.22],
    hasLegs: false,
  },
}

export function getShape(profile) {
  return { ...defaultShape, ...(shapeByProfile[profile] || {}) }
}

export function ProfessionRig({ profile, trim, core }) {
  if (profile === 'housecleaning') {
    return (
      <group position={[-1.05, 1.4, -0.25]} rotation={[0, 0, -0.15]}>
        <mesh castShadow position={[0, 0.35, 0]}><cylinderGeometry args={[0.04, 0.04, 0.7, 8]} /><meshStandardMaterial color={trim} metalness={0.6} /></mesh>
        <mesh castShadow position={[0, -0.05, 0]}><boxGeometry args={[0.22, 0.28, 0.12]} /><meshStandardMaterial color={core} /></mesh>
      </group>
    )
  }
  if (profile === 'vehicle-repair') {
    return (
      <mesh castShadow position={[0.95, 2.28, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.35, 0.045, 10, 32]} />
        <meshStandardMaterial color={core} emissive={core} emissiveIntensity={1.5} />
      </mesh>
    )
  }
  if (profile === 'knowledge-teacher') {
    return (
      <group position={[-0.95, 1.55, 0.05]}>
        <mesh castShadow><boxGeometry args={[0.36, 0.26, 0.08]} /><meshStandardMaterial color={trim} metalness={0.5} /></mesh>
        <mesh position={[0, 0, 0.05]}><boxGeometry args={[0.28, 0.18, 0.02]} /><meshBasicMaterial color={core} /></mesh>
      </group>
    )
  }
  if (profile === 'constructor') {
    return (
      <group position={[1.35, 0.9, 0]} rotation={[0, 0, -0.3]}>
        <mesh castShadow><cylinderGeometry args={[0.13, 0.18, 0.72, 8]} /><meshStandardMaterial color={trim} metalness={0.9} roughness={0.25} /></mesh>
        <mesh position={[0, -0.42, 0]}><boxGeometry args={[0.34, 0.12, 0.24]} /><meshStandardMaterial color={core} /></mesh>
      </group>
    )
  }
  if (profile === 'soccer-coach') {
    return (
      <group>
        <mesh castShadow position={[-0.95, 1.55, 0]}><sphereGeometry args={[0.22, 16, 16]} /><meshStandardMaterial color="#ffffff" metalness={0.2} roughness={0.6} /></mesh>
        <mesh position={[-0.95, 1.55, 0.12]}><boxGeometry args={[0.1, 0.1, 0.02]} /><meshBasicMaterial color={trim} /></mesh>
        <mesh position={[0.95, 1.9, 0]}><sphereGeometry args={[0.08, 12, 12]} /><meshStandardMaterial color={core} emissive={core} emissiveIntensity={1.2} /></mesh>
      </group>
    )
  }
  if (profile === 'art-assistant') {
    return (
      <group>
        <group position={[-1.15, 1.45, 0]} rotation={[0, 0, 0.25]}>
          <mesh castShadow><cylinderGeometry args={[0.04, 0.04, 0.55, 8]} /><meshStandardMaterial color={trim} /></mesh>
          <mesh position={[0, 0.32, 0]}><boxGeometry args={[0.14, 0.18, 0.1]} /><meshStandardMaterial color={core} /></mesh>
        </group>
        <mesh castShadow position={[1.05, 1.45, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.22, 0.22, 0.04, 16]} /><meshStandardMaterial color={trim} /></mesh>
      </group>
    )
  }
  return (
    <group>
      <mesh castShadow position={[1.1, 1.35, 0]}><boxGeometry args={[0.34, 0.34, 0.34]} /><meshStandardMaterial color={trim} metalness={0.5} /></mesh>
      <mesh position={[1.1, 1.35, 0.18]}><boxGeometry args={[0.22, 0.06, 0.02]} /><meshBasicMaterial color={core} /></mesh>
      <mesh castShadow position={[-0.42, -0.15, 0.22]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.14, 0.14, 0.18, 16]} /><meshStandardMaterial color={trim} /></mesh>
      <mesh castShadow position={[0.42, -0.15, 0.22]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.14, 0.14, 0.18, 16]} /><meshStandardMaterial color={trim} /></mesh>
    </group>
  )
}

export function IntegratedBodyDetails({ member, shape }) {
  const { profile, trim, core } = member
  const trimColor = new THREE.Color(trim)
  const coreColor = new THREE.Color(core)
  const halfTorsoW = shape.torso[0] / 2
  const torsoFrontZ = shape.torso[2] / 2 + 0.02
  const headFrontZ = shape.head[2] / 2 + 0.02

  if (profile === 'constructor') {
    const hatY = shape.headY + shape.head[1] / 2 + 0.12
    return (
      <group>
        <mesh castShadow position={[0, hatY, 0]}><boxGeometry args={[shape.head[0] * 1.05, 0.18, shape.head[2] * 0.95]} /><meshStandardMaterial color={trim} metalness={0.5} /></mesh>
        <mesh castShadow position={[0, hatY + 0.1, 0]}><boxGeometry args={[shape.head[0] * 0.72, 0.14, shape.head[2] * 0.72]} /><meshStandardMaterial color={trim} metalness={0.5} /></mesh>
        <mesh castShadow position={[0, shape.torsoY - shape.torso[1] / 2 - 0.06, torsoFrontZ]}><boxGeometry args={[shape.torso[0] * 0.72, 0.12, 0.08]} /><meshStandardMaterial color="#2a3d48" metalness={0.6} /></mesh>
      </group>
    )
  }

  if (profile === 'housecleaning') {
    return (
      <mesh castShadow position={[0, shape.torsoY - 0.12, torsoFrontZ]}>
        <boxGeometry args={[shape.torso[0] * 0.48, shape.torso[1] * 0.55, 0.08]} />
        <meshStandardMaterial color="#d4e0e5" transparent opacity={0.65} metalness={0.2} roughness={0.6} />
      </mesh>
    )
  }

  if (profile === 'vehicle-repair') {
    return (
      <group>
        <mesh position={[0, shape.headY + 0.02, headFrontZ]}><boxGeometry args={[shape.head[0] * 0.78, 0.14, 0.1]} /><meshStandardMaterial color={core} emissive={core} emissiveIntensity={1.2} /></mesh>
        <mesh castShadow position={[halfTorsoW + 0.12, shape.shoulderY, 0]}><boxGeometry args={[0.2, 0.42, shape.torso[2] * 0.72]} /><meshStandardMaterial color={trimColor} metalness={0.6} /></mesh>
      </group>
    )
  }

  if (profile === 'knowledge-teacher') {
    return (
      <group>
        <mesh position={[-0.18, shape.headY + 0.02, headFrontZ]} rotation={[0, 0, 0]}><torusGeometry args={[0.12, 0.025, 8, 16]} /><meshStandardMaterial color={trim} metalness={0.4} /></mesh>
        <mesh position={[0.18, shape.headY + 0.02, headFrontZ]} rotation={[0, 0, 0]}><torusGeometry args={[0.12, 0.025, 8, 16]} /><meshStandardMaterial color={trim} metalness={0.4} /></mesh>
        <mesh castShadow position={[0, shape.torsoY + shape.torso[1] / 2 - 0.1, torsoFrontZ]}><boxGeometry args={[0.24, 0.1, 0.1]} /><meshStandardMaterial color={trim} /></mesh>
      </group>
    )
  }

  if (profile === 'soccer-coach') {
    return (
      <group>
        <mesh castShadow position={[0, shape.headY + shape.head[1] / 2 - 0.04, 0]}><boxGeometry args={[shape.head[0] * 0.9, 0.14, shape.head[2] * 0.82]} /><meshStandardMaterial color={trim} /></mesh>
        <mesh castShadow position={[0, shape.headY + shape.head[1] / 2 - 0.1, headFrontZ]}><boxGeometry args={[shape.head[0] * 0.46, 0.06, 0.16]} /><meshStandardMaterial color={trim} /></mesh>
        <mesh castShadow position={[0, shape.torsoY + shape.torso[1] / 2 - 0.2, torsoFrontZ]}><sphereGeometry args={[0.06, 12, 12]} /><meshStandardMaterial color={core} emissive={core} emissiveIntensity={1.4} /></mesh>
        <mesh castShadow position={[-0.24, shape.torsoY, torsoFrontZ]}><boxGeometry args={[0.04, shape.torso[1] * 0.65, 0.04]} /><meshStandardMaterial color={trim} /></mesh>
        <mesh castShadow position={[0.24, shape.torsoY, torsoFrontZ]}><boxGeometry args={[0.04, shape.torso[1] * 0.65, 0.04]} /><meshStandardMaterial color={trim} /></mesh>
      </group>
    )
  }

  if (profile === 'art-assistant') {
    return (
      <group>
        <mesh castShadow position={[0.06, shape.headY + shape.head[1] / 2 - 0.02, 0]} rotation={[0, 0, -0.12]}><boxGeometry args={[shape.head[0] * 0.92, 0.12, shape.head[2] * 0.78]} /><meshStandardMaterial color={trim} /></mesh>
        <mesh position={[-shape.torso[0] * 0.22, shape.torsoY + 0.18, torsoFrontZ]}><sphereGeometry args={[0.07, 12, 12]} /><meshStandardMaterial color={coreColor} /></mesh>
        <mesh position={[shape.torso[0] * 0.28, shape.torsoY - 0.12, torsoFrontZ]}><sphereGeometry args={[0.05, 12, 12]} /><meshStandardMaterial color={trimColor} /></mesh>
        <mesh position={[0.12, shape.torsoY - shape.torso[1] * 0.28, torsoFrontZ]}><sphereGeometry args={[0.08, 12, 12]} /><meshStandardMaterial color={coreColor} /></mesh>
      </group>
    )
  }

  if (profile === 'delivery') {
    return (
      <group>
        <mesh position={[0, shape.headY + 0.04, headFrontZ]}><boxGeometry args={[shape.head[0] * 0.84, 0.12, 0.08]} /><meshStandardMaterial color={core} emissive={core} emissiveIntensity={1.3} /></mesh>
        <mesh castShadow position={[0, shape.torsoY, torsoFrontZ]}><boxGeometry args={[shape.torso[0] * 0.42, shape.torso[1] * 0.55, 0.16]} /><meshStandardMaterial color={trim} /></mesh>
      </group>
    )
  }

  return null
}

export function NameLabel({ name, color, shape, fontSize = 0.22 }) {
  const y = shape.headY + shape.head[1] / 2 + 0.35
  return (
    <Text
      position={[0, y, shape.head[2] / 2 + 0.05]}
      fontSize={fontSize}
      color={color}
      anchorX="center"
      anchorY="middle"
      outlineWidth={fontSize * 0.09}
      outlineColor="#0a131b"
    >
      {name}
    </Text>
  )
}
