export function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-ink bg-white shadow-hard-sm">
        <img src="/Icon.png" alt="" className="h-[22px] w-[22px]" />
      </div>
      <h1 className="flex flex-col leading-none">
        <span className="font-display text-xl font-black leading-none tracking-[0.2em]">TIM</span>
        <span className="font-serif text-xs leading-none text-ink/50">the Timer</span>
      </h1>
    </div>
  )
}
