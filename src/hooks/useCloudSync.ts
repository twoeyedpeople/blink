import { useEffect, useRef, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Entry, Prefs, Project, Running } from '../types'
import type { Store } from './useStore'

export type SyncStatus = 'connecting' | 'synced' | 'saving' | 'offline'

interface WorkspaceDoc {
  projects: Project[]
  entries: Entry[]
  prefs: Prefs
  running: Running | null
  updatedAt: number
}

const WORKSPACE_REF = doc(db, 'blink', 'workspace')
const DEBOUNCE_MS = 900

// One document holds the whole workspace. Firestore is the sync target across devices;
// localStorage (handled in useStore) remains the offline-first cache. Last write wins on
// the whole document, that's an accepted tradeoff for a small, mostly-single-editor studio tool.
export function useCloudSync(store: Store): SyncStatus {
  const [status, setStatus] = useState<SyncStatus>('connecting')
  const lastKnownUpdatedAt = useRef(0)
  const skipNextWrite = useRef(true) // don't push initial local defaults over whatever's remote

  useEffect(() => {
    const unsubscribe = onSnapshot(
      WORKSPACE_REF,
      (snap) => {
        const data = snap.data() as WorkspaceDoc | undefined
        if (data && data.updatedAt > lastKnownUpdatedAt.current) {
          lastKnownUpdatedAt.current = data.updatedAt
          skipNextWrite.current = true
          store.replaceAll({
            projects: data.projects ?? [],
            entries: data.entries ?? [],
            prefs: data.prefs ?? { idleMinutes: 15, smartIdle: false },
            running: data.running ?? null,
          })
        }
        setStatus('synced')
      },
      () => setStatus('offline'),
    )
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (skipNextWrite.current) {
      skipNextWrite.current = false
      return
    }
    setStatus('saving')
    const timer = setTimeout(() => {
      const updatedAt = Date.now()
      lastKnownUpdatedAt.current = updatedAt
      setDoc(WORKSPACE_REF, {
        projects: store.projects,
        entries: store.entries,
        prefs: store.prefs,
        running: store.running,
        updatedAt,
      })
        .then(() => setStatus('synced'))
        .catch(() => setStatus('offline'))
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [store.projects, store.entries, store.prefs, store.running])

  return status
}
