// Variant D - C's graphics (slate panel, amber edge, hash-mark backdrop) with
// B's layout (score and status centered between the teams). Compact density.
import { Ball, Hamburger, LeagueSlot, Segmented } from './controls'
import { days, downDistance, type Row, type Side } from './data'

const seg = {
  track: 'rounded bg-slate-950 p-0.5 font-mono text-[11px] ring-1 ring-slate-700',
  on: 'rounded-sm bg-amber-400 px-2 py-0.5 font-bold text-slate-950',
  off: 'rounded-sm px-2 py-0.5 text-slate-400 hover:text-slate-100',
}

function GameRow({ row }: { row: Row }) {
  const live = row.state === 'in'
  const tone = (s: Side) =>
    row.state === 'post' && !s.winner ? 'text-slate-500' : 'text-slate-100'
  const dd = live ? downDistance(row.id) : ''
  return (
    <li
      className={`grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-1.5 ${live ? 'bg-slate-800/40' : ''} ${row.redZone ? 'shadow-[inset_2px_0_0_0] shadow-rose-500' : ''}`}
    >
      <div className={`flex items-center gap-2 ${tone(row.away)}`}>
        <img src={row.away.logo} alt="" className="size-5" />
        <span className="text-[13px] font-bold">{row.away.abbr}</span>
        {row.possession === 'away' && <Ball className="h-1.5 w-3 text-amber-500" />}
      </div>
      <div className="flex min-w-28 flex-col items-center leading-none">
        {row.state === 'pre' ? (
          <span className="font-mono text-[13px] font-semibold text-slate-300 tabular-nums">
            {row.kickoff}
          </span>
        ) : (
          <span className="font-mono text-[15px] font-bold tabular-nums">
            <span className={tone(row.away)}>{row.away.score}</span>
            <span className="px-1 text-slate-600">-</span>
            <span className={tone(row.home)}>{row.home.score}</span>
          </span>
        )}
        <span
          className={`mt-1 flex items-center gap-1 font-mono text-[10px] ${live ? 'font-semibold text-rose-400' : 'text-slate-500'}`}
        >
          {live && (
            <span
              aria-hidden="true"
              className="size-1.5 animate-pulse rounded-full bg-rose-500 motion-reduce:animate-none"
            />
          )}
          {row.state === 'pre' ? row.network || row.status : row.status}
          {dd && <span className="font-normal text-slate-400"> · {dd.replace(/ at .*/, '')}</span>}
          {row.redZone && (
            <span className="ml-0.5 rounded-sm bg-rose-500/20 px-1 font-bold text-rose-300">
              RZ
            </span>
          )}
        </span>
      </div>
      <div className={`flex flex-row-reverse items-center gap-2 ${tone(row.home)}`}>
        <img src={row.home.logo} alt="" className="size-5" />
        <span className="text-[13px] font-bold">{row.home.abbr}</span>
        {row.possession === 'home' && <Ball className="h-1.5 w-3 text-amber-500" />}
      </div>
    </li>
  )
}

function Backdrop() {
  const band = {
    background:
      'repeating-linear-gradient(90deg, rgb(255 255 255 / 0.07) 0 3px, transparent 3px 44px)',
    maskImage: 'linear-gradient(transparent, black 30%, black 70%, transparent)',
  }
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgb(251_191_36/0.14),transparent_45%),radial-gradient(ellipse_at_100%_100%,rgb(56_189_248/0.08),transparent_40%)]" />
      <div
        className="absolute -top-20 -left-1/4 h-72 w-[150%] -rotate-[8deg] opacity-60"
        style={band}
      />
      <div
        className="absolute -bottom-24 -left-1/4 h-72 w-[150%] -rotate-[8deg] opacity-40"
        style={band}
      />
    </div>
  )
}

export default function App() {
  return (
    <div className="min-h-dvh bg-[#0b1020] px-2 py-6 text-slate-100 sm:py-12">
      <Backdrop />
      <main className="relative mx-auto w-full max-w-[560px] overflow-hidden rounded-xl bg-slate-900 shadow-[0_0_0_1px_rgb(51_65_85/0.7),0_24px_48px_-12px_rgb(0_0_0/0.85),0_4px_12px_-2px_rgb(0_0_0/0.5)]">
        <div
          aria-hidden="true"
          className="h-0.5 bg-gradient-to-r from-amber-400 via-amber-300 to-rose-500"
        />
        <header className="flex items-center gap-3 bg-slate-950/60 px-3 py-2.5">
          <h1 className="font-mono text-sm font-bold tracking-tight">
            covertwo<span className="text-amber-400">_</span>
          </h1>
          <LeagueSlot seg={seg} />
          <div className="ml-auto flex items-center gap-2">
            <Segmented label="Time zone" options={['EU', 'US']} seg={seg} />
            <Hamburger className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white" />
          </div>
        </header>
        {days().map((d) => (
          <section key={d.label}>
            <h2 className="flex items-center gap-2 border-y border-slate-800 bg-slate-950/30 px-3 py-1 font-mono text-[10px] tracking-wider text-amber-400/80 uppercase">
              {d.label}
              <span className="text-slate-600">
                {d.rows.length} {d.rows.length === 1 ? 'game' : 'games'}
              </span>
            </h2>
            <ul className="divide-y divide-slate-800/70">
              {d.rows.map((r) => (
                <GameRow key={r.id} row={r} />
              ))}
            </ul>
          </section>
        ))}
        <footer className="flex justify-between border-t border-slate-800 px-3 py-1.5 font-mono text-[10px] text-slate-500">
          <span>ESPN · 30s poll</span>
          <span>upd 12s ago</span>
        </footer>
      </main>
    </div>
  )
}
