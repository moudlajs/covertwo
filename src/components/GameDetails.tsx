import type { Game, Leader } from '../data/game'

const LEADER_LABELS = { passing: 'PASS', rushing: 'RUSH', receiving: 'REC' } as const

/** Quarter-by-quarter score and the game's top passer, rusher and receiver. */
export function GameDetails({ id, game, hidden }: { id: string; game: Game; hidden: boolean }) {
  const { quarters } = game
  const periods = quarters?.home.length ?? 0
  const label = (i: number) => (i < 4 ? String(i + 1) : i === 4 ? 'OT' : `OT${i - 3}`)
  const leaders = Object.entries(game.leaders) as [keyof typeof LEADER_LABELS, Leader][]

  return (
    <div
      id={id}
      hidden={hidden}
      className="space-y-2 px-3 pt-1 pb-2.5 font-mono text-[10px] text-slate-400"
    >
      {quarters && (
        <table className="mx-auto tabular-nums">
          <caption className="sr-only">Score by quarter</caption>
          <thead>
            <tr className="text-slate-500">
              <th scope="col" className="pr-3 text-left font-normal">
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
                <th scope="row" className="pr-3 text-left font-bold text-slate-300">
                  {game[side].abbr}
                </th>
                {quarters[side].map((points, i) => (
                  <td key={i} className="text-center">
                    {points}
                  </td>
                ))}
                <td className="text-center font-bold text-slate-200">{game[side].score ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {leaders.length > 0 && (
        <ul className="mx-auto w-fit space-y-0.5">
          {leaders.map(([key, leader]) => (
            <li key={key} className="flex gap-2">
              <span className="w-8 text-amber-400/80">{LEADER_LABELS[key]}</span>
              <span className="text-slate-300">
                {leader.name} <span className="text-slate-500">{game[leader.side].abbr}</span>
              </span>
              <span>{leader.line}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
