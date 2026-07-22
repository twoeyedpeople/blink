import { ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { useMemo, useState } from 'react'
import { addMonths, format, isSameMonth, startOfMonth } from 'date-fns'
import type { Store } from '../hooks/useStore'
import { billedMinutes, formatBilled, toDateInput, toTimeInput } from '../lib/time'
import { EntryRow } from './EntryRow'

export function HistoryList({ store }: { store: Store }) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const { entries, projects } = store

  const monthEntries = useMemo(
    () =>
      entries
        .filter((e) => isSameMonth(new Date(e.start), month))
        .sort((a, b) => b.start - a.start),
    [entries, month],
  )

  const totalBilled = monthEntries.reduce((sum, e) => sum + billedMinutes(e.end - e.start), 0)

  const byProject = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of monthEntries) {
      map.set(e.projectId, (map.get(e.projectId) ?? 0) + billedMinutes(e.end - e.start))
    }
    return [...map.entries()]
      .map(([projectId, mins]) => ({ project: projects.find((p) => p.id === projectId), mins }))
      .sort((a, b) => b.mins - a.mins)
  }, [monthEntries, projects])

  const byDay = useMemo(() => {
    const groups: { day: string; label: string; items: typeof monthEntries }[] = []
    for (const e of monthEntries) {
      const day = toDateInput(e.start)
      const last = groups[groups.length - 1]
      if (last && last.day === day) {
        last.items.push(e)
      } else {
        groups.push({ day, label: format(new Date(e.start), 'EEEE d MMMM'), items: [e] })
      }
    }
    return groups
  }, [monthEntries])

  const exportCsv = () => {
    const esc = (s: string) => `"${s.replaceAll('"', '""')}"`
    const rows = [
      ['Date', 'Project', 'Description', 'Start', 'End', 'Actual minutes', 'Billed hours'],
      ...[...monthEntries].reverse().map((e) => [
        toDateInput(e.start),
        esc(projects.find((p) => p.id === e.projectId)?.name ?? ''),
        esc(e.description),
        toTimeInput(e.start),
        toTimeInput(e.end),
        String(Math.round((e.end - e.start) / 60000)),
        String(billedMinutes(e.end - e.start) / 60),
      ]),
    ]
    const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `blink-${format(month, 'yyyy-MM')}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <section className="mt-8 rounded-3xl border-2 border-ink bg-white p-6 shadow-hard sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMonth((m) => addMonths(m, -1))}
            className="rounded-full border-2 border-ink p-2 hover:bg-pink-soft"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="w-44 text-center font-display text-2xl font-black">
            {format(month, 'MMMM yyyy')}
          </h2>
          <button
            onClick={() => setMonth((m) => addMonths(m, 1))}
            className="rounded-full border-2 border-ink p-2 hover:bg-pink-soft"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        {monthEntries.length > 0 && (
          <button
            onClick={exportCsv}
            className="flex items-center gap-2 rounded-full border-2 border-ink bg-white px-4 py-2 text-sm font-bold hover:bg-pink-soft"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        )}
      </div>

      <div className="mt-5 rounded-2xl border-2 border-ink bg-pink-soft p-5">
        <p className="font-display text-4xl font-black">{formatBilled(totalBilled)}</p>
        <p className="text-sm font-medium text-ink/60">billed this month</p>
        {byProject.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {byProject.map(({ project, mins }) => (
              <span
                key={project?.id ?? 'unknown'}
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-white px-3 py-1 text-sm font-bold"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: project?.colour ?? '#ccc' }}
                />
                {project?.name ?? 'Unknown'} · {formatBilled(mins)}
              </span>
            ))}
          </div>
        )}
      </div>

      {byDay.length === 0 ? (
        <p className="mt-6 text-center text-ink/50">Nothing tracked this month. Yet.</p>
      ) : (
        byDay.map((group) => (
          <div key={group.day} className="mt-6">
            <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink/50">
              {group.label}
            </h3>
            <ul className="space-y-2">
              {group.items.map((e) => (
                <EntryRow
                  key={e.id}
                  entry={e}
                  project={projects.find((p) => p.id === e.projectId)}
                  store={store}
                />
              ))}
            </ul>
          </div>
        ))
      )}
    </section>
  )
}
