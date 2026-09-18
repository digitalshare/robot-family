import { useLayoutEffect, useRef, useState } from 'react'
import useBark from '../hooks/useBark'

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const roleLabels = {
  housecleaning: 'Housecleaning assistant robot',
  'vehicle-repair': 'Vehicle repair robot',
  'knowledge-teacher': 'Knowledge teacher robot',
  constructor: 'Constructor robot',
  'soccer-coach': 'Soccer assistant coach robot',
  'art-assistant': 'Art assistant robot',
  delivery: 'Delivery robot',
}

export default function SpeechBubble({ member, anchorElement, onDismiss, onViewProfile }) {
  const bubbleRef = useRef(null)
  const [placement, setPlacement] = useState({ left: -999, top: -999, tail: 50, below: false, ready: false })
  const [dialogueIndex, setDialogueIndex] = useState(0)
  const [announcement, setAnnouncement] = useState('')
  const dialogueLines = member?.dialogue?.length ? member.dialogue : [member?.intro]
  const dialogue = dialogueLines[dialogueIndex] ?? member?.intro
  useBark(member?.id ?? null)

  useLayoutEffect(() => {
    if (!member || !anchorElement) return undefined

    let frame
    const positionBubble = () => {
      const anchor = anchorElement.getBoundingClientRect()
      const bubble = bubbleRef.current?.getBoundingClientRect()
      if (!bubble) return
      const gutter = 16
      const center = anchor.left + anchor.width / 2
      const left = clamp(center - bubble.width / 2, gutter, window.innerWidth - bubble.width - gutter)
      const useBelow = anchor.top - bubble.height - 18 < gutter
      const top = useBelow
        ? clamp(anchor.bottom + 18, gutter, window.innerHeight - bubble.height - gutter)
        : anchor.top - bubble.height - 18
      setPlacement({
        left,
        top,
        tail: clamp(center - left, 22, bubble.width - 22),
        below: useBelow,
        ready: true,
      })
    }

    frame = requestAnimationFrame(positionBubble)
    window.addEventListener('resize', positionBubble)
    window.addEventListener('orientationchange', positionBubble)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', positionBubble)
      window.removeEventListener('orientationchange', positionBubble)
    }
  }, [member, anchorElement, dialogueIndex])

  if (!member) return null

  const advanceDialogue = () => {
    const nextIndex = (dialogueIndex + 1) % dialogueLines.length
    setDialogueIndex(nextIndex)
    setAnnouncement(`${member.name}, line ${nextIndex + 1} of ${dialogueLines.length}: ${dialogueLines[nextIndex]}`)
  }

  return (
    <section
      className={`speech-bubble ${placement.below ? 'speech-bubble--below' : ''}`}
      id="member-intro"
      ref={bubbleRef}
      data-speech-bubble
      role="dialog"
      aria-modal="false"
      aria-labelledby="bubble-name"
      style={{
        left: placement.left,
        top: placement.top,
        '--tail-x': `${placement.tail}px`,
        visibility: placement.ready ? 'visible' : 'hidden',
      }}
    >
      <button className="bubble-close" type="button" onClick={onDismiss} aria-label="Close conversation">×</button>
      <p className="bubble-kicker">{member.role}</p>
      <h2 id="bubble-name">{member.name}</h2>
      <p className="bubble-role">{roleLabels[member.profile]}</p>
      <button
        className="bubble-dialogue"
        type="button"
        onClick={advanceDialogue}
        aria-label={`Hear another thought from ${member.name}. Conversation line ${dialogueIndex + 1} of ${dialogueLines.length}.`}
      >
        <span className="bubble-dialogue__copy">{dialogue}</span>
        <span className="bubble-dialogue__meta">
          <span>Another thought</span>
          <span>{dialogueIndex + 1} of {dialogueLines.length}</span>
        </span>
      </button>
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</span>
      <div className="bubble-traits" aria-label={`${member.name}'s traits`}>
        {member.traits.map((trait) => <span key={trait}>{trait}</span>)}
      </div>
      <button
        className="bubble-profile"
        type="button"
        onClick={() => onViewProfile?.(member)}
      >
        Profile
      </button>
    </section>
  )
}
