import { CloudOff, RefreshCw, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Header } from './components/Header'
import { TimerCard } from './components/TimerCard'
import { HistoryList } from './components/HistoryList'
import { SettingsModal } from './components/SettingsModal'
import { ProjectsPage } from './pages/ProjectsPage'
import { ClientView } from './pages/ClientView'
import { useStore } from './hooks/useStore'
import { useIdleGuard } from './hooks/useIdleGuard'
import { useCloudSync } from './hooks/useCloudSync'
import { usePublishClientViews } from './hooks/usePublishClientViews'
import { useUserName } from './hooks/useUserName'
import { formatTime } from './lib/time'

function currentRoute() {
  return window.location.hash.replace('#', '') || '/'
}

const SYNC_LABEL = {
  connecting: 'Connecting…',
  synced: 'Synced',
  saving: 'Saving…',
  offline: 'Offline — saved on this device only',
}

// Thin router: a client-facing /client/{shareId} link needs none of the
// internal app's machinery (store, idle guard, cloud sync), so it's kept as
// a fully separate component rather than an early return inside MainApp,
// which would change how many hooks run between renders on the same route.
export default function App() {
  const [route, setRoute] = useState(currentRoute)

  useEffect(() => {
    const onHash = () => setRoute(currentRoute())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  if (route.startsWith('/client/')) {
    return <ClientView shareId={route.slice('/client/'.length)} />
  }

  return <MainApp route={route} setRoute={setRoute} />
}

function MainApp({ route, setRoute }: { route: string; setRoute: (r: string) => void }) {
  const store = useStore()
  const { now, notice, dismissNotice, recovery, resolveRecovery } = useIdleGuard(store)
  const syncStatus = useCloudSync(store)
  usePublishClientViews(store)
  const [userName, setUserName] = useUserName()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsRequired, setSettingsRequired] = useState(false)

  const openSettings = (required = false) => {
    setSettingsRequired(required)
    setSettingsOpen(true)
  }

  useEffect(() => {
    document.title = store.running ? '⏱ Blink — tracking' : 'Blink'
  }, [store.running])

  const navigate = (r: string) => {
    window.location.hash = r === '/' ? '' : r
    setRoute(r)
  }

  const reasonText =
    notice?.reason === 'locked'
      ? 'the screen locked'
      : notice?.reason === 'idle'
        ? 'you went idle'
        : 'the machine went to sleep or Blink was closed'

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 pb-16">
      <Header
        route={route}
        onNavigate={navigate}
        onOpenSettings={() => openSettings(false)}
        hasName={!!userName}
      />

      {notice && (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border-2 border-ink bg-magenta px-5 py-3 text-white shadow-hard-sm">
          <p className="text-sm font-bold">
            Timer auto-stopped at {formatTime(notice.stoppedAt)} because {reasonText}. Check
            Billings if it needs a tidy-up.
          </p>
          <button onClick={dismissNotice} aria-label="Dismiss" className="shrink-0">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {route === '/projects' ? (
        <ProjectsPage store={store} />
      ) : route === '/history' ? (
        <HistoryList store={store} />
      ) : (
        <TimerCard
          store={store}
          now={now}
          onNavigate={navigate}
          userName={userName}
          onRequireName={() => openSettings(true)}
        />
      )}

      {recovery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-4">
          <div className="w-full max-w-md rounded-3xl border-2 border-ink bg-white p-8 shadow-hard">
            <h2 className="font-display text-2xl font-black">Timer was left running</h2>
            <p className="mt-3 text-ink/70">
              Blink was closed while a timer was going. Last sign of life was{' '}
              <strong>{formatTime(recovery.lastSeen)}</strong>. Stop it back there, or keep it
              running?
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => resolveRecovery(false)}
                className="btn-press flex-1 rounded-2xl border-2 border-ink bg-orange py-3 font-display font-black text-white shadow-hard-sm"
              >
                Stop at {formatTime(recovery.lastSeen)}
              </button>
              <button
                onClick={() => resolveRecovery(true)}
                className="btn-press flex-1 rounded-2xl border-2 border-ink bg-white py-3 font-display font-black shadow-hard-sm"
              >
                Keep running
              </button>
            </div>
          </div>
        </div>
      )}

      {settingsOpen && (
        <SettingsModal
          name={userName}
          required={settingsRequired}
          prefs={store.prefs}
          onUpdatePrefs={store.setPrefs}
          onSave={(n) => {
            setUserName(n)
            setSettingsOpen(false)
          }}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      <footer className="mt-12 flex flex-wrap items-center justify-center gap-2 text-xs text-ink/40">
        <span>© Two-Eyed People Pty Ltd</span>
        <span aria-hidden>|</span>
        <span>Blink: One eye on the time</span>
        <span aria-hidden>|</span>
        <span className="inline-flex items-center gap-1">
          {syncStatus === 'offline' ? (
            <CloudOff className="h-3 w-3" />
          ) : (
            <RefreshCw className={`h-3 w-3 ${syncStatus === 'saving' ? 'animate-spin' : ''}`} />
          )}
          {SYNC_LABEL[syncStatus]}
        </span>
      </footer>
    </div>
  )
}
