import { useCallback, useState } from 'react'

const storageKey = 'robot-family-scrapbook-v1'
const maxSnapshotLength = 500000

function isRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
}

function readScrapbook() {
  try {
    const stored = localStorage.getItem(storageKey)
    if (!stored) return { badges: {}, snapshots: {} }

    const parsed = JSON.parse(stored)
    if (parsed?.version !== 1) return { badges: {}, snapshots: {} }

    const badges = isRecord(parsed.badges) ? parsed.badges : {}
    const snapshots = isRecord(parsed.snapshots)
      ? Object.fromEntries(Object.entries(parsed.snapshots).filter(([, snapshot]) => (
        typeof snapshot === 'string'
        && snapshot.startsWith('data:image/jpeg;base64,')
        && snapshot.length <= maxSnapshotLength
      )))
      : {}

    return { badges, snapshots }
  } catch {
    return { badges: {}, snapshots: {} }
  }
}

function saveScrapbook(scrapbook) {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ version: 1, ...scrapbook }))
  } catch {}
}

export default function useScrapbook(memberId) {
  const [scrapbook, setScrapbook] = useState(readScrapbook)
  const hasBadge = Boolean(memberId && scrapbook.badges[memberId])
  const snapshot = memberId ? scrapbook.snapshots[memberId] : null

  const collectBadge = useCallback(() => {
    if (!memberId) return

    setScrapbook((current) => {
      if (current.badges[memberId]) return current

      const next = { ...current, badges: { ...current.badges, [memberId]: true } }
      saveScrapbook(next)
      return next
    })
  }, [memberId])

  const saveSnapshot = useCallback((nextSnapshot) => {
    if (
      !memberId
      || typeof nextSnapshot !== 'string'
      || !nextSnapshot.startsWith('data:image/jpeg;base64,')
      || nextSnapshot.length > maxSnapshotLength
    ) return false

    setScrapbook((current) => {
      if (current.snapshots[memberId] === nextSnapshot) return current

      const next = { ...current, snapshots: { ...current.snapshots, [memberId]: nextSnapshot } }
      saveScrapbook(next)
      return next
    })
    return true
  }, [memberId])

  const removeSnapshot = useCallback((targetMemberId = memberId) => {
    if (!targetMemberId) return

    setScrapbook((current) => {
      if (!current.snapshots[targetMemberId]) return current

      const snapshots = { ...current.snapshots }
      delete snapshots[targetMemberId]
      const next = { ...current, snapshots }
      saveScrapbook(next)
      return next
    })
  }, [memberId])

  return { badges: scrapbook.badges, snapshots: scrapbook.snapshots, hasBadge, snapshot, collectBadge, saveSnapshot, removeSnapshot }
}
