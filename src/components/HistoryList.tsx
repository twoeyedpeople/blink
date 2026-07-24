import { ChevronDown, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { useMemo, useState } from 'react'
import { addMonths, format, isSameMonth, startOfMonth } from 'date-fns'
import type { Store } from '../hooks/useStore'
import { billedMinutes, dollarsForMinutes, formatBilled, formatDollars, toDateInput, toTimeInput } from '../lib/time'
import { EntryRow } from './EntryRow'

export function HistoryList({ store }: { store: Store }) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [projectFilter, setProjectFilter] = useState('all')
  const { entries, projects } = store

  const monthEntries = useMemo(
    () =>
      entries
        .filter(
          (e) =>
            isSameMonth(new Date(e.start), month) &&
            (projectFilter === 'all' || e.projectId === projectFilter),
        )
        .sort((a, b) => b.start - a.start),
    [entries, month, projectFilter],
  )

  const totalBilled = monthEntries.reduce((sum, e) => sum + billedMinutes(e.end - e.start), 0)

  const totalDollars = monthEntries.reduce((sum, e) => {
    const rate = projects.find((p) => p.id === e.projectId)?.hourlyRate ?? 0
    return sum + dollarsForMinutes(billedMinutes(e.end - e.start), rate)
  }, 0)

  const filteredProject = projectFilter === 'all' ? null : projects.find((p) => p.id === projectFilter)

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
    const projectSuffix =
      projectFilter === 'all'
        ? ''
        : `-${(projects.find((p) => p.id === projectFilter)?.name ?? '').toLowerCase().replace(/\s+/g, '-')}`
    a.download = `blink-${format(month, 'yyyy-MM')}${projectSuffix}.csv`
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
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="appearance-none rounded-full border-2 border-ink bg-white py-2 pl-4 pr-9 text-sm font-bold outline-none focus:bg-pink-soft"
            >
              <option value="all">All projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.archived ? ' (archived)' : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
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
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-ink bg-pink-soft p-5">
        <div>
          <p className="font-display text-4xl font-black">{formatBilled(totalBilled)}</p>
          <p className="text-sm font-medium text-ink/60">
            billed this month{filteredProject ? ' · ' + filteredProject.name : ''}
            {filteredProject ? ` · $${filteredProject.hourlyRate}/hr` : ''}
          </p>
        </div>
        <p className="font-display text-3xl font-black text-magenta">{formatDollars(totalDollars)}</p>
      </div>

      {byDay.length === 0 ? (
        <p className="mt-6 text-center text-ink/50">
          {projectFilter === 'all'
            ? 'Nothing tracked this month. Yet.'
            : `Nothing tracked for ${projects.find((p) => p.id === projectFilter)?.name ?? 'this project'} this month.`}
        </p>
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
