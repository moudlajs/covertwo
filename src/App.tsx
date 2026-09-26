import { useEffect, useMemo, useState } from 'react'
import { LoadError } from './components/LoadError'
import { Retrying } from './components/Retrying'
import { ScoreList } from './components/ScoreList'
import { Segmented } from './components/Segmented'
import { Shell } from './components/Shell'
import { Skeleton } from './components/Skeleton'
import { UpdatedAgo } from './components/UpdatedAgo'
import { LEAGUES, scoreboardUrl, top25With, type League } from './data/leagues'
import { useLeague } from './data/useLeague'
import { useNcaaView } from './data/useNcaaView'
import { useFavorites } from './data/useFavorites'
import { FBS_TEAMS, NFL_TEAMS } from './data/teams'
import { FavoriteButton } from './components/FavoriteButton'
import { KeepAwakeButton } from './components/KeepAwakeButton'
import { Toast } from './components/Toast'
import { AlertsButton } from './components/AlertsButton'
import { useAlerts } from './lib/useAlerts'
import { useKeepAwake, useWakeLock, wakeLockSupported } from './lib/useWakeLock'
import { useScoreboard } from './data/useScoreboard'
import { useScoreChanges } from './data/useScoreChanges'
import { documentTitle } from './data/title'
import { useTimeMode } from './time/useTimeMode'
import { useNow } from './lib/useNow'
import { WeekPicker } from './components/WeekPicker'
import type { Season } from './data/season'
import { DEMO, DEMO_NOW } from './lib/demo'
import { NextUp } from './components/NextUp'
import { isOffDay } from './time/days'
import { RoundAhead } from './components/RoundAhead'
import { ThemeContext, useTheme } from './lib/theme'
import { ThemeToggle } from './components/ThemeToggle'
import { undecided } from './data/game'
import { darkLogo } from './data/logos'
import { saveLogos } from './lib/offline'

export default function App() {
  const [league, setLeague] = useLeague()
  const [ncaaView, setNcaaView] = useNcaaView()
  const [favorites, setFavorite] = useFavorites()
  const favorite = favorites[league]
  // A college favourite may be unranked, so their game needs the full FBS slate.
  const collegeFavorite = league === 'ncaaf' ? (favorite?.id ?? null) : null
  // The week being viewed: null = ESPN's current week. Resets on league switch.
  const [week, setWeek] = useState<string | null>(null)
  const board = useScoreboard(scoreboardUrl(league, ncaaView, collegeFavorite !== null, week))
  const { status, lastUpdated, live, retry } = board
  const [keepAwake, setKeepAwake] = useKeepAwake()
  const alerts = useAlerts(favorites)
  // A one-line message saying what a header tap did.
  const [toast, setToast] = useState<{ text: string; id: number } | null>(null)
  const say = (text: string) => setToast((t) => ({ text, id: (t?.id ?? 0) + 1 }))
  // Memoized: useScoreChanges detects new data by array identity.
  const games = useMemo(
    () =>
      collegeFavorite && ncaaView === 'top25'
        ? top25With(board.games, collegeFavorite)
        : board.games,
    [board.games, collegeFavorite, ncaaView],
  )
  // The season calendar, remembered from a current-week response (only those
  // know which week is current), per league.
  const [known, setKnown] = useState<{ league: League; season: Season } | null>(null)
  if (week === null && board.season && (known?.league !== league || known.season !== board.season))
    setKnown({ league, season: board.season })
  const season = known?.league === league ? known.season : null
  const isCurrentWeek = week === null || week === season?.current
  const shownWeek = week ?? season?.current ?? null
  const [mode, setMode] = useTimeMode()
  const [theme, setTheme] = useTheme()
  const clock = useNow(60_000) // kickoff countdowns tick by the minute
  const now = DEMO ? DEMO_NOW : clock
  const changes = useScoreChanges(games)
  // The logos on the board, for offline use (the variant this theme shows).
  useEffect(() => {
    const logo = (src: string) => (theme === 'dark' ? darkLogo(src) : src)
    saveLogos(games.flatMap((g) => [logo(g.home.logo), logo(g.away.logo)]).filter(Boolean))
  }, [games, theme])
  const title = documentTitle(games, favorite?.id)
  useEffect(() => {
    document.title = title
  }, [title])
  const empty = games.length === 0
  // Live on the board you see. `live` (from the hook) covers everything loaded,
  // which with a college favourite includes games filtered out of Top 25; that
  // one keeps driving polling, this one drives the next-up card.
  const liveShown = games.some((g) => g.state === 'in')
  // Only while a game on your board is live: the scoreboard on the table during the game.
  useWakeLock(keepAwake && liveShown)
  // The next-up card, the resting board and folding are about "now": current week only.
  const offDay = isCurrentWeek && !empty && isOffDay(games, now, mode)
  // A future playoff round: no team in it is known yet.
  const roundAhead = !empty && games.every((g) => undecided(g.home) && undecided(g.away))
  const round = season?.weeks.find((w) => w.id === shownWeek)?.label ?? 'Playoffs'
  // Nothing has loaded yet (as opposed to a genuinely empty week).
  const never = lastUpdated === null

  return (
    <ThemeContext value={theme}>
      <Shell
        league={
          <Segmented
            label="League"
            name="league"
            value={league}
            onChange={(l) => {
              setLeague(l)
              setWeek(null) // another league, another calendar: back to its current week
            }}
            options={(Object.keys(LEAGUES) as League[]).map((id) => ({
              value: id,
              label: LEAGUES[id].label,
            }))}
          />
        }
        view={
          <div className="flex items-center gap-2">
            {/* No picker in demo mode: every week would show the same built-in data. */}
            {!DEMO && season && shownWeek && (
              <WeekPicker
                season={season}
                value={shownWeek}
                onChange={(id) => setWeek(id === season.current ? null : id)}
              />
            )}
            {league === 'ncaaf' && (
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
            )}
          </div>
        }
        toast={<Toast message={toast} />}
        footer={
          <>
            <span>
              ESPN · v{__APP_VERSION__} ·{' '}
              <a
                href="https://github.com/moudlajs/covertwo"
                className="underline decoration-slate-600 underline-offset-2 hover:text-slate-300"
              >
                source
              </a>
            </span>
            {/* Always mounted so screen readers announce score changes. */}
            <span aria-live="polite" className="sr-only">
              {changes.announcement}
            </span>
            <span className="flex items-center gap-2">
              {/* offline: a saved copy with no network; "updated" then says how old it is. */}
              <Retrying active={status === 'error' && !never} offline={board.offline} />
              <UpdatedAgo at={lastUpdated} live={live} />
            </span>
          </>
        }
        controls={
          <>
            <FavoriteButton
              teams={league === 'nfl' ? NFL_TEAMS : FBS_TEAMS}
              value={favorite}
              onChange={(f) => {
                setFavorite(league, f)
                say(f ? `${f.name} pinned to the top` : 'No team pinned')
              }}
            />
            {wakeLockSupported() && (
              <KeepAwakeButton
                value={keepAwake}
                onChange={(on) => {
                  setKeepAwake(on)
                  say(on ? 'Screen stays on while games are live' : 'Screen sleeps as usual')
                }}
              />
            )}
            <AlertsButton
              state={alerts.state}
              prefs={alerts.prefs}
              busy={alerts.busy}
              failed={alerts.failed}
              teams={[favorites.nfl?.name, favorites.ncaaf?.name].filter((n): n is string => !!n)}
              onOn={alerts.on}
              onOff={alerts.off}
              onPref={alerts.setPref}
              testResult={alerts.testResult}
              onTest={() => void alerts.test()}
            />
            <ThemeToggle theme={theme} onChange={setTheme} />
            <span aria-hidden="true" className="mx-0.5 h-5 w-px bg-slate-700" />
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
        ) : roundAhead ? (
          <RoundAhead games={games} round={round} mode={mode} />
        ) : (
          <>
            {/* Whenever nothing is live: the next kickoff (or a done week on an off day). */}
            {isCurrentWeek && !liveShown && (
              <NextUp games={games} now={now} mode={mode} offDay={offDay} />
            )}
            {/* A resting board on days without games: still readable, just quieter. */}
            <div className={offDay ? 'opacity-75 saturate-50' : undefined}>
              <ScoreList
                games={games}
                mode={mode}
                flashing={changes.flashing}
                favorite={favorite?.id}
                now={now}
                league={league}
                foldPast={isCurrentWeek}
              />
            </div>
          </>
        )}
      </Shell>
    </ThemeContext>
  )
}
