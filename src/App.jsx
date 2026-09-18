import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import CinematicStage from './components/CinematicStage'
import SpeechBubble from './components/SpeechBubble'
import StageErrorBoundary from './components/StageErrorBoundary'
import { AudioProvider, useAudio } from './contexts/AudioContext'
import { family } from './data/family'

// React lazy caches rejected imports, so a single failed chunk fetch would
// permanently break the view until a full page reload — retry instead.
function retryImport(load, attempts = 3) {
  return load().catch((error) => {
    if (attempts <= 1) throw error
    return new Promise((resolve) => setTimeout(resolve, 300)).then(() => retryImport(load, attempts - 1))
  })
}

const ThreeStage = lazy(() => retryImport(() => import('./components/ThreeStage')))
const ProfileStage = lazy(() => retryImport(() => import('./components/ProfileStage')))
const Scrapbook = lazy(() => retryImport(() => import('./components/Scrapbook')))

function MuteButton() {
  const { muted, toggleMute } = useAudio()
  return (
    <button
      className="mute-button"
      type="button"
      onClick={toggleMute}
      aria-label={muted ? 'Unmute audio' : 'Mute audio'}
      aria-pressed={muted}
    >
      {muted ? (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      ) : (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      )}
    </button>
  )
}

function ScrapbookButton({ onOpen }) {
  return <button type="button" className="scrapbook-link" onClick={onOpen}>Scrapbook</button>
}

function parsePath(pathname) {
  if (pathname.startsWith('/profile/')) {
    const id = pathname.slice('/profile/'.length)
    return { view: 'profile', id }
  }
  if (pathname === '/scrapbook') return { view: 'scrapbook' }
  return { view: pathname === '/3d' ? '3d' : 'cinematic' }
}

function findMember(id) {
  return family.find((member) => member.id === id) ?? null
}

function SceneLoading() {
  return <div className="scene-loading" role="status" aria-live="polite"><span className="scene-loading__label">Booting 3D hangar</span></div>
}

function ProfileLoading() {
  return <div className="scene-loading" role="status" aria-live="polite"><span className="scene-loading__label">Entering robot room</span></div>
}

function ScrapbookLoading() {
  return <div className="scene-loading" role="status" aria-live="polite"><span className="scene-loading__label">Opening hangar scrapbook</span></div>
}

export default function App() {
  return (
    <AudioProvider>
      <AppInner />
    </AudioProvider>
  )
}

function AppInner() {
  const [path, setPath] = useState(() => parsePath(window.location.pathname))
  const [activeMember, setActiveMember] = useState(null)
  const [anchorElement, setAnchorElement] = useState(null)
  const lastTriggerRef = useRef(null)
  const previousSceneRef = useRef('cinematic')

  const dismissIntroduction = useCallback(() => {
    const trigger = lastTriggerRef.current
    setActiveMember(null)
    setAnchorElement(null)
    requestAnimationFrame(() => trigger?.focus())
  }, [])

  const selectMember = useCallback((member, triggerElement) => {
    const trigger = triggerElement ?? document.querySelector(`[data-robot-id="${member.id}"]`)

    if (activeMember?.id === member.id) {
      dismissIntroduction()
      return
    }

    lastTriggerRef.current = trigger
    setAnchorElement(trigger)
    setActiveMember(member)
  }, [activeMember, dismissIntroduction])

  const viewProfile = useCallback((member) => {
    previousSceneRef.current = path.view === '3d' ? '3d' : 'cinematic'
    window.history.pushState({}, '', `/profile/${member.id}`)
    lastTriggerRef.current = null
    setActiveMember(null)
    setAnchorElement(null)
    setPath({ view: 'profile', id: member.id })
  }, [path.view])

  const backToScene = useCallback((scene) => {
    const href = `/${scene}`
    window.history.pushState({}, '', href)
    lastTriggerRef.current = null
    setActiveMember(null)
    setAnchorElement(null)
    setPath({ view: scene })
  }, [])

  const viewScrapbook = useCallback(() => {
    if (path.view === 'cinematic' || path.view === '3d') previousSceneRef.current = path.view

    window.history.pushState({}, '', '/scrapbook')
    lastTriggerRef.current = null
    setActiveMember(null)
    setAnchorElement(null)
    setPath({ view: 'scrapbook' })
  }, [path.view])

  const switchStage = useCallback((event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

    const nextStage = event.currentTarget.dataset.stage
    if (!nextStage) return

    event.preventDefault()
    if (nextStage === path.view) return

    window.history.pushState({}, '', event.currentTarget.href)
    lastTriggerRef.current = null
    setActiveMember(null)
    setAnchorElement(null)
    setPath({ view: nextStage })
  }, [path.view])

  useEffect(() => {
    const syncPath = () => {
      lastTriggerRef.current = null
      setActiveMember(null)
      setAnchorElement(null)
      setPath(parsePath(window.location.pathname))
    }

    window.addEventListener('popstate', syncPath)
    return () => window.removeEventListener('popstate', syncPath)
  }, [])

  useEffect(() => {
    if (!activeMember) return undefined

    const dismissOnEscape = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        dismissIntroduction()
      }
    }

    window.addEventListener('keydown', dismissOnEscape)
    return () => window.removeEventListener('keydown', dismissOnEscape)
  }, [activeMember, dismissIntroduction])

  if (path.view === 'scrapbook') {
    return (
      <main className="scene-app">
        <h1 className="sr-only">The Robot Family</h1>
        <MuteButton />
        <StageErrorBoundary key="scrapbook" fallback={<div className="profile-error"><p>Could not open the hangar scrapbook.</p><button type="button" onClick={() => backToScene(previousSceneRef.current)}>Back to family</button></div>}>
          <Suspense fallback={<ScrapbookLoading />}>
            <Scrapbook onBack={() => backToScene(previousSceneRef.current)} />
          </Suspense>
        </StageErrorBoundary>
      </main>
    )
  }

  if (path.view === 'profile') {
    const member = findMember(path.id)
    if (!member) {
      return (
        <main className="scene-app">
          <h1 className="sr-only">The Robot Family</h1>
          <div className="profile-error">
            <p>Robot not found.</p>
            <button type="button" onClick={() => backToScene(previousSceneRef.current)}>Back to family</button>
          </div>
        </main>
      )
    }

    return (
      <main className="scene-app">
        <h1 className="sr-only">The Robot Family</h1>
        <MuteButton />
        <nav className="scene-switcher" aria-label="Choose scene style">
          <a href="/cinematic" data-stage="cinematic" aria-current={undefined} onClick={switchStage}>2.5D</a>
          <a href="/3d" data-stage="3d" aria-current={undefined} onClick={switchStage}>3D</a>
        </nav>
        <ScrapbookButton onOpen={viewScrapbook} />
        <StageErrorBoundary key={`profile-${member.id}`} fallback={<div className="profile-error"><p>Could not load the 3D room.</p><button type="button" onClick={() => backToScene(previousSceneRef.current)}>Back to family</button></div>}>
          <Suspense fallback={<ProfileLoading />}>
            <ProfileStage member={member} onBack={() => backToScene(previousSceneRef.current)} />
          </Suspense>
        </StageErrorBoundary>
      </main>
    )
  }

  return (
    <main className="scene-app">
      <h1 className="sr-only">The Robot Family</h1>
      <MuteButton />
      <nav className="scene-switcher" aria-label="Choose scene style">
        <a href="/cinematic" data-stage="cinematic" aria-current={path.view === 'cinematic' ? 'page' : undefined} onClick={switchStage}>2.5D</a>
        <a href="/3d" data-stage="3d" aria-current={path.view === '3d' ? 'page' : undefined} onClick={switchStage}>3D</a>
      </nav>
      <ScrapbookButton onOpen={viewScrapbook} />

      {path.view === '3d' ? (
        <StageErrorBoundary key="three-scene" fallback={<CinematicStage activeMember={activeMember} onSelect={selectMember} onDismiss={dismissIntroduction} />}>
          <Suspense fallback={<SceneLoading />}>
            <ThreeStage activeMember={activeMember} onSelect={selectMember} onDismiss={dismissIntroduction} />
          </Suspense>
        </StageErrorBoundary>
      ) : (
        <CinematicStage activeMember={activeMember} onSelect={selectMember} onDismiss={dismissIntroduction} />
      )}

      {activeMember && anchorElement && (
        <SpeechBubble
          key={activeMember.id}
          member={activeMember}
          anchorElement={anchorElement}
          onDismiss={dismissIntroduction}
          onViewProfile={viewProfile}
        />
      )}
    </main>
  )
}

