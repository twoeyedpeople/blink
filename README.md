# Blink

Time tracking in the blink of an eye. A Two-Eyed People tool, sibling to Chronos.

## What it does

- One big START button. Pick a project, optionally say what you're doing, go.
- Description is editable while tracking and after.
- Every entry is editable: project, date, start, end, description. Delete too.
- Minimum billing unit is 30 minutes; anything under rounds up, longer times round up to the next 30-minute block. Actual time is always shown alongside.
- Historical list grouped by day, with a monthly billed total and per-project breakdown.
- Month-by-month navigation and CSV export.
- Projects page: add, rename, recolour (click the dot), archive, delete.

## Idle detection

Three layers, because the browser can only see so much:

1. **Sleep guard (always on, all browsers).** If the machine sleeps or the lid closes, the timer's tick freezes. On wake, Blink notices the gap and stops the entry back at the moment the machine went down.
2. **Smart idle (opt-in, Chrome and Edge).** Uses the Idle Detection API to spot system-wide inactivity or a locked screen, even when Blink is in a background tab. Enable it on the Projects page; the browser will ask for permission.
3. **Recovery prompt.** If the tab was closed while a timer ran, the next visit asks whether to stop the entry at the last sign of life or keep it running.

What the browser cannot do: watch your keyboard and mouse while you work in other apps, without the Idle Detection API. That is why smart idle is Chromium-only and opt-in.

## Data

Everything lives in `localStorage` in the browser you use it in. No accounts, no server. Use Export CSV for backups or invoicing. If team-wide or cross-device tracking is ever needed, the storage layer (`src/lib/storage.ts`) is the only thing to swap for Firebase (as Chronos does).

## Develop

```bash
npm install
npm run dev     # http://localhost:3001
npm run build   # type-checks then builds to dist/
```

## Deploy

Push to the GitHub repo, import it in Vercel (framework preset: Vite). Every push to `main` auto-deploys. No environment variables needed.
