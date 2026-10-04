import { useEffect, useRef } from 'react'
import { family } from '../data/family'
import MechFigure from './MechFigure'

const motes = Array.from({ length: 14 }, (_, index) => index)

export default function CinematicStage({ activeMember, onSelect, onDismiss, dancingMemberId, danceToken }) {
  const stageRef = useRef(null)
  const animationFrame = useRef(null)

  useEffect(() => {
    const hoverQuery = window.matchMedia('(hover: hover) and (pointer: fine)')
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePointer = (event) => {
      if (!hoverQuery.matches || motionQuery.matches || animationFrame.current) return
      const { innerWidth, innerHeight } = window
      const x = (event.clientX / innerWidth - 0.5) * 2
      const y = (event.clientY / innerHeight - 0.5) * 2
      animationFrame.current = requestAnimationFrame(() => {
        stageRef.current?.style.setProperty('--mouse-x', x.toFixed(3))
        stageRef.current?.style.setProperty('--mouse-y', y.toFixed(3))
        animationFrame.current = null
      })
    }
    window.addEventListener('pointermove', updatePointer, { passive: true })
    return () => {
      window.removeEventListener('pointermove', updatePointer)
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current)
    }
  }, [])

  return (
    <section className="cinematic-stage" ref={stageRef} aria-label="Cinematic robot family scene" onClick={onDismiss}>
      <div className="cinematic-world">
        <div className="scene-layer scene-sky" />
        <div className="scene-layer scene-aurora" />
        <div className="scene-layer scene-city" />
        <div className="scene-layer scene-hangar" />
        <div className="scene-layer scene-floor" />
        <div className="scene-layer scene-fog fog-one" />
        <div className="scene-layer scene-fog fog-two" />
        <div className="scene-layer scene-rays" />
        <div className="scene-motes" aria-hidden="true">
          {motes.map((mote) => <span key={mote} style={{ '--mote': mote }} />)}
        </div>
        <div className="mech-cast">
          {family.map((member) => (
            <MechFigure
              key={member.id}
              member={member}
              selected={activeMember?.id === member.id}
              dancing={dancingMemberId === member.id}
              danceToken={danceToken}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
      <div className="scene-vignette" aria-hidden="true" />
      <div className="scene-grain" aria-hidden="true" />
    </section>
  )
}
