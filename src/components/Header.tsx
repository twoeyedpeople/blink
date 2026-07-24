import { Menu, Settings, X } from 'lucide-react'
import { useState } from 'react'

interface HeaderProps {
  route: string
  onNavigate: (route: string) => void
  onOpenSettings: () => void
  hasName: boolean
}

const TABS = [
  { id: '/', label: 'Timer' },
  { id: '/projects', label: 'Projects' },
  { id: '/history', label: 'Billings' },
]

function Brand({ onNavigate }: { onNavigate: (route: string) => void }) {
  return (
    <button onClick={() => onNavigate('/')} className="flex items-center gap-2.5 text-left">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-ink bg-white shadow-hard-sm">
        <img src="/Icon.png" alt="" className="h-[22px] w-[22px]" />
      </div>
      <h1 className="font-serif text-2xl leading-none">Blink</h1>
    </button>
  )
}

function SettingsButton({
  onOpenSettings,
  hasName,
}: {
  onOpenSettings: () => void
  hasName: boolean
}) {
  return (
    <button
      onClick={onOpenSettings}
      aria-label="Settings"
      className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-white hover:bg-pink-soft"
    >
      <Settings className="h-4 w-4" />
      {!hasName && (
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-orange" />
      )}
    </button>
  )
}

export function Header({ route, onNavigate, onOpenSettings, hasName }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const go = (id: string) => {
    onNavigate(id)
    setMenuOpen(false)
  }

  return (
    <header className="py-6">
      {/* Tablet and up: brand, centred nav + settings group, TEP logo, all in one row */}
      <div className="hidden sm:grid sm:grid-cols-3 sm:items-center sm:gap-4">
        <div className="justify-self-start">
          <Brand onNavigate={onNavigate} />
        </div>
        <div className="flex items-center gap-3 justify-self-center">
          <nav className="flex h-11 items-center rounded-full border-2 border-ink bg-white p-1 shadow-hard-sm">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => onNavigate(t.id)}
                className={`rounded-full px-4 py-1.5 font-display text-sm font-bold transition-colors ${
                  route === t.id ? 'bg-ink text-white' : 'text-ink hover:bg-pink-soft'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
          <SettingsButton onOpenSettings={onOpenSettings} hasName={hasName} />
        </div>
        <img
          src="/Logo_black.png"
          alt="Two-Eyed People"
          className="hidden h-9 justify-self-end md:block"
        />
      </div>

      {/* Mobile: brand left, settings + hamburger right, tabs tuck into a dropdown */}
      <div className="flex items-center justify-between gap-3 sm:hidden">
        <Brand onNavigate={onNavigate} />
        <div className="flex items-center gap-2">
          <SettingsButton onOpenSettings={onOpenSettings} hasName={hasName} />
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="rounded-full border-2 border-ink bg-white p-2 hover:bg-pink-soft"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {menuOpen && (
        <nav className="mt-3 flex flex-col gap-1 rounded-2xl border-2 border-ink bg-white p-2 shadow-hard-sm sm:hidden">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => go(t.id)}
              className={`rounded-xl px-4 py-2.5 text-left font-display text-sm font-bold transition-colors ${
                route === t.id ? 'bg-ink text-white' : 'text-ink hover:bg-pink-soft'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      )}
    </header>
  )
}
