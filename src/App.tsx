import { ScoreList } from './components/ScoreList'
import { Shell } from './components/Shell'
import { useScoreboard } from './data/useScoreboard'

export default function App() {
  const { games, status } = useScoreboard()

  return (
    <Shell footer={<span>ESPN</span>}>
      {status === 'loading' && games.length === 0 ? (
        <p className="px-3 py-6 text-center font-mono text-xs text-slate-500">Loading…</p>
      ) : (
        <ScoreList games={games} mode="eu" />
      )}
    </Shell>
  )
}
