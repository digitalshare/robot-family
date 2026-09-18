import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

const AudioCtx = createContext({ muted: false, toggleMute: () => {} })

export function useAudio() {
  return useContext(AudioCtx)
}

export function AudioProvider({ children }) {
  const [muted, setMuted] = useState(() => {
    try { return localStorage.getItem('robot-muted') === 'true' } catch { return false }
  })

  useEffect(() => {
    try { localStorage.setItem('robot-muted', String(muted)) } catch {}
  }, [muted])

  const toggleMute = useCallback(() => setMuted((prev) => !prev), [])

  const audioCtxRef = useRef(null)
  useEffect(() => {
    const unlock = () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
      }
      const ctx = audioCtxRef.current
      if (ctx.state === 'suspended') {
        ctx.resume()
      }
      const buffer = ctx.createBuffer(1, 1, 22050)
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.connect(ctx.destination)
      source.start(0)
    }

    document.addEventListener('click', unlock, { capture: true })
    document.addEventListener('keydown', unlock, { capture: true })

    return () => {
      document.removeEventListener('click', unlock, { capture: true })
      document.removeEventListener('keydown', unlock, { capture: true })
    }
  }, [])

  return <AudioCtx.Provider value={{ muted, toggleMute }}>{children}</AudioCtx.Provider>
}
