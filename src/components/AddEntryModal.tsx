import { ChevronDown, X } from 'lucide-react'
import { useState } from 'react'
import type { Project } from '../types'
import { toDateInput } from '../lib/time'

interface AddEntryModalProps {
  projects: Project[]
  defaultProjectId: string
  onAdd: (input: { projectId: string; description: string; date: string; hours: number }) => void
  onClose: () => void
}

export function AddEntryModal({ projects, defaultProjectId, onAdd, onClose }: AddEntryModalProps) {
  const [projectId, setProjectId] = useState(defaultProjectId)
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(() => toDateInput(Date.now()))
  const [hours, setHours] = useState(0.5)

  const canSubmit = projectId && hours > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-4">
      <div className="w-full max-w-md rounded-3xl border-2 border-ink bg-white p-8 shadow-hard">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-black">Add entry</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1 hover:bg-pink-soft">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-1 text-sm text-ink/60">For time worked but never tracked live.</p>

        <label className="mt-5 block text-xs font-bold text-ink/60">
          Project
          <div className="relative mt-1">
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full appearance-none rounded-2xl border-2 border-ink bg-white px-4 py-3 font-bold outline-none focus:bg-pink-soft"
            >
              <option value="">Pick a project…</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.archived ? ' (archived)' : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2" />
          </div>
        </label>

        <label className="mt-4 block text-xs font-bold text-ink/60">
          Description
          <input
            autoFocus
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What was this?"
            className="mt-1 w-full rounded-2xl border-2 border-ink bg-white px-4 py-3 outline-none placeholder:text-ink/40 focus:bg-pink-soft"
          />
        </label>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <label className="text-xs font-bold text-ink/60 sm:flex-1">
            Date
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-2xl border-2 border-ink bg-white px-4 py-3 outline-none focus:bg-pink-soft"
            />
          </label>
          <label className="text-xs font-bold text-ink/60 sm:w-32">
            Hours
            <input
              type="number"
              step={0.25}
              min={0.25}
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="mt-1 w-full rounded-2xl border-2 border-ink bg-white px-4 py-3 outline-none focus:bg-pink-soft"
            />
          </label>
        </div>
        <p className="mt-2 text-xs text-ink/50">Bills in 15 minute blocks, same as tracked time.</p>

        <button
          disabled={!canSubmit}
          onClick={() => {
            onAdd({ projectId, description, date, hours })
            onClose()
          }}
          className="btn-press mt-6 w-full rounded-2xl border-2 border-ink bg-green py-3 font-display text-lg font-black shadow-hard-sm disabled:cursor-not-allowed disabled:opacity-40"
        >
          Add entry
        </button>
      </div>
    </div>
  )
}
