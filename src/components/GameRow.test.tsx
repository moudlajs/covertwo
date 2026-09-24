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
        'Jacksonville Jaguars 17, Denver Broncos 10, Q3 · 8:42, 2nd & 7 at DEN 34, Jacksonville Jaguars ball, timeouts left: Jacksonville Jaguars 2 timeouts, Denver Broncos 3 timeouts. Last play: T.Etienne run up the middle to DEN 34 for 3 yards.',
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
    expect(screen.getByText(/, red zone, Dallas Cowboys ball,/)).toHaveClass('sr-only')
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

  test('timeouts: filled pips per side, spoken with correct plural', () => {
    const { container } = renderRow('WSH', 'DAL')
    const sides = [...container.querySelectorAll('[data-side]')]
    const filled = (side: Element | undefined) =>
      [...(side?.querySelectorAll('span.rounded-full') ?? [])].filter((pip) =>
        pip.className.includes('bg-amber-400'),
      ).length
    expect(filled(sides[0])).toBe(0) // WSH
    expect(filled(sides[1])).toBe(1) // DAL
    expect(
      screen.getByText(
        /timeouts left: Washington Commanders 0 timeouts, Dallas Cowboys 1 timeout\./,
      ),
    ).toHaveClass('sr-only')
  })

  test('no timeouts outside live games', () => {
    const { container } = renderRow('DET', 'BUF')
    expect(container.querySelector('span.rounded-full.bg-slate-700')).toBeNull()
  })

  test('last play: one truncated line with the full text on hover', () => {
    renderRow('JAX', 'DEN')
    const line = screen.getByTitle('T.Etienne run up the middle to DEN 34 for 3 yards.')
    expect(line).toHaveClass('truncate', 'col-span-3')
  })

  test('no last-play line outside live games', () => {
    const { container } = renderRow('DET', 'BUF')
    expect(container.querySelector('p[title]')).toBeNull()
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
