import { ScoreList } from './components/ScoreList'
import { Segmented } from './components/Segmented'
import { Shell } from './components/Shell'
import { useScoreboard } from './data/useScoreboard'
import { useTimeMode } from './time/useTimeMode'

export default function App() {
  const { games, status } = useScoreboard()
  const [mode, setMode] = useTimeMode()

  return (
    <Shell
      footer={<span>ESPN</span>}
      controls={
        <Segmented
          label="Time zone"
          name="time-mode"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'eu', label: 'EU' },
            { value: 'us', label: 'US' },
          ]}
        />
      }
    >
      {status === 'loading' && games.length === 0 ? (
        <p className="px-3 py-6 text-center font-mono text-xs text-slate-500">Loading…</p>
      ) : (
        <ScoreList games={games} mode={mode} />
      )}
    </Shell>
  )
}
