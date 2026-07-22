import { Archive, ArchiveRestore, FileSpreadsheet, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { Store } from '../hooks/useStore'
import { PROJECT_COLOURS } from '../types'
import { downloadClientReport } from '../lib/clientReport'

export function ProjectsPage({ store }: { store: Store }) {
  const [name, setName] = useState('')
  const [rate, setRate] = useState('')
  const { projects, entries } = store
  const sorted = [...projects].sort(
    (a, b) => Number(a.archived) - Number(b.archived) || a.createdAt - b.createdAt,
  )

  const add = () => {
    if (store.addProject(name, Number(rate))) {
      setName('')
      setRate('')
    }
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
          <div className="flex items-center gap-1 rounded-2xl border-2 border-ink bg-white px-4 py-3 sm:w-36">
            <span className="text-ink/50">$</span>
            <input
              type="number"
              min={0}
              step={1}
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && add()}
              placeholder="Rate"
              className="w-full min-w-0 bg-transparent text-lg font-bold outline-none placeholder:text-ink/40"
            />
            <span className="shrink-0 text-sm text-ink/50">/hr</span>
          </div>
          <button
            onClick={add}
            disabled={!name.trim() || !(Number(rate) > 0)}
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
                className={`flex flex-wrap items-center gap-3 rounded-2xl border-2 border-ink p-3 ${
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
                  className="min-w-[6rem] flex-1 bg-transparent font-display text-lg font-bold outline-none"
                />
                <div
                  className={`flex shrink-0 items-center gap-1 rounded-xl border-2 px-2 py-1 ${
                    p.hourlyRate > 0 ? 'border-ink' : 'border-orange'
                  }`}
                  title={p.hourlyRate > 0 ? undefined : 'No rate set yet'}
                >
                  <span className="text-sm text-ink/50">$</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={p.hourlyRate || ''}
                    onChange={(e) => store.updateProject(p.id, { hourlyRate: Number(e.target.value) })}
                    placeholder="0"
                    className="w-14 bg-transparent text-sm font-bold outline-none placeholder:text-orange"
                  />
                  <span className="shrink-0 text-xs text-ink/50">/hr</span>
                </div>
                {p.archived && (
                  <span className="text-xs font-bold uppercase text-ink/50">archived</span>
                )}
                <div className="flex shrink-0 items-center gap-2">
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
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
