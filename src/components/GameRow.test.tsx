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
    const sides = container.querySelectorAll('li > div[aria-hidden="true"]')
    const [away, , home] = [...sides]
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
