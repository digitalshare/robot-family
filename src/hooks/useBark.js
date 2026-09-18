import { useEffect, useRef } from 'react'
import { useAudio } from '../contexts/AudioContext'

export default function useBark(memberId) {
  const { muted } = useAudio()
  const audioRef = useRef(null)

  useEffect(() => {
    if (!memberId || muted) return undefined

    const audio = new Audio(`/audio/barks/${memberId}.wav`)
    audio.volume = 0.8
    audioRef.current = audio

    audio.play().catch(() => {})

    return () => {
      audio.pause()
      audio.currentTime = 0
      audioRef.current = null
    }
  }, [memberId, muted])
}
