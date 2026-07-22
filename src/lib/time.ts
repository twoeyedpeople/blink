// Billing rule: minimum unit is 15 minutes, everything rounds UP to the next 15.
export function billedMinutes(ms: number): number {
  const mins = ms / 60000
  if (mins <= 0) return 0
  return Math.max(15, Math.ceil(mins / 15) * 15)
}

export function formatBilled(mins: number): string {
  const h = mins / 60
  return Number.isInteger(h) ? `${h}h` : `${parseFloat(h.toFixed(2))}h`
}

// Rate is per-project, not a flat platform-wide number, so this always takes
// the project's own hourlyRate rather than assuming one.
const currencyFormatter = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  maximumFractionDigits: 0,
})

export function dollarsForMinutes(mins: number, hourlyRate: number): number {
  return (mins / 60) * hourlyRate
}

export function formatDollars(amount: number): string {
  return currencyFormatter.format(amount)
}

// 01:23:45 style ticking clock
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

// "1h 24m" style
export function formatDuration(ms: number): string {
  const mins = Math.round(ms / 60000)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })
}

export function toDateInput(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function toTimeInput(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function fromDateTimeInputs(date: string, time: string): number | null {
  if (!date || !time) return null
  const ts = new Date(`${date}T${time}`).getTime()
  return Number.isNaN(ts) ? null : ts
}
