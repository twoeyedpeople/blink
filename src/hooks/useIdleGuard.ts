import { useEffect, useRef, useState } from 'react'
import type { Prefs, Running } from '../types'
import { load, save } from '../lib/storage'

// Minimal typings for the Chrome-only Idle Detection API
declare global {
  interface Window {
    IdleDetector?: {
      new (): IdleDetectorInstance
      requestPermission(): Promise<'granted' | 'denied'>
    }
  }
}
interface IdleDetectorInstance extends EventTarget {
  userState: 'active' | 'idle' | null
  screenState: 'locked' | 'unlocked' | null
  start(options: { threshold: number; signal?: AbortSignal }): Promise<void>
}

export interface AutoStopNotice {
  stoppedAt: number
  reason: 'sleep' | 'idle' | 'locked'
}

export interface RecoveryPrompt {
  lastSeen: number
}

interface IdleGuardArgs {
  running: Running | null
  prefs: Prefs
  stop: (endTs?: number, autoStopped?: boolean) => { saved: boolean }
}

const HEARTBEAT_MS = 20_000
const SLEEP_GAP_MS = 90_000
const RECOVERY_GAP_MS = 5 * 60_000

// Watches a running timer and stops it when the machine clearly stopped being used:
// 1. Sleep/lid-close: setInterval freezes during sleep, so a large tick gap on wake
//    means the machine slept. Stop the timer back at the moment it froze.
// 2. Smart idle (opt-in, Chrome): the Idle Detection API reports system-level
//    keyboard/mouse idleness and screen lock, even when Tim is in a background tab.
// 3. Recovery: if the tab was closed while tracking, on next load offer to stop the
//    entry at the last heartbeat instead of silently counting the gap.
export function useIdleGuard({ running, prefs, stop }: IdleGuardArgs) {
  const [now, setNow] = useState(() => Date.now())
  const [notice, setNotice] = useState<AutoStopNotice | null>(null)
  const [recovery, setRecovery] = useState<RecoveryPrompt | null>(null)
  const checkedRecovery = useRef(false)

  // On first load: a timer that survived a closed tab needs the user's call.
  useEffect(() => {
    if (checkedRecovery.current) return
    checkedRecovery.current = true
    if (!running) return
    const lastSeen = load<number | null>('lastSeen', null) ?? running.start
    if (Date.now() - lastSeen > RECOVERY_GAP_MS) {
      setRecovery({ lastSeen })
    }
  }, [running])

  // Tick + heartbeat + sleep-gap detection
  useEffect(() => {
    if (!running || recovery) return
    let lastTick = Date.now()
    let lastBeat = 0
    const iv = setInterval(() => {
      const t = Date.now()
      if (t - lastTick > SLEEP_GAP_MS) {
        stop(lastTick, true)
        setNotice({ stoppedAt: lastTick, reason: 'sleep' })
        return
      }
      lastTick = t
      setNow(t)
      if (t - lastBeat > HEARTBEAT_MS) {
        lastBeat = t
        save('lastSeen', t)
      }
    }, 1000)
    return () => clearInterval(iv)
  }, [running, recovery, stop])

  // Smart idle via the Idle Detection API (only if enabled and permitted)
  useEffect(() => {
    if (!running || recovery || !prefs.smartIdle || !window.IdleDetector) return
    if (prefs.idleMinutes <= 0) return
    const controller = new AbortController()
    const thresholdMs = Math.max(60_000, prefs.idleMinutes * 60_000)
    let detector: IdleDetectorInstance
    ;(async () => {
      try {
        detector = new window.IdleDetector!()
        detector.addEventListener('change', () => {
          if (detector.screenState === 'locked') {
            stop(Date.now(), true)
            setNotice({ stoppedAt: Date.now(), reason: 'locked' })
          } else if (detector.userState === 'idle') {
            const idleSince = Date.now() - thresholdMs
            stop(idleSince, true)
            setNotice({ stoppedAt: idleSince, reason: 'idle' })
          }
        })
        await detector.start({ threshold: thresholdMs, signal: controller.signal })
      } catch {
        // permission missing or API unavailable; the sleep-gap guard still applies
      }
    })()
    return () => controller.abort()
  }, [running, recovery, prefs.smartIdle, prefs.idleMinutes, stop])

  const resolveRecovery = (keepRunning: boolean) => {
    if (!recovery) return
    if (!keepRunning) {
      stop(recovery.lastSeen, true)
      setNotice({ stoppedAt: recovery.lastSeen, reason: 'sleep' })
    }
    setRecovery(null)
  }

  return { now, notice, dismissNotice: () => setNotice(null), recovery, resolveRecovery }
}
