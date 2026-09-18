import { useEffect, useRef } from 'react'
import { useAudio } from '../contexts/AudioContext'

export default function useMusic(profile) {
  const { muted } = useAudio()
  const audioRef = useRef(null)
  const mutedRef = useRef(muted)
  mutedRef.current = muted

  useEffect(() => {
    if (!profile) return undefined

    const audio = new Audio(`/audio/music/${profile}.mp3`)
    audio.loop = true
    audio.volume = 0.35
    audioRef.current = audio

    // If autoplay is blocked (lazy chunk load can outlive the user gesture),
    // start playback on the next interaction instead of failing silently.
    const unlock = () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
      if (audioRef.current === audio && !mutedRef.current) {
        audio.play().catch(() => {})
      }
    }

    const play = () => {
      audio.play().catch((error) => {
        if (error?.name === 'NotAllowedError') {
          window.addEventListener('pointerdown', unlock)
          window.addEventListener('keydown', unlock)
        }
      })
    }

    if (!mutedRef.current) play()

    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
      audio.pause()
      audioRef.current = null
    }
  }, [profile])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (muted) {
      audio.pause()
    } else {
      audio.play().catch(() => {})
    }
  }, [muted])
}
