import { GameRow } from './components/GameRow'
import { Shell } from './components/Shell'
import { useScoreboard } from './data/useScoreboard'

export default function App() {
  const { games, status } = useScoreboard()
  const sorted = [...games].sort((a, b) => a.startsAt.localeCompare(b.startsAt))

  return (
    <Shell footer={<span>ESPN</span>}>
      {status === 'loading' && games.length === 0 ? (
        <p className="px-3 py-6 text-center font-mono text-xs text-slate-500">Loading…</p>
      ) : (
        <ul aria-label="Games" className="divide-y divide-slate-800/70">
          {sorted.map((g) => (
            <GameRow key={g.id} game={g} mode="eu" />
          ))}
        </ul>
      )}
    </Shell>
  )
}
