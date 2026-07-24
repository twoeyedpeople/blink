import { ChevronDown, X } from 'lucide-react'
import { useState } from 'react'
import type { Prefs } from '../types'

interface SettingsModalProps {
  name: string
  required?: boolean
  prefs: Prefs
  onUpdatePrefs: (prefs: Prefs) => void
  onSave: (name: string) => void
  onClose: () => void
}

export function SettingsModal({
  name,
  required,
  prefs,
  onUpdatePrefs,
  onSave,
  onClose,
}: SettingsModalProps) {
  const [value, setValue] = useState(name)

  const enableSmartIdle = async () => {
    if (!window.IdleDetector) {
      alert('Smart idle detection needs Chrome or Edge. The sleep guard still works everywhere.')
      return
    }
    const permission = await window.IdleDetector.requestPermission()
    if (permission === 'granted') {
      onUpdatePrefs({ ...prefs, smartIdle: true })
    } else {
      alert('Permission was not granted, so smart idle stays off.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border-2 border-ink bg-white p-8 shadow-hard">
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

        <div className="mt-8 border-t-2 border-ink/10 pt-6">
          <h3 className="font-display text-lg font-black">Idle detection</h3>
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
                  onChange={(e) => onUpdatePrefs({ ...prefs, idleMinutes: Number(e.target.value) })}
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
                onClick={() => onUpdatePrefs({ ...prefs, smartIdle: false })}
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
        </div>
      </div>
    </div>
  )
}
