import type { Game, Team } from '../data/game'
import { isCrunchTime } from '../data/crunch'
import { COUNTDOWN_WINDOW_MS, formatCountdown } from '../time/countdown'
import { formatTime, type TimeMode } from '../time/format'
import { GameDetails } from './GameDetails'

function status(game: Game, now?: number): string {
  if (game.state === 'post') return game.detail
  if (game.state === 'pre') {
    const network = game.network ?? 'Scheduled'
    const until = now === undefined ? Infinity : Date.parse(game.startsAt) - now
    return until <= COUNTDOWN_WINDOW_MS ? `${network} · ${formatCountdown(until)}` : network
  }
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
  timeouts = null,
}: {
  team: Team
  dim: boolean
  align: 'start' | 'end'
  ball: boolean
  /** Timeouts left, shown only in crunch time. */
  timeouts?: number | null
}) {
  return (
    <div
      aria-hidden="true"
      data-side={align === 'start' ? 'away' : 'home'}
      className={`flex min-w-0 items-center gap-2 ${align === 'end' ? 'flex-row-reverse' : ''} ${dim ? 'text-slate-500' : 'text-slate-100'}`}
    >
      <img src={team.logo} alt="" width={20} height={20} className="size-5 shrink-0" />
      <span className={`flex min-w-0 flex-col gap-0.5 ${align === 'end' ? 'items-end' : ''}`}>
        <span className="truncate text-[13px] leading-none font-bold">
          {team.rank !== null && (
            <span className="mr-1 font-mono text-[10px] font-normal opacity-70">{team.rank}</span>
          )}
          {team.abbr}
        </span>
        {timeouts !== null && (
          <span className="font-mono text-[9px] leading-none text-amber-400/80">TO {timeouts}</span>
        )}
      </span>
      {ball && <Ball />}
    </div>
  )
}

function downText(down: NonNullable<Game['down']>): string {
  return down.spot ? `${down.distance} at ${down.spot}` : down.distance
}

/** What a screen reader hears, in reading order: both teams, then the status. */
function summary(game: Game, mode: TimeMode, now?: number): string {
  const { away, home } = game
  // "No. 5 Miami Hurricanes" for ranked college teams.
  const name = (t: Team) => (t.rank === null ? t.name : `No. ${t.rank} ${t.name}`)
  if (game.state === 'pre')
    return `${name(away)} at ${name(home)}, ${formatTime(game.startsAt, mode)}, ${status(game, now)}`
  const ball = game.possession ? `, ${game[game.possession].name} ball` : ''
  const down = game.down ? `, ${downText(game.down)}` : ''
  const zone = game.redZone ? ', red zone' : ''
  const tos =
    game.timeouts && isCrunchTime(game)
      ? `, timeouts: ${away.name} ${game.timeouts.away}, ${home.name} ${game.timeouts.home}`
      : ''
  return `${name(away)} ${away.score ?? '-'}, ${name(home)} ${home.score ?? '-'}, ${status(game)}${down}${zone}${ball}${tos}`
}

/** One compact row: away | score or kickoff + status | home. */
/** A changed score glows briefly; under reduced motion it gets a static marker instead. */
const FLASH =
  'rounded-sm animate-score-flash motion-reduce:animate-none motion-reduce:bg-amber-400/25'

export function GameRow({
  game,
  mode,
  flashing = [],
  expanded = false,
  onToggle,
  highlight = false,
  now,
}: {
  game: Game
  mode: TimeMode
  /** Sides whose score just changed. */
  flashing?: ('home' | 'away')[]
  expanded?: boolean
  onToggle?: () => void
  /** The favourite team's game: a faint amber tint. */
  highlight?: boolean
  /** Current time, for kickoff countdowns. */
  now?: number
}) {
  const live = game.state === 'in'
  // Timeouts matter at a glance only late in close games; otherwise they're
  // in the expanded view.
  const crunch = isCrunchTime(game)
  // Started games open to quarter scores and leaders; scheduled ones have none.
  const expandable = game.state !== 'pre' && onToggle !== undefined
  const detailsId = `details-${game.id}`
  // Dim the loser only when there is a winner; a tie dims neither side.
  const decided = game.state === 'post' && (game.home.winner || game.away.winner)
  const dim = (t: Team) => decided && !t.winner
  return (
    <li
      className={`${highlight ? 'bg-amber-400/[0.07]' : live ? 'bg-slate-800/40' : ''} ${game.redZone ? 'shadow-[inset_2px_0_0_0] shadow-rose-500' : ''}`}
    >
      {expandable ? (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={detailsId}
          onClick={onToggle}
          className="block w-full cursor-pointer text-left hover:bg-slate-800/30 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-amber-300/60"
        >
          {grid()}
        </button>
      ) : (
        grid()
      )}
      {expandable && <GameDetails id={detailsId} game={game} hidden={!expanded} />}
    </li>
  )

  function grid() {
    return (
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-1.5">
        <span className="sr-only">{summary(game, mode, now)}</span>
        <Side
          team={game.away}
          dim={dim(game.away)}
          align="start"
          ball={game.possession === 'away'}
          timeouts={crunch ? (game.timeouts?.away ?? null) : null}
        />
        <div
          aria-hidden="true"
          data-centre
          className="flex w-40 flex-col items-center leading-none sm:w-60"
        >
          {game.state === 'pre' ? (
            <time
              dateTime={game.startsAt}
              className="font-mono text-[13px] font-semibold text-slate-300 tabular-nums"
            >
              {formatTime(game.startsAt, mode)}
            </time>
          ) : (
            <span className="font-mono text-[15px] font-bold tabular-nums">
              <span
                className={`${dim(game.away) ? 'text-slate-500' : ''} ${flashing.includes('away') ? FLASH : ''}`}
              >
                {game.away.score ?? '-'}
              </span>
              <span className="px-1 text-slate-600">-</span>
              <span
                className={`${dim(game.home) ? 'text-slate-500' : ''} ${flashing.includes('home') ? FLASH : ''}`}
              >
                {game.home.score ?? '-'}
              </span>
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
            <span className="shrink-0">{status(game, now)}</span>
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
        <Side
          team={game.home}
          dim={dim(game.home)}
          align="end"
          ball={game.possession === 'home'}
          timeouts={crunch ? (game.timeouts?.home ?? null) : null}
        />
      </div>
    )
  }
}
