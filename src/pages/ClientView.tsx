import { ChevronLeft, ChevronRight, Download, User } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { addMonths, format, isSameMonth, startOfMonth } from 'date-fns'
import { db } from '../lib/firebase'
import { billedMinutes, dollarsForMinutes, formatBilled, formatDollars, toDateInput } from '../lib/time'
import { downloadClientReport } from '../lib/clientReport'

interface ClientEntry {
  id: string
  start: number
  end: number
  description: string
  loggedBy?: string
}

interface ClientDoc {
  projectName: string
  hourlyRate: number
  entries: ClientEntry[]
}

type LoadState = 'loading' | 'not-found' | 'loaded'

export function ClientView({ shareId }: { shareId: string }) {
  const [data, setData] = useState<ClientDoc | null>(null)
  const [state, setState] = useState<LoadState>('loading')
  const [month, setMonth] = useState(() => startOfMonth(new Date()))

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'blink_clients', shareId),
      (snap) => {
        if (!snap.exists()) {
          setState('not-found')
          return
        }
        setData(snap.data() as ClientDoc)
        setState('loaded')
      },
      () => setState('not-found'),
    )
    return unsubscribe
  }, [shareId])

  const monthEntries = useMemo(
    () =>
      (data?.entries ?? [])
        .filter((e) => isSameMonth(new Date(e.start), month))
        .sort((a, b) => b.start - a.start),
    [data, month],
  )

  const totalBilled = monthEntries.reduce((sum, e) => sum + billedMinutes(e.end - e.start), 0)
  const totalDollars = dollarsForMinutes(totalBilled, data?.hourlyRate ?? 0)

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

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 pb-16 pt-10">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-ink bg-white shadow-hard-sm">
          <img src="/Icon.png" alt="" className="h-[22px] w-[22px]" />
        </div>
        <h1 className="font-serif text-2xl leading-none">blink</h1>
      </div>

      {state === 'loading' && <p className="mt-10 text-center text-ink/50">Loading…</p>}

      {state === 'not-found' && (
        <div className="mt-10 rounded-3xl border-2 border-ink bg-white p-8 text-center shadow-hard">
          <h2 className="font-display text-2xl font-black">Link not found</h2>
          <p className="mt-2 text-ink/60">
            This billing link doesn't match anything. Check the URL, or ask Two-Eyed People to
            resend it.
          </p>
        </div>
      )}

      {state === 'loaded' && data && (
        <section className="mt-6 rounded-3xl border-2 border-ink bg-white p-6 shadow-hard sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-3xl font-black">{data.projectName}</h2>
              <p className="mt-1 text-sm text-ink/50">Billing summary, updated as time is logged</p>
            </div>
            <button
              onClick={() => downloadClientReport({ name: data.projectName }, data.entries)}
              className="flex shrink-0 items-center gap-2 rounded-full border-2 border-ink bg-white px-4 py-2 text-sm font-bold hover:bg-pink-soft"
            >
              <Download className="h-4 w-4" /> Download report
            </button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMonth((m) => addMonths(m, -1))}
                className="rounded-full border-2 border-ink p-2 hover:bg-pink-soft"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h3 className="w-44 text-center font-display text-xl font-black">
                {format(month, 'MMMM yyyy')}
              </h3>
              <button
                onClick={() => setMonth((m) => addMonths(m, 1))}
                className="rounded-full border-2 border-ink p-2 hover:bg-pink-soft"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-ink bg-pink-soft p-5">
            <div>
              <p className="font-display text-4xl font-black">{formatBilled(totalBilled)}</p>
              <p className="text-sm font-medium text-ink/60">
                logged this month · ${data.hourlyRate}/hr
              </p>
            </div>
            <div className="text-right">
              <p className="font-display text-4xl font-black text-magenta">
                {formatDollars(totalDollars)}
              </p>
              <p className="text-sm font-medium text-ink/60">Total</p>
            </div>
          </div>

          {byDay.length === 0 ? (
            <p className="mt-6 text-center text-ink/50">Nothing logged this month yet.</p>
          ) : (
            byDay.map((group) => (
              <div key={group.day} className="mt-6">
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink/50">
                  {group.label}
                </h3>
                <ul className="space-y-2">
                  {group.items.map((e) => (
                    <li
                      key={e.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border-2 border-ink bg-white p-4"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{e.description}</p>
                        {e.loggedBy && (
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-ink/50">
                            <User className="h-3 w-3" /> {e.loggedBy}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-3 text-sm font-bold">
                        <span>{formatBilled(billedMinutes(e.end - e.start))}</span>
                        <span className="text-magenta">
                          {formatDollars(dollarsForMinutes(billedMinutes(e.end - e.start), data.hourlyRate))}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </section>
      )}

      <footer className="mt-10 flex items-center justify-center gap-2 text-xs text-ink/40">
        <span>© Two-Eyed People Pty Ltd</span>
      </footer>
    </div>
  )
}
