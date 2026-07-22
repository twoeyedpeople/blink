import { Pencil, PencilLine, Trash2, User, X, Zap } from 'lucide-react'
import { useState } from 'react'
import type { Entry, Project } from '../types'
import type { Store } from '../hooks/useStore'
import {
  billedMinutes,
  formatBilled,
  formatDuration,
  formatTime,
  fromDateTimeInputs,
  toDateInput,
  toTimeInput,
} from '../lib/time'

interface EntryRowProps {
  entry: Entry
  project: Project | undefined
  store: Store
}

export function EntryRow({ entry, project, store }: EntryRowProps) {
  const [editing, setEditing] = useState(false)
  const actual = entry.end - entry.start
  const billed = billedMinutes(actual)
  const activeProjects = store.projects.filter((p) => !p.archived || p.id === entry.projectId)

  const moveTime = (date: string, startTime: string, endTime: string) => {
    const start = fromDateTimeInputs(date, startTime)
    let end = fromDateTimeInputs(date, endTime)
    if (start === null || end === null) return
    if (end <= start) end += 24 * 3600_000 // ran past midnight
    store.updateEntry(entry.id, { start, end })
  }

  return (
    <li className="rounded-2xl border-2 border-ink bg-white p-4">
      <div className="flex items-start gap-3">
        <span
          className="mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-ink"
          style={{ backgroundColor: project?.colour ?? '#ccc' }}
          title={project?.name}
        />
        <div className="min-w-0 flex-1">
          <input
            value={entry.description}
            onChange={(e) => store.updateEntry(entry.id, { description: e.target.value })}
            placeholder="What was this?"
            className="w-full bg-transparent font-medium outline-none placeholder:text-ink/35"
          />
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-ink/55">
            <span className="font-bold" style={{ color: project?.colour }}>
              {project?.name ?? 'No project'}
            </span>
            <span>
              {formatTime(entry.start)} – {formatTime(entry.end)}
            </span>
            {entry.autoStopped && (
              <span className="inline-flex items-center gap-1 rounded-full bg-pink-soft px-2 py-0.5 text-xs font-bold text-magenta">
                <Zap className="h-3 w-3" /> auto-stopped
              </span>
            )}
            {entry.manual && (
              <span className="inline-flex items-center gap-1 rounded-full bg-pink-soft px-2 py-0.5 text-xs font-bold text-blue">
                <PencilLine className="h-3 w-3" /> manual
              </span>
            )}
            {entry.loggedBy && (
              <span className="inline-flex items-center gap-1 rounded-full bg-ink/5 px-2 py-0.5 text-xs font-bold text-ink/70">
                <User className="h-3 w-3" /> {entry.loggedBy}
              </span>
            )}
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-xl font-black leading-none">{formatBilled(billed)}</p>
          <p className="mt-1 text-xs text-ink/50">{formatDuration(actual)} actual</p>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className="rounded-full border-2 border-ink p-2 hover:bg-pink-soft"
          aria-label={editing ? 'Close editor' : 'Edit entry'}
        >
          {editing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
        </button>
      </div>

      {editing && (
        <div className="mt-4 border-t-2 border-ink/10 pt-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <label className="text-xs font-bold text-ink/60">
              Project
              <select
                value={entry.projectId}
                onChange={(e) => store.updateEntry(entry.id, { projectId: e.target.value })}
                className="mt-1 w-full rounded-xl border-2 border-ink bg-white px-3 py-2 text-sm font-bold outline-none"
              >
                {activeProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-bold text-ink/60">
              Date
              <input
                type="date"
                value={toDateInput(entry.start)}
                onChange={(e) => moveTime(e.target.value, toTimeInput(entry.start), toTimeInput(entry.end))}
                className="mt-1 w-full rounded-xl border-2 border-ink bg-white px-3 py-2 text-sm outline-none"
              />
            </label>
            <label className="text-xs font-bold text-ink/60">
              Start
              <input
                type="time"
                value={toTimeInput(entry.start)}
                onChange={(e) => moveTime(toDateInput(entry.start), e.target.value, toTimeInput(entry.end))}
                className="mt-1 w-full rounded-xl border-2 border-ink bg-white px-3 py-2 text-sm outline-none"
              />
            </label>
            <label className="text-xs font-bold text-ink/60">
              End
              <input
                type="time"
                value={toTimeInput(entry.end)}
                onChange={(e) => moveTime(toDateInput(entry.start), toTimeInput(entry.start), e.target.value)}
                className="mt-1 w-full rounded-xl border-2 border-ink bg-white px-3 py-2 text-sm outline-none"
              />
            </label>
          </div>

          <div className="mt-3 flex items-end gap-3">
            <label className="flex-1 text-xs font-bold text-ink/60">
              Logged by
              <input
                value={entry.loggedBy ?? ''}
                onChange={(e) => store.updateEntry(entry.id, { loggedBy: e.target.value })}
                placeholder="Name"
                className="mt-1 w-full rounded-xl border-2 border-ink bg-white px-3 py-2 text-sm outline-none placeholder:text-ink/35"
              />
            </label>
            <button
              onClick={() => {
                if (confirm('Delete this entry? This cannot be undone.')) {
                  store.deleteEntry(entry.id)
                }
              }}
              aria-label="Delete entry"
              title="Delete entry"
              className="shrink-0 rounded-full border-2 border-ink bg-white p-2 text-magenta hover:bg-pink-soft"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </li>
  )
}
