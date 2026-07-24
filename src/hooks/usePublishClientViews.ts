import { useEffect, useRef } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { authReady, db } from '../lib/firebase'
import type { Store } from './useStore'

const DEBOUNCE_MS = 900

// Mirrors each project's billing-relevant entries into its own public,
// shareId-keyed document, deliberately separate from the main workspace doc
// (which holds every project for every client and must never be handed out
// as a URL). Runs from whichever device is actually logging time, so a
// client's page updates the moment Dave (or a teammate) saves an entry.
export function usePublishClientViews(store: Store) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      authReady.then(() => {
        for (const project of store.projects) {
          if (!project.shareId) continue
          const entries = store.entries
            .filter((e) => e.projectId === project.id)
            .map((e) => ({ id: e.id, start: e.start, end: e.end, description: e.description }))
          setDoc(doc(db, 'blink_clients', project.shareId), {
            projectName: project.name,
            hourlyRate: project.hourlyRate,
            entries,
            updatedAt: Date.now(),
          }).catch(() => {
            // best-effort; the internal sync status badge already surfaces
            // connectivity problems, no need to duplicate that here
          })
        }
      })
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer.current)
  }, [store.projects, store.entries])
}
