import { useEffect } from 'react'
import { LoadError } from './components/LoadError'
import { Menu } from './components/Menu'
import { Retrying } from './components/Retrying'
import { ScoreList } from './components/ScoreList'
import { Segmented } from './components/Segmented'
import { Shell } from './components/Shell'
import { Skeleton } from './components/Skeleton'
import { UpdatedAgo } from './components/UpdatedAgo'
import { LEAGUES, scoreboardUrl, type League } from './data/leagues'
import { useLeague } from './data/useLeague'
import { useNcaaView } from './data/useNcaaView'
import { useScoreboard } from './data/useScoreboard'
import { useScoreChanges } from './data/useScoreChanges'
import { documentTitle } from './data/title'
import { useTimeMode } from './time/useTimeMode'

export default function App() {
  const [league, setLeague] = useLeague()
  const [ncaaView, setNcaaView] = useNcaaView()
  const { games, status, lastUpdated, live, retry } = useScoreboard(scoreboardUrl(league, ncaaView))
  const [mode, setMode] = useTimeMode()
  const changes = useScoreChanges(games)
  const title = documentTitle(games)
  useEffect(() => {
    document.title = title
  }, [title])
  const empty = games.length === 0
  // Nothing has loaded yet (as opposed to a genuinely empty week).
  const never = lastUpdated === null

  return (
    <Shell
      league={
        <Segmented
          label="League"
          name="league"
          value={league}
          onChange={setLeague}
          options={(Object.keys(LEAGUES) as League[]).map((id) => ({
            value: id,
            label: LEAGUES[id].label,
          }))}
        />
      }
      toolbar={
        league === 'ncaaf' && (
          <Segmented
            label="College games"
            name="ncaa-view"
            value={ncaaView}
            onChange={setNcaaView}
            options={[
              { value: 'top25', label: 'Top 25' },
              { value: 'fbs', label: 'All FBS' },
            ]}
          />
        )
      }
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
