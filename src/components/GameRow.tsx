import type { Game, Team } from '../data/game'
import { formatTime, type TimeMode } from '../time/format'

function status(game: Game): string {
  if (game.state === 'post') return game.detail
  if (game.state === 'pre') return game.network ?? 'Scheduled'
  if (game.halftime) return 'Halftime'
  const period = game.period > 4 ? 'OT' : `Q${game.period}`
  return `${period} · ${game.clock}`
}

function Ball() {
  return (
    <svg viewBox="0 0 16 10" className="h-1.5 w-3 shrink-0 text-amber-500" aria-hidden="true">
      <ellipse cx="8" cy="5" rx="7.5" ry="4.5" fill="currentColor" />
      <path d="M5 5h6M6.5 3.8v2.4M8 3.8v2.4M9.5 3.8v2.4" stroke="#000" strokeOpacity=".5" />
    </svg>
  )
}

function Side({
  team,
  dim,
  align,
  ball,
}: {
  team: Team
  dim: boolean
  align: 'start' | 'end'
  ball: boolean
}) {
  return (
    <div
      aria-hidden="true"
      className={`flex min-w-0 items-center gap-2 ${align === 'end' ? 'flex-row-reverse' : ''} ${dim ? 'text-slate-500' : 'text-slate-100'}`}
    >
      <img src={team.logo} alt="" width={20} height={20} className="size-5 shrink-0" />
      <span className="truncate text-[13px] font-bold">{team.abbr}</span>
      {ball && <Ball />}
    </div>
  )
}

function downText(down: NonNullable<Game['down']>): string {
  return down.spot ? `${down.distance} at ${down.spot}` : down.distance
}

/** What a screen reader hears, in reading order: both teams, then the status. */
function summary(game: Game, mode: TimeMode): string {
  const { away, home } = game
  if (game.state === 'pre')
    return `${away.name} at ${home.name}, ${formatTime(game.startsAt, mode)}, ${status(game)}`
  const ball = game.possession ? `, ${game[game.possession].name} ball` : ''
  const down = game.down ? `, ${downText(game.down)}` : ''
  const zone = game.redZone ? ', red zone' : ''
  return `${away.name} ${away.score ?? '-'}, ${home.name} ${home.score ?? '-'}, ${status(game)}${down}${zone}${ball}`
}

/** One compact row: away | score or kickoff + status | home. */
export function GameRow({ game, mode }: { game: Game; mode: TimeMode }) {
  const live = game.state === 'in'
  // Dim the loser only when there is a winner; a tie dims neither side.
  const decided = game.state === 'post' && (game.home.winner || game.away.winner)
  const dim = (t: Team) => decided && !t.winner
  return (
    <li
      className={`grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-1.5 ${live ? 'bg-slate-800/40' : ''} ${game.redZone ? 'shadow-[inset_2px_0_0_0] shadow-rose-500' : ''}`}
    >
      <span className="sr-only">{summary(game, mode)}</span>
      <Side team={game.away} dim={dim(game.away)} align="start" ball={game.possession === 'away'} />
      <div aria-hidden="true" className="flex w-40 flex-col items-center leading-none sm:w-52">
        {game.state === 'pre' ? (
          <time
            dateTime={game.startsAt}
            className="font-mono text-[13px] font-semibold text-slate-300 tabular-nums"
          >
            {formatTime(game.startsAt, mode)}
          </time>
        ) : (
          <span className="font-mono text-[15px] font-bold tabular-nums">
            <span className={dim(game.away) ? 'text-slate-500' : ''}>{game.away.score ?? '-'}</span>
            <span className="px-1 text-slate-600">-</span>
            <span className={dim(game.home) ? 'text-slate-500' : ''}>{game.home.score ?? '-'}</span>
          </span>
        )}
        <span
          className={`mt-1 flex max-w-full items-center gap-1 font-mono text-[10px] whitespace-nowrap ${live ? 'font-semibold text-rose-400' : 'text-slate-500'}`}
        >
          {live && (
            <span
              aria-hidden="true"
              className="size-1.5 shrink-0 animate-pulse rounded-full bg-rose-500 motion-reduce:animate-none"
            />
          )}
          <span className="shrink-0">{status(game)}</span>
          {game.redZone && (
            <span className="shrink-0 rounded-sm bg-rose-500/20 px-1 font-bold text-rose-300">
              RZ
            </span>
          )}
          {game.down && (
            <>
              <span className="shrink-0 font-normal text-slate-400">· {game.down.distance}</span>
              {game.down.spot && (
                // A half-cut "at D…" reads worse than nothing, so phones skip the spot.
                <span className="hidden min-w-0 truncate font-normal text-slate-500 sm:inline">
                  at {game.down.spot}
                </span>
              )}
            </>
          )}
        </span>
      </div>
      <Side team={game.home} dim={dim(game.home)} align="end" ball={game.possession === 'home'} />
    </li>
  )
}
