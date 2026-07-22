import { CheckCircle2 } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  onDone: () => void
}

// Fades in, holds briefly, fades out, then unmounts. Total lifecycle capped
// at 1.5s so it never lingers or blocks the next action.
export function Toast({ message, onDone }: ToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true))
    const hide = setTimeout(() => setVisible(false), 1000)
    const done = setTimeout(onDone, 1500)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(hide)
      clearTimeout(done)
    }
  }, [onDone])

  return (
    <div
      className={`pointer-events-none fixed left-1/2 top-6 z-50 -translate-x-1/2 transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
      }`}
    >
      <div className="flex items-center gap-2 rounded-full border-2 border-ink bg-green px-5 py-2.5 font-display text-sm font-bold shadow-hard">
        <CheckCircle2 className="h-4 w-4" />
        {message}
      </div>
    </div>
  )
}
