import { LoadError } from './components/LoadError'
import { Menu } from './components/Menu'
import { Retrying } from './components/Retrying'
import { ScoreList } from './components/ScoreList'
import { Segmented } from './components/Segmented'
import { Shell } from './components/Shell'
import { Skeleton } from './components/Skeleton'
import { UpdatedAgo } from './components/UpdatedAgo'
import { useScoreboard } from './data/useScoreboard'
import { useScoreChanges } from './data/useScoreChanges'
import { useTimeMode } from './time/useTimeMode'

export default function App() {
  const { games, status, lastUpdated, live, retry } = useScoreboard()
  const [mode, setMode] = useTimeMode()
  const changes = useScoreChanges(games)
  const empty = games.length === 0
  // Nothing has loaded yet (as opposed to a genuinely empty week).
  const never = lastUpdated === null

  return (
    <Shell
      footer={
        <>
          <span>ESPN</span>
          {/* Always mounted so screen readers announce score changes. */}
          <span aria-live="polite" className="sr-only">
            {changes.announcement}
          </span>
          <span className="flex items-center gap-2">
            <Retrying active={status === 'error' && !never} />
            <UpdatedAgo at={lastUpdated} live={live} />
          </span>
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
        <ScoreList games={games} mode={mode} flashing={changes.flashing} />
      )}
    </Shell>
  )
}
