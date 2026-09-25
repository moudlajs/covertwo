import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import fixture from '../../fixtures/espn-scoreboard.json'
import { mapScoreboard } from '../data/espn'
import type { TimeMode } from '../time/format'
import { GameRow } from './GameRow'

const games = mapScoreboard(fixture)
const renderRow = (away: string, home: string, mode: TimeMode = 'eu') => {
  const game = games.find((g) => g.away.abbr === away && g.home.abbr === home)
  if (!game) throw new Error(`no ${away} @ ${home} in fixture`)
  return render(
    <ul>
      <GameRow game={game} mode={mode} />
    </ul>,
  )
}

describe('GameRow', () => {
  test('scheduled: kickoff time and network', () => {
    renderRow('MIA', 'SF')
    expect(screen.getByText('22:25')).toHaveAttribute('datetime', '2026-09-20T20:25:00.000Z')
    expect(screen.getByText('FOX')).toBeInTheDocument()
  })

  test('scheduled with only the day set: "TBD", no countdown', () => {
    const game = games.find((g) => g.away.abbr === 'MIA' && g.home.abbr === 'SF')
    if (!game) throw new Error('no MIA @ SF in fixture')
    render(
      <ul>
        <GameRow
          game={{ ...game, timeTbd: true }}
          mode="eu"
          now={Date.parse(game.startsAt) - 60_000}
        />
      </ul>,
    )
    expect(screen.getByText('TBD')).toBeInTheDocument()
    expect(screen.queryByText('22:25')).not.toBeInTheDocument()
    expect(screen.getByText('FOX')).toBeInTheDocument()
  })

  test('scheduled: kickoff follows the time mode', () => {
    renderRow('MIA', 'SF', 'us')
    expect(screen.getByText('4:25 PM')).toBeInTheDocument()
  })

  test('live: score and quarter clock', () => {
    renderRow('JAX', 'DEN')
    expect(
      screen.getByText(
        'Jacksonville Jaguars 17, Denver Broncos 10, Q3 · 8:42, 2nd & 7 at DEN 34, Jacksonville Jaguars ball',
      ),
    ).toHaveClass('sr-only')
    expect(screen.getByText('Q3 · 8:42')).toBeInTheDocument()
  })

  test('possession: football next to the team with the ball only', () => {
    const { container } = renderRow('WSH', 'DAL')
    const sides = container.querySelectorAll('[data-side]')
    const [away, home] = [...sides]
    expect(away?.querySelector('svg')).toBeNull()
    expect(home?.querySelector('svg')).not.toBeNull()
  })

  test('no football at halftime or in finals', () => {
    for (const [a, h] of [
      ['LV', 'LAC'],
      ['DET', 'BUF'],
    ] as const) {
      const { container, unmount } = renderRow(a, h)
      expect(container.querySelectorAll('svg')).toHaveLength(0)
      unmount()
    }
  })

  test('live: down & distance next to the clock', () => {
    renderRow('JAX', 'DEN')
    expect(screen.getByText('· 2nd & 7')).toBeInTheDocument()
    expect(screen.getByText('at DEN 34')).toHaveClass('hidden', 'sm:inline') // phones skip the spot
  })

  test('red zone: RZ tag, edge accent and spoken text', () => {
    renderRow('WSH', 'DAL')
    expect(screen.getByText('RZ')).toBeInTheDocument()
    expect(screen.getByRole('listitem')).toHaveClass('shadow-rose-500')
    expect(
      screen.getByText(
        /, red zone, Dallas Cowboys ball, timeouts: Washington Commanders 0, Dallas Cowboys 1$/,
      ),
    ).toHaveClass('sr-only')
  })

  test('no red zone marking outside it', () => {
    renderRow('JAX', 'DEN')
    expect(screen.queryByText('RZ')).not.toBeInTheDocument()
    expect(screen.getByRole('listitem')).not.toHaveClass('shadow-rose-500')
  })

  test('a changed score gets the flash, with a static fallback under reduced motion', () => {
    const game = games.find((g) => g.home.abbr === 'DAL')
    if (!game) throw new Error('no DAL game')
    render(
      <ul>
        <GameRow game={game} mode="eu" flashing={['home']} />
      </ul>,
    )
    const home = screen.getByText('20')
    expect(home).toHaveClass('animate-score-flash', 'motion-reduce:animate-none')
    expect(screen.getByText('23')).not.toHaveClass('animate-score-flash')
  })

  test('college ranks: number before the abbreviation, "No. 5" when spoken', async () => {
    const { mapScoreboard: map } = await import('../data/espn')
    const ncaaf = (await import('../../fixtures/espn-ncaaf-scoreboard.json')).default
    const game = map(ncaaf).find((g) => g.away.abbr === 'MIA')
    if (!game) throw new Error('no MIA game')
    const { container } = render(
      <ul>
        <GameRow game={game} mode="eu" />
      </ul>,
    )
    expect(container.querySelector('[data-side="away"]')).toHaveTextContent('5MIA')
    expect(
      screen.getByText(/^No\. 5 Miami Hurricanes 33, Wake Forest Demon Deacons 20/),
    ).toHaveClass('sr-only')
  })

  test('countdown within 12 hours of kickoff, next to the network', () => {
    const game = games.find((g) => g.away.abbr === 'MIA')
    if (!game) throw new Error('no MIA game')
    const kickoff = Date.parse(game.startsAt)
    const row = (now: number) => (
      <ul>
        <GameRow game={game} mode="eu" now={now} />
      </ul>
    )
    const { rerender } = render(row(kickoff - (2 * 60 + 14) * 60_000))
    expect(screen.getByText('FOX · in 2h 14m')).toBeInTheDocument()
    rerender(row(kickoff - 13 * 3_600_000))
    expect(screen.getByText('FOX')).toBeInTheDocument() // more than 12h away: no countdown
    rerender(row(kickoff + 60_000))
    expect(screen.getByText('FOX · starting')).toBeInTheDocument() // live comes from ESPN
  })

  test('rows stay calm: no last play or timeouts (they are in the expanded view)', () => {
    const { container } = renderRow('JAX', 'DEN')
    expect(container).not.toHaveTextContent('T.Etienne')
    expect(container.querySelector('p[title]')).toBeNull()
  })

  test('crunch time (Q4 1:54, 3-point game): "TO" under each team', () => {
    const { container } = renderRow('WSH', 'DAL')
    expect(container.querySelector('[data-side="away"]')).toHaveTextContent('TO 0')
    expect(container.querySelector('[data-side="home"]')).toHaveTextContent('TO 1')
  })

  test('outside crunch time: no "TO" in the row', () => {
    const { container } = renderRow('JAX', 'DEN') // Q3
    expect(container).not.toHaveTextContent(/TO \d/)
  })

  test('halftime', () => {
    renderRow('LV', 'LAC')
    expect(screen.getByText('Halftime')).toBeInTheDocument()
  })

  test('final: winner emphasised, loser dimmed', () => {
    renderRow('DET', 'BUF')
    expect(screen.getByText('Final')).toBeInTheDocument()
    expect(screen.getByText('31')).toHaveClass('text-slate-500')
    expect(screen.getByText('41')).not.toHaveClass('text-slate-500')
  })

  test('tied final dims neither team', () => {
    const base = games.find((g) => g.away.abbr === 'GB')
    if (!base) throw new Error('no GB game')
    const tie = {
      ...base,
      home: { ...base.home, score: 20, winner: false },
      away: { ...base.away, score: 20, winner: false },
    }
    render(
      <ul>
        <GameRow game={tie} mode="eu" />
      </ul>,
    )
    for (const score of screen.getAllByText('20')) expect(score).not.toHaveClass('text-slate-500')
  })

  test('overtime final', () => {
    renderRow('GB', 'NYJ')
    expect(screen.getByText('Final/OT')).toBeInTheDocument()
  })

  test('screen readers hear both teams, then the status', () => {
    const { container } = renderRow('DET', 'BUF')
    expect(screen.getByText('Detroit Lions 31, Buffalo Bills 41, Final')).toHaveClass('sr-only')
    for (const img of container.querySelectorAll('img')) expect(img).toHaveAttribute('alt', '')
  })

  test('scheduled summary names both teams and the kickoff', () => {
    renderRow('MIA', 'SF')
    expect(screen.getByText('Miami Dolphins at San Francisco 49ers, 22:25, FOX')).toHaveClass(
      'sr-only',
    )
  })
})
