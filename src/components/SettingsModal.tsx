import { X } from 'lucide-react'
import { useState } from 'react'

interface SettingsModalProps {
  name: string
  required?: boolean
  onSave: (name: string) => void
  onClose: () => void
}

export function SettingsModal({ name, required, onSave, onClose }: SettingsModalProps) {
  const [value, setValue] = useState(name)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-4">
      <div className="w-full max-w-md rounded-3xl border-2 border-ink bg-white p-8 shadow-hard">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-black">Settings</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1 hover:bg-pink-soft">
            <X className="h-5 w-5" />
          </button>
        </div>
        {required && (
          <p className="mt-3 rounded-xl bg-pink-soft px-3 py-2 text-sm font-bold text-magenta">
            Add your name before logging time.
          </p>
        )}

        <label className="mt-6 block text-sm font-bold text-ink/60">
          Your name
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSave(value.trim())}
            placeholder="e.g. Dave"
            className="mt-2 w-full rounded-2xl border-2 border-ink bg-white px-4 py-3 text-lg font-medium outline-none placeholder:text-ink/40 focus:bg-pink-soft"
          />
        </label>
        <p className="mt-2 text-xs text-ink/50">
          Recorded against every entry you track, so the team can see who logged what.
        </p>

        <button
          onClick={() => onSave(value.trim())}
          className="btn-press mt-6 w-full rounded-2xl border-2 border-ink bg-green py-3 font-display text-lg font-black shadow-hard-sm"
        >
          Save
        </button>
      </div>
    </div>
  )
}
