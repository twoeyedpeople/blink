import { ChevronDown, Plus, Square } from 'lucide-react'
import { useCallback, useState } from 'react'
import type { Store } from '../hooks/useStore'
import { billedMinutes, formatBilled, formatClock, formatTime } from '../lib/time'
import { load, save } from '../lib/storage'
import { randomStartPhrase } from '../lib/startPhrases'
import { useFitText } from '../hooks/useFitText'
import { AddEntryModal } from './AddEntryModal'
import { Toast } from './Toast'

interface TimerCardProps {
  store: Store
  now: number
  onNavigate: (route: string) => void
  userName: string
  onRequireName: () => void
}

export function TimerCard({ store, now, onNavigate, userName, onRequireName }: TimerCardProps) {
  const { projects, running, start, stop, updateRunning } = store
  const active = projects.filter((p) => !p.archived)
  const [projectId, setProjectId] = useState(() => {
    const lastId = load('lastProjectId', '')
    return active.some((p) => p.id === lastId) ? lastId : ''
  })
  const [description, setDescription] = useState('')
  const [adding, setAdding] = useState(false)
  const [savedToast, setSavedToast] = useState(false)
  const [startLabel] = useState(randomStartPhrase)
  const {
    ref: startTextRef,
    fontSize: startFontSize,
    wrap: startWraps,
  } = useFitText(startLabel, 72, 28, { wrapBelowPx: 640, wrapFontPx: 40 })

  const pickProject = (id: string) => {
    setProjectId(id)
    save('lastProjectId', id || null)
  }

  const dismissToast = useCallback(() => setSavedToast(false), [])

  const runningProject = running ? projects.find((p) => p.id === running.projectId) : null
  const elapsed = running ? now - running.start : 0

  if (projects.length === 0) {
    return (
      <section className="rounded-3xl border-2 border-ink bg-white p-8 text-center shadow-hard">
        <h2 className="font-display text-2xl font-black">No projects yet</h2>
        <p className="mt-2 text-ink/60">Add a project first, then get going.</p>
        <button
          onClick={() => onNavigate('/projects')}
          className="btn-press mt-6 rounded-full border-2 border-ink bg-blue px-8 py-3 font-display text-lg font-black text-white shadow-hard-sm"
        >
          ADD A PROJECT
        </button>
      </section>
    )
  }

  if (running) {
    return (
      <section className="rounded-3xl border-2 border-ink bg-white p-6 shadow-hard sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <span
            className="inline-flex items-center gap-2 rounded-full border-2 border-ink px-4 py-1.5 font-display text-sm font-bold text-white"
            style={{ backgroundColor: runningProject?.colour ?? '#111' }}
          >
            <span className="pulse-dot h-2.5 w-2.5 rounded-full bg-white" />
            {runningProject?.name ?? 'Unknown project'}
          </span>
          <span className="text-sm text-ink/60">started {formatTime(running.start)}</span>
        </div>

        <p className="mt-8 w-full text-center font-display text-6xl font-black tabular-nums sm:text-7xl">
          {formatClock(elapsed)}
        </p>
        <p className="mt-2 text-center text-sm font-medium text-ink/60">
          bills as {formatBilled(billedMinutes(Math.max(elapsed, 1)))}
        </p>
        {elapsed > 8 * 3600_000 && (
          <p className="mt-2 text-center text-sm font-bold text-magenta">
            Been going a while. If you forgot to stop, the record is editable afterwards.
          </p>
        )}

        <input
          value={running.description}
          onChange={(e) => updateRunning({ description: e.target.value })}
          placeholder="Describe what you're working on"
          className="mt-8 w-full rounded-2xl border-2 border-ink bg-pink-soft px-5 py-4 text-base outline-none sm:text-lg placeholder:text-ink/40 focus:bg-white"
        />

        <button
          onClick={() => {
            const result = stop()
            if (!result.saved) {
              alert('That was under a minute, so it was not saved. Gone in a tick.')
            }
          }}
          className="btn-press mt-5 flex w-full items-center justify-center gap-3 rounded-3xl border-2 border-ink bg-orange py-8 font-display text-5xl font-black text-white shadow-hard"
        >
          <Square className="h-9 w-9 fill-current" />
          STOP
        </button>
      </section>
    )
  }

  return (
    <section className="rounded-3xl border-2 border-ink bg-white p-6 shadow-hard sm:p-8">
      <div className="relative">
        <select
          value={projectId}
          onChange={(e) => pickProject(e.target.value)}
          className="w-full appearance-none rounded-2xl border-2 border-ink bg-white px-5 py-4 font-display text-lg font-bold outline-none focus:bg-pink-soft"
        >
          <option value="">Pick a project…</option>
          {active.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2" />
      </div>

      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe what you're working on"
        className="mt-4 w-full rounded-2xl border-2 border-ink bg-white px-5 py-4 text-base outline-none sm:text-lg placeholder:text-ink/40 focus:bg-pink-soft"
      />

      <button
        disabled={!projectId}
        onClick={() => {
          if (!userName) {
            onRequireName()
            return
          }
          start(projectId, description, userName)
          setDescription('')
        }}
        className="btn-press mt-5 w-full overflow-hidden rounded-3xl border-2 border-ink bg-green py-10 shadow-hard disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span
          ref={startTextRef}
          style={{ fontSize: `${startFontSize}px` }}
          className={`block px-4 font-display font-black leading-tight ${
            startWraps ? 'whitespace-normal text-center' : 'whitespace-nowrap'
          }`}
        >
          {startLabel}
        </span>
      </button>
      <p className="mt-4 text-center text-xs font-medium text-ink/50">
        <span className="block sm:inline">Minimum billing unit is 15 minutes.</span>{' '}
        <span className="block sm:inline">Time rounds up.</span>
      </p>

      <button
        onClick={() => {
          if (!userName) {
            onRequireName()
            return
          }
          setAdding(true)
        }}
        className="btn-press mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-orange py-3 font-display text-sm font-bold text-white shadow-hard-sm hover:brightness-95"
      >
        <Plus className="h-4 w-4" /> Add Manual Entry
      </button>

      {adding && (
        <AddEntryModal
          projects={projects}
          defaultProjectId={projectId}
          onAdd={(input) => {
            store.addManualEntry({ ...input, loggedBy: userName })
            setSavedToast(true)
          }}
          onClose={() => setAdding(false)}
        />
      )}

      {savedToast && <Toast message="Record saved" onDone={dismissToast} />}
    </section>
  )
}
