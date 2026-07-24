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

const DASHBOARD_SESSION_KEY = 'blink_dashboard_unlocked'

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

  const dashboardPassword = (
    (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
      ?.VITE_DASHBOARD_PASSWORD ?? ''
  ).trim()
  const dashboardGateEnabled = dashboardPassword.length > 0
  const [dashboardPasswordInput, setDashboardPasswordInput] = useState('')
  const [dashboardPasswordError, setDashboardPasswordError] = useState('')
  const [isDashboardUnlocked, setIsDashboardUnlocked] = useState(
    () => window.sessionStorage.getItem(DASHBOARD_SESSION_KEY) === 'true',
  )

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

  if (dashboardGateEnabled && !isDashboardUnlocked) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl border-2 border-ink bg-white p-8 shadow-hard">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-ink bg-white shadow-hard-sm">
              <img src="/Icon.png" alt="" className="h-[22px] w-[22px]" />
            </div>
            <h1 className="font-serif text-2xl leading-none">Blink</h1>
          </div>

          <h2 className="mt-6 font-display text-3xl font-black">
            Halt! Turn back, or present the sacred key.
          </h2>
          <div className="mt-3 flex flex-col gap-3 text-sm text-ink/60">
            <p>
              Behind this lock sits a collection of secret thingies, mysterious projects and
              ongoing Two-Eyed People experiments.
            </p>
            <p>Some of it is real. Some of it is… less explainable.</p>
            <p className="font-black uppercase tracking-[0.14em] text-ink/80">
              Enter at your own risk.
            </p>
          </div>

          <form
            className="mt-6 flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (dashboardPasswordInput === dashboardPassword) {
                window.sessionStorage.setItem(DASHBOARD_SESSION_KEY, 'true')
                setIsDashboardUnlocked(true)
                setDashboardPasswordError('')
                setDashboardPasswordInput('')
                return
              }
              setDashboardPasswordError('That password did not match.')
            }}
          >
            <div className="flex flex-col gap-1.5">
              <input
                autoFocus
                type="password"
                value={dashboardPasswordInput}
                onChange={(e) => {
                  setDashboardPasswordInput(e.target.value)
                  if (dashboardPasswordError) setDashboardPasswordError('')
                }}
                placeholder="Enter password"
                className="w-full rounded-2xl border-2 border-ink bg-white px-5 py-4 text-sm font-bold outline-none placeholder:text-ink/40 focus:bg-pink-soft"
              />
              {dashboardPasswordError && (
                <p className="text-sm font-medium text-magenta">{dashboardPasswordError}</p>
              )}
            </div>

            <button
              type="submit"
              className="btn-press rounded-2xl border-2 border-ink bg-green py-4 font-display text-sm font-black shadow-hard-sm"
            >
              Unlock Portal
            </button>
          </form>
        </div>

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
