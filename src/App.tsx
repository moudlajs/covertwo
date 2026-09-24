import { LoadError } from './components/LoadError'
import { Menu } from './components/Menu'
import { Retrying } from './components/Retrying'
import { ScoreList } from './components/ScoreList'
import { Segmented } from './components/Segmented'
import { Shell } from './components/Shell'
import { Skeleton } from './components/Skeleton'
import { useScoreboard } from './data/useScoreboard'
import { useTimeMode } from './time/useTimeMode'

export default function App() {
  const { games, status, lastUpdated, retry } = useScoreboard()
  const [mode, setMode] = useTimeMode()
  const empty = games.length === 0
  // Nothing has loaded yet (as opposed to a genuinely empty week).
  const never = lastUpdated === null

  return (
    <Shell
      footer={
        <>
          <span>ESPN</span>
          <Retrying active={status === 'error' && !never} />
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
      {status === 'error' && never ? (
        <LoadError onRetry={retry} />
      ) : status === 'loading' && never ? (
        <Skeleton />
      ) : empty ? (
        <p className="px-3 py-8 text-center font-mono text-xs text-slate-500">
          No games scheduled.
        </p>
      ) : (
        <ScoreList games={games} mode={mode} />
      )}
    </Shell>
  )
}
