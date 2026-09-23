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
    expect(screen.getByRole('listitem')).toHaveTextContent(/17.*to 10/)
    expect(screen.getByText('Q3 · 8:42')).toBeInTheDocument()
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

  test('overtime final', () => {
    renderRow('GB', 'NYJ')
    expect(screen.getByText('Final/OT')).toBeInTheDocument()
  })

  test('team names are available to screen readers, logos are decorative', () => {
    const { container } = renderRow('DET', 'BUF')
    expect(screen.getByText('Detroit Lions')).toHaveClass('sr-only')
    expect(screen.getByText('Buffalo Bills')).toHaveClass('sr-only')
    for (const img of container.querySelectorAll('img')) expect(img).toHaveAttribute('alt', '')
  })
})
