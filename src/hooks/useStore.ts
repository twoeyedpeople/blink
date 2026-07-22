import { useCallback, useEffect, useRef, useState } from 'react'
import type { Entry, Prefs, Project, Running } from '../types'
import { PROJECT_COLOURS } from '../types'
import { load, save } from '../lib/storage'

export interface StopResult {
  saved: boolean
  entry?: Entry
}

const MIN_ENTRY_MS = 60_000 // anything under a minute was a misfire, discard it

export function useStore() {
  const [projects, setProjects] = useState<Project[]>(() => load('projects', [] as Project[]))
  const [entries, setEntries] = useState<Entry[]>(() => load('entries', [] as Entry[]))
  const [running, setRunning] = useState<Running | null>(() => load('running', null))
  const [prefs, setPrefs] = useState<Prefs>(() =>
    load('prefs', { idleMinutes: 15, smartIdle: false } as Prefs),
  )

  const runningRef = useRef(running)
  runningRef.current = running

  useEffect(() => save('projects', projects), [projects])
  useEffect(() => save('entries', entries), [entries])
  useEffect(() => save('running', running), [running])
  useEffect(() => save('prefs', prefs), [prefs])

  const addProject = useCallback((name: string): Project | null => {
    const trimmed = name.trim()
    if (!trimmed) return null
    const project: Project = {
      id: crypto.randomUUID(),
      name: trimmed,
      colour: PROJECT_COLOURS[projects.length % PROJECT_COLOURS.length],
      archived: false,
      createdAt: Date.now(),
    }
    setProjects((p) => [...p, project])
    return project
  }, [projects.length])

  const updateProject = useCallback((id: string, patch: Partial<Project>) => {
    setProjects((p) => p.map((proj) => (proj.id === id ? { ...proj, ...patch } : proj)))
  }, [])

  const deleteProject = useCallback((id: string) => {
    setProjects((p) => p.filter((proj) => proj.id !== id))
  }, [])

  const start = useCallback((projectId: string, description: string, loggedBy?: string) => {
    setRunning({ projectId, description, start: Date.now(), ...(loggedBy ? { loggedBy } : {}) })
    save('lastSeen', Date.now())
  }, [])

  const updateRunning = useCallback((patch: Partial<Running>) => {
    setRunning((r) => (r ? { ...r, ...patch } : r))
  }, [])

  const stop = useCallback((endTs?: number, autoStopped = false): StopResult => {
    const r = runningRef.current
    if (!r) return { saved: false }
    setRunning(null)
    save('lastSeen', null)
    const end = Math.max(endTs ?? Date.now(), r.start)
    if (end - r.start < MIN_ENTRY_MS) return { saved: false }
    const entry: Entry = {
      id: crypto.randomUUID(),
      projectId: r.projectId,
      description: r.description,
      start: r.start,
      end,
      ...(autoStopped ? { autoStopped: true } : {}),
      ...(r.loggedBy ? { loggedBy: r.loggedBy } : {}),
    }
    setEntries((e) => [entry, ...e])
    return { saved: true, entry }
  }, [])

  const updateEntry = useCallback((id: string, patch: Partial<Entry>) => {
    setEntries((e) => e.map((en) => (en.id === id ? { ...en, ...patch } : en)))
  }, [])

  const deleteEntry = useCallback((id: string) => {
    setEntries((e) => e.filter((en) => en.id !== id))
  }, [])

  const addManualEntry = useCallback(
    (input: { projectId: string; description: string; date: string; hours: number; loggedBy?: string }) => {
      const start = new Date(`${input.date}T12:00`).getTime()
      const end = start + input.hours * 3600_000
      const entry: Entry = {
        id: crypto.randomUUID(),
        projectId: input.projectId,
        description: input.description,
        start,
        end,
        manual: true,
        ...(input.loggedBy ? { loggedBy: input.loggedBy } : {}),
      }
      setEntries((e) => [entry, ...e])
    },
    [],
  )

  const replaceAll = useCallback(
    (data: { projects: Project[]; entries: Entry[]; prefs: Prefs; running: Running | null }) => {
      setProjects(data.projects)
      setEntries(data.entries)
      setPrefs(data.prefs)
      setRunning(data.running)
    },
    [],
  )

  return {
    projects,
    entries,
    running,
    prefs,
    setPrefs,
    addProject,
    updateProject,
    deleteProject,
    start,
    updateRunning,
    stop,
    updateEntry,
    deleteEntry,
    addManualEntry,
    replaceAll,
  }
}

export type Store = ReturnType<typeof useStore>
