import type { Game, Team } from '../data/game'
import { formatTime, type TimeMode } from '../time/format'

function status(game: Game): string {
  if (game.state === 'post') return game.detail
  if (game.state === 'pre') return game.network ?? 'Scheduled'
  if (game.halftime) return 'Halftime'
  const period = game.period > 4 ? 'OT' : `Q${game.period}`
  return `${period} · ${game.clock}`
}

function Side({ team, dim, align }: { team: Team; dim: boolean; align: 'start' | 'end' }) {
  return (
    <div
      className={`flex min-w-0 items-center gap-2 ${align === 'end' ? 'flex-row-reverse' : ''} ${dim ? 'text-slate-500' : 'text-slate-100'}`}
    >
      <img src={team.logo} alt="" width={20} height={20} className="size-5 shrink-0" />
      <span aria-hidden="true" className="truncate text-[13px] font-bold">
        {team.abbr}
      </span>
      <span className="sr-only">{team.name}</span>
    </div>
  )
}

/** One compact row: away | score or kickoff + status | home. */
export function GameRow({ game, mode }: { game: Game; mode: TimeMode }) {
  const live = game.state === 'in'
  // Dim the loser only when there is a winner; a tie dims neither side.
  const decided = game.state === 'post' && (game.home.winner || game.away.winner)
  const dim = (t: Team) => decided && !t.winner
  return (
    <li
      className={`grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-1.5 ${live ? 'bg-slate-800/40' : ''}`}
    >
      <Side team={game.away} dim={dim(game.away)} align="start" />
      <div className="flex min-w-24 flex-col items-center leading-none">
        {game.state === 'pre' ? (
          <time
            dateTime={game.startsAt}
            className="font-mono text-[13px] font-semibold text-slate-300 tabular-nums"
          >
            {formatTime(game.startsAt, mode)}
          </time>
        ) : (
          <span className="font-mono text-[15px] font-bold tabular-nums">
            <span className={dim(game.away) ? 'text-slate-500' : ''}>{game.away.score}</span>
            <span aria-hidden="true" className="px-1 text-slate-600">
              -
            </span>
            <span className="sr-only"> to </span>
            <span className={dim(game.home) ? 'text-slate-500' : ''}>{game.home.score}</span>
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
          {status(game)}
        </span>
      </div>
      <Side team={game.home} dim={dim(game.home)} align="end" />
    </li>
  )
}
