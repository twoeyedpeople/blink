import { Archive, ArchiveRestore, ChevronDown, FileSpreadsheet, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { Store } from '../hooks/useStore'
import { PROJECT_COLOURS } from '../types'
import { downloadClientReport } from '../lib/clientReport'

export function ProjectsPage({ store }: { store: Store }) {
  const [name, setName] = useState('')
  const { projects, entries, prefs, setPrefs } = store
  const sorted = [...projects].sort(
    (a, b) => Number(a.archived) - Number(b.archived) || a.createdAt - b.createdAt,
  )

  const add = () => {
    if (store.addProject(name)) setName('')
  }

  const cycleColour = (id: string, colour: string) => {
    const next = PROJECT_COLOURS[(PROJECT_COLOURS.indexOf(colour) + 1) % PROJECT_COLOURS.length]
    store.updateProject(id, { colour: next })
  }

  const remove = (id: string) => {
    if (entries.some((e) => e.projectId === id)) {
      alert('This project has tracked time against it. Archive it instead, so the history stays intact.')
      return
    }
    if (confirm('Delete this project?')) store.deleteProject(id)
  }

  const enableSmartIdle = async () => {
    if (!window.IdleDetector) {
      alert('Smart idle detection needs Chrome or Edge. The sleep guard still works everywhere.')
      return
    }
    const permission = await window.IdleDetector.requestPermission()
    if (permission === 'granted') {
      setPrefs({ ...prefs, smartIdle: true })
    } else {
      alert('Permission was not granted, so smart idle stays off.')
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border-2 border-ink bg-white p-6 shadow-hard sm:p-8">
        <h2 className="font-display text-2xl font-black">Projects</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="New project name…"
            className="min-w-0 flex-1 rounded-2xl border-2 border-ink bg-white px-5 py-3 text-lg outline-none placeholder:text-ink/40 focus:bg-pink-soft"
          />
          <button
            onClick={add}
            disabled={!name.trim()}
            className="btn-press flex items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-green px-6 py-3 font-display text-lg font-black shadow-hard-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-5 w-5" /> ADD
          </button>
        </div>

        {sorted.length === 0 ? (
          <p className="mt-6 text-ink/50">No projects yet. Add the first one above.</p>
        ) : (
          <ul className="mt-6 space-y-2">
            {sorted.map((p) => (
              <li
                key={p.id}
                className={`flex items-center gap-3 rounded-2xl border-2 border-ink p-3 ${
                  p.archived ? 'bg-ink/5 opacity-60' : 'bg-white'
                }`}
              >
                <button
                  onClick={() => cycleColour(p.id, p.colour)}
                  className="h-7 w-7 shrink-0 rounded-full border-2 border-ink"
                  style={{ backgroundColor: p.colour }}
                  title="Click to change colour"
                />
                <input
                  value={p.name}
                  onChange={(e) => store.updateProject(p.id, { name: e.target.value })}
                  className="min-w-0 flex-1 bg-transparent font-display text-lg font-bold outline-none"
                />
                {p.archived && (
                  <span className="text-xs font-bold uppercase text-ink/50">archived</span>
                )}
                <button
                  onClick={() => downloadClientReport(p, entries)}
                  className="rounded-full border-2 border-ink p-2 hover:bg-pink-soft"
                  title="Download client report (XLSX)"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                </button>
                <button
                  onClick={() => store.updateProject(p.id, { archived: !p.archived })}
                  className="rounded-full border-2 border-ink p-2 hover:bg-pink-soft"
                  title={p.archived ? 'Restore' : 'Archive'}
                >
                  {p.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => remove(p.id)}
                  className="rounded-full border-2 border-ink p-2 text-magenta hover:bg-pink-soft"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-3xl border-2 border-ink bg-white p-6 shadow-hard sm:p-8">
        <h2 className="font-display text-2xl font-black">Idle detection</h2>
        <p className="mt-2 text-sm text-ink/60">
          If the machine goes to sleep or the lid closes, Blink always stops the timer at the
          moment activity ended. Smart idle detection (Chrome and Edge only) also catches you
          wandering off while the machine stays awake.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <label className="text-sm font-bold">
            Consider me idle after
            <span className="relative ml-2 inline-block">
              <select
                value={prefs.idleMinutes}
                onChange={(e) => setPrefs({ ...prefs, idleMinutes: Number(e.target.value) })}
                className="appearance-none rounded-xl border-2 border-ink bg-white py-2 pl-3 pr-8 text-sm font-bold outline-none"
              >
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2" />
            </span>
          </label>
          {prefs.smartIdle ? (
            <button
              onClick={() => setPrefs({ ...prefs, smartIdle: false })}
              className="rounded-full border-2 border-ink bg-green px-4 py-2 text-sm font-bold"
            >
              Smart idle: ON (click to disable)
            </button>
          ) : (
            <button
              onClick={enableSmartIdle}
              className="rounded-full border-2 border-ink bg-white px-4 py-2 text-sm font-bold hover:bg-pink-soft"
            >
              Enable smart idle detection
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
