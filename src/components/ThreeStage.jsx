import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Html, Lightformer, OrbitControls, Text } from '@react-three/drei'
import * as THREE from 'three'
import { family } from '../data/family'
import CinematicStage from './CinematicStage'
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

function MechModel({ member, selected, onSelect, dancing, danceToken }) {
  const group = useRef(null)
  const trigger = useRef(null)
  const baseY = member.world[1]
  const core = new THREE.Color(member.core)
  const plate = new THREE.Color(member.plate)
  const trim = new THREE.Color(member.trim)
  const shape = getShape(member.profile)
  const danceStartedAt = useRef(0)

  useEffect(() => {
    if (dancing) danceStartedAt.current = performance.now() / 1000
  }, [danceToken, dancing])

  useFrame((state) => {
    if (!group.current) return
    const time = state.clock.getElapsedTime()
    const pulse = 1 + Math.sin(time * 2 + member.world[0]) * 0.035
    const danceTime = dancing ? time - danceStartedAt.current : 0
    const danceSway = dancing ? Math.sin(danceTime * 9) * 0.16 : 0
    const danceHop = dancing ? Math.max(0, Math.sin(danceTime * 9)) * 0.18 : 0
    group.current.position.x = member.world[0] + danceSway
    group.current.position.y = baseY + Math.sin(time * 1.15 + member.world[0]) * 0.045 + (selected ? 0.12 : 0) + danceHop
    group.current.rotation.y = Math.sin(time * 0.38 + member.world[0]) * 0.03 + (selected ? Math.sin(time * 2.5) * 0.035 : 0)
    group.current.rotation.z = dancing ? Math.sin(danceTime * 9) * 0.1 : 0
    group.current.scale.setScalar((member.position.scale * 1.25) * (selected ? 1.06 : 1) * pulse)
  })

  const select = (event) => {
    event.stopPropagation()
    onSelect(member, trigger.current)
  }

  const selectFromAnchor = (event) => {
    event.stopPropagation()
    onSelect(member, event.currentTarget)
  }

  const shoulderX = shape.torso[0] / 2 + shape.shoulderR
  const hipX = shape.torso[0] / 2 - 0.29
  const torsoFrontZ = shape.torso[2] / 2

  return (
    <group ref={group} position={member.world} onClick={select}>
      <Html position={[0, 1.75, 0.48]} center zIndexRange={[100, 20]} style={{ pointerEvents: 'none' }}>
        <button
          ref={trigger}
          className="robot-anchor"
          type="button"
          data-robot-trigger
          data-robot-id={member.id}
          aria-label={`${member.name}, ${member.role}`}
          aria-expanded={selected}
          aria-controls="member-intro"
          onPointerDown={(event) => event.stopPropagation()}
          onPointerUp={(event) => event.stopPropagation()}
          onClick={selectFromAnchor}
        />
      </Html>
      <NameLabel name={member.name} color={member.trim} shape={shape} />
      <mesh castShadow position={[0, shape.headY, 0]}>
        <boxGeometry args={shape.head} />
        <meshStandardMaterial color={plate} metalness={0.88} roughness={0.27} />
      </mesh>
      <mesh castShadow position={[0, shape.opticsY, torsoFrontZ + 0.02]}>
        <boxGeometry args={shape.optics} />
        <meshStandardMaterial color={core} emissive={core} emissiveIntensity={selected ? 3.3 : 1.6} metalness={0.45} />
      </mesh>
      <mesh castShadow position={[0, shape.torsoY, 0]}>
        <boxGeometry args={shape.torso} />
        <meshStandardMaterial color={plate} metalness={0.9} roughness={0.32} />
      </mesh>
      <mesh castShadow position={[0, shape.coreY, torsoFrontZ + 0.04]}>
        <cylinderGeometry args={[shape.coreRadius, shape.coreRadius, 0.09, 20]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color={core} emissive={core} emissiveIntensity={selected ? 4 : 2} />
      </mesh>
      {[-shoulderX, shoulderX].map((side) => (
        <group key={side} position={[side, shape.shoulderY, 0]}>
          <mesh castShadow><sphereGeometry args={[shape.shoulderR, 16, 16]} /><meshStandardMaterial color={trim} metalness={0.86} roughness={0.23} /></mesh>
          <mesh castShadow position={[side < 0 ? -0.18 : 0.18, -shape.armSize[1] / 2 - 0.07, 0]} rotation={[0, 0, side < 0 ? -shape.armAngle : shape.armAngle]}>
            <boxGeometry args={shape.armSize} />
            <meshStandardMaterial color={plate} metalness={0.86} roughness={0.3} />
          </mesh>
        </group>
      ))}
      <ProfessionRig profile={member.profile} trim={member.trim} core={member.core} />
      <IntegratedBodyDetails member={member} shape={shape} />
      {shape.hasLegs ? (
        [-hipX, hipX].map((side) => (
          <group key={side} position={[side, shape.legY, 0]}>
            <mesh castShadow rotation={[0, 0, side * 0.12]}><boxGeometry args={shape.legSize} /><meshStandardMaterial color={plate} metalness={0.88} roughness={0.29} /></mesh>
            <mesh castShadow position={[0, -shape.legSize[1] / 2 - 0.12, 0.08]}><boxGeometry args={shape.footSize} /><meshStandardMaterial color={trim} metalness={0.77} roughness={0.32} /></mesh>
          </group>
        ))
      ) : (
        <group>
          <mesh castShadow position={[-0.42, 0.05, 0.22]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.2, 0.2, 0.24, 16]} /><meshStandardMaterial color={trim} /></mesh>
          <mesh castShadow position={[0.42, 0.05, 0.22]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.2, 0.2, 0.24, 16]} /><meshStandardMaterial color={trim} /></mesh>
        </group>
      )}
    </group>
  )
}

function SelectionRing({ member }) {
  const core = new THREE.Color(member.core)
  const scale = member.position.scale * 1.25

  return (
    <mesh position={[member.world[0], -0.73, member.world[2]]} rotation={[-Math.PI / 2, 0, 0]} scale={[scale, scale, scale]}>
      <ringGeometry args={[0.86, 1.04, 48]} />
      <meshBasicMaterial color={core} transparent opacity={0.82} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  )
}

function WebGLWorld({ activeMember, onSelect, dancingMemberId, danceToken }) {
  return <>
    <color attach="background" args={['#07111a']} />
    <fog attach="fog" args={['#07111a', 7, 22]} />
    <ambientLight intensity={0.7} color="#8fb0cc" />
    <directionalLight castShadow position={[4, 8, 6]} intensity={2.1} color="#cde6ff" shadow-mapSize={[1024, 1024]} />
    <pointLight position={[-6, 3, 2]} intensity={16} color="#ffac69" distance={9} />
    <pointLight position={[6, 2, -2]} intensity={12} color="#61d8ff" distance={9} />
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.75, 0]}>
      <planeGeometry args={[30, 30, 18, 18]} />
      <meshStandardMaterial color="#0c1a25" metalness={0.72} roughness={0.48} />
    </mesh>
    <gridHelper args={[24, 24, '#2f89a9', '#152b38']} position={[0, -0.735, 0]} />
    {activeMember && <SelectionRing member={activeMember} />}
    {family.map((member) => <MechModel key={member.id} member={member} selected={activeMember?.id === member.id} dancing={dancingMemberId === member.id} danceToken={danceToken} onSelect={onSelect} />)}
    <Environment resolution={128} frames={1}>
      <Lightformer color="#cde6ff" intensity={2.4} position={[4, 5, 3]} scale={[5, 5, 1]} />
      <Lightformer color="#ffac69" intensity={2} position={[-5, 2, 1]} scale={[4, 3, 1]} />
      <Lightformer color="#61d8ff" intensity={1.8} position={[5, 1, -3]} scale={[4, 3, 1]} />
    </Environment>
    <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={Math.PI / 2.7} maxPolarAngle={Math.PI / 2.1} minAzimuthAngle={-0.22} maxAzimuthAngle={0.22} />
  </>
}

export default function ThreeStage({ activeMember, onSelect, onDismiss, dancingMemberId, danceToken }) {
  const [available] = useState(webglIsAvailable)

  if (!available) {
    return <div className="webgl-fallback"><CinematicStage activeMember={activeMember} onSelect={onSelect} onDismiss={onDismiss} /></div>
  }

  return (
    <section className="webgl-stage" aria-label="Three dimensional robot family scene">
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ position: [0, 4.1, 13.5], fov: 35 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
        onPointerMissed={onDismiss}
      >
        <WebGLWorld activeMember={activeMember} onSelect={onSelect} dancingMemberId={dancingMemberId} danceToken={danceToken} />
      </Canvas>
      <div className="webgl-scanlines" aria-hidden="true" />
    </section>
  )
}
