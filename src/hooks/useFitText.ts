import { useLayoutEffect, useRef, useState } from 'react'

// Shrinks font-size until the text fits its container on one line, no matter
// how long the string is or how narrow the viewport gets. Re-measures on resize.
export function useFitText(text: string, maxPx: number, minPx: number, stepPx = 2) {
  const ref = useRef<HTMLSpanElement>(null)
  const [fontSize, setFontSize] = useState(maxPx)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const fit = () => {
      let size = maxPx
      el.style.fontSize = `${size}px`
      while (el.scrollWidth > el.clientWidth && size > minPx) {
        size -= stepPx
        el.style.fontSize = `${size}px`
      }
      setFontSize(size)
    }

    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [text, maxPx, minPx, stepPx])

  return { ref, fontSize }
}
