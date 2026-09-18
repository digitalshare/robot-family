import { useCallback, useState } from 'react'

const storageKey = 'robot-family-missions-v1'

function readCompletedMissions() {
  try {
    const stored = localStorage.getItem(storageKey)
    if (!stored) return {}

    const parsed = JSON.parse(stored)
    return parsed?.version === 1 && parsed.completed && typeof parsed.completed === 'object' && !Array.isArray(parsed.completed)
      ? parsed.completed
      : {}
  } catch {
    return {}
  }
}

function saveCompletedMissions(completed) {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ version: 1, completed }))
  } catch {}
}

export default function useMissionProgress(missionId) {
  const [completed, setCompleted] = useState(readCompletedMissions)
  const isComplete = Boolean(completed[missionId])

  const completeMission = useCallback(() => {
    setCompleted((current) => {
      if (current[missionId]) return current

      const next = { ...current, [missionId]: true }
      saveCompletedMissions(next)
      return next
    })
  }, [missionId])

  const resetMission = useCallback(() => {
    setCompleted((current) => {
      if (!current[missionId]) return current

      const next = { ...current }
      delete next[missionId]
      saveCompletedMissions(next)
      return next
    })
  }, [missionId])

  return { isComplete, completeMission, resetMission }
}
