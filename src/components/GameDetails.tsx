import { Fragment, type ReactNode } from 'react'
import type { Game, Leader } from '../data/game'

const LEADER_LABELS = { passing: 'PASS', rushing: 'RUSH', receiving: 'REC' } as const

/** Quarter-by-quarter score and the game's top passer, rusher and receiver. */
export function GameDetails({ id, game, hidden }: { id: string; game: Game; hidden: boolean }) {
  const { quarters } = game
  const periods = quarters?.home.length ?? 0
  const label = (i: number) => (i < 4 ? String(i + 1) : i === 4 ? 'OT' : `OT${i - 3}`)
  const leaders = Object.entries(game.leaders) as [keyof typeof LEADER_LABELS, Leader][]

  const lines: [string, ReactNode][] = []
  if (game.lastPlay) lines.push(['PLAY', game.lastPlay])
  if (game.timeouts)
    lines.push([
      'TO',
      `${game.away.abbr} ${game.timeouts.away} · ${game.home.abbr} ${game.timeouts.home}`,
    ])
  for (const [key, leader] of leaders)
    lines.push([
      LEADER_LABELS[key],
      <>
        <span className="text-slate-300">{leader.name}</span>{' '}
        <span className="text-slate-500">{game[leader.side].abbr}</span> {leader.line}
      </>,
    ])

  // One block, one left edge: the table and a label/value list share it, and
  // long values (a last play) wrap under their own text, not under the label.
  return (
    <div id={id} hidden={hidden} className="px-3 pt-1 pb-2.5 font-mono text-[10px] text-slate-400">
      <div className="mx-auto w-fit max-w-full space-y-2">
        {quarters && (
          <table className="tabular-nums">
            <caption className="sr-only">Score by quarter</caption>
            <thead>
              <tr className="text-slate-500">
                <th scope="col" className="w-12 text-left font-normal">
                  <span className="sr-only">Team</span>
                </th>
                {Array.from({ length: periods }, (_, i) => (
                  <th key={i} scope="col" className="w-6 text-center font-normal">
                    {label(i)}
                  </th>
                ))}
                <th scope="col" className="w-7 text-center font-normal">
                  T
                </th>
              </tr>
            </thead>
            <tbody>
              {(['away', 'home'] as const).map((side) => (
                <tr key={side}>
                  <th scope="row" className="text-left font-bold text-slate-300">
                    {game[side].abbr}
                  </th>
                  {quarters[side].map((points, i) => (
                    <td key={i} className="text-center">
                      {points}
                    </td>
                  ))}
                  <td className="text-center font-bold text-slate-200">
                    {game[side].score ?? '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {lines.length > 0 && (
          <dl className="grid max-w-[48ch] grid-cols-[3rem_1fr] gap-y-0.5">
            {lines.map(([name, value]) => (
              <Fragment key={name}>
                <dt className="text-amber-400/80">{name}</dt>
                <dd>{value}</dd>
              </Fragment>
            ))}
          </dl>
        )}
      </div>
    </div>
  )
}
