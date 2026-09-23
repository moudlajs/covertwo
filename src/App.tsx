import { LoadError } from './components/LoadError'
import { Menu } from './components/Menu'
import { Retrying } from './components/Retrying'
import { ScoreList } from './components/ScoreList'
import { Segmented } from './components/Segmented'
import { Shell } from './components/Shell'
import { useScoreboard } from './data/useScoreboard'
import { useTimeMode } from './time/useTimeMode'

export default function App() {
  const { games, status, retry } = useScoreboard()
  const [mode, setMode] = useTimeMode()
  const empty = games.length === 0

  return (
    <Shell
      footer={
        <>
          <span>ESPN</span>
          <Retrying active={status === 'error' && !empty} />
        </>
      }
      controls={
        <>
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
          <Menu />
        </>
      }
    >
      {status === 'error' && empty ? (
        <LoadError onRetry={retry} />
      ) : status === 'loading' && empty ? (
        <p className="px-3 py-6 text-center font-mono text-xs text-slate-500">Loading…</p>
      ) : (
        <ScoreList games={games} mode={mode} />
      )}
    </Shell>
  )
}
