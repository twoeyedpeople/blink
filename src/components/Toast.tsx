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
      className={`pointer-events-none fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 px-4 transition-all duration-300 ${
        visible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
      }`}
    >
      <div className="flex items-center gap-3 rounded-3xl border-2 border-ink bg-yellow px-8 py-5 font-display text-2xl font-black shadow-hard sm:text-3xl">
        <CheckCircle2 className="h-8 w-8 shrink-0 sm:h-9 sm:w-9" />
        {message}
      </div>
    </div>
  )
}
