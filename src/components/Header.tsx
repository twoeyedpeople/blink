interface HeaderProps {
  route: string
  onNavigate: (route: string) => void
}

export function Header({ route, onNavigate }: HeaderProps) {
  const tabs = [
    { id: '/', label: 'Timer' },
    { id: '/projects', label: 'Projects' },
    { id: '/history', label: 'History' },
  ]
  return (
    <header className="flex items-center justify-between gap-4 py-6">
      <button
        onClick={() => onNavigate('/')}
        className="flex items-center gap-3 text-left"
      >
        <div className="flex h-[42px] w-[42px] items-center justify-center rounded-2xl border-2 border-ink bg-white shadow-hard-sm">
          <img src="/Icon.png" alt="" className="h-[27px] w-[27px]" />
        </div>
        <div>
          <h1 className="font-serif text-[27px] leading-none">Blink</h1>
          <p className="mt-1 text-xs font-medium tracking-wide text-ink/60">
            Eyes on the time
          </p>
        </div>
      </button>
      <div className="flex items-center gap-4">
        <nav className="flex rounded-full border-2 border-ink bg-white p-1 shadow-hard-sm">
          {tabs.map((t) => (
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
        <img src="/Logo_black.png" alt="Two-Eyed People" className="hidden h-[18px] md:block" />
      </div>
    </header>
  )
}
