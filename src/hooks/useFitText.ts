import { useLayoutEffect, useRef, useState } from 'react'

interface FitTextOptions {
  stepPx?: number
  wrapBelowPx?: number // below this viewport width, allow wrapping instead of shrinking to one line
  wrapFontPx?: number
}

// Shrinks font-size until the text fits its container on one line, no matter
// how long the string is, down to a comfortable mobile width. Below that,
// it's simpler to just let the text wrap at a fixed, still-bold size rather
// than shrink it into illegibility. Re-measures on resize.
export function useFitText(text: string, maxPx: number, minPx: number, options?: FitTextOptions) {
  const { stepPx = 2, wrapBelowPx = 640, wrapFontPx = minPx } = options ?? {}
  const ref = useRef<HTMLSpanElement>(null)
  const [fontSize, setFontSize] = useState(maxPx)
  const [wrap, setWrap] = useState(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const fit = () => {
      // Always try shrinking to one line first, regardless of the viewport
      // heuristic below, so a wrong or stale innerWidth reading can never
      // result in clipped text: if it truly fits at some size, use that.
      let size = maxPx
      el.style.whiteSpace = 'nowrap'
      el.style.fontSize = `${size}px`
      while (el.scrollWidth > el.clientWidth && size > minPx) {
        size -= stepPx
        el.style.fontSize = `${size}px`
      }
      const fitsOneLine = el.scrollWidth <= el.clientWidth
      const preferWrap = window.innerWidth < wrapBelowPx
      el.style.whiteSpace = '' // let the whitespace-normal/nowrap class (not this inline override) decide

      if (preferWrap || !fitsOneLine) {
        setWrap(true)
        setFontSize(preferWrap ? wrapFontPx : Math.max(size, minPx))
      } else {
        setWrap(false)
        setFontSize(size)
      }
    }

    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [text, maxPx, minPx, stepPx, wrapBelowPx, wrapFontPx])

  return { ref, fontSize, wrap }
}
