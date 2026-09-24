import type { Game } from './game'

/** All 32 NFL teams by ESPN id, so a favourite can be picked in its bye week too. */
export const NFL_TEAMS: { id: string; name: string }[] = [
  { id: '22', name: 'Arizona Cardinals' },
  { id: '1', name: 'Atlanta Falcons' },
  { id: '33', name: 'Baltimore Ravens' },
  { id: '2', name: 'Buffalo Bills' },
  { id: '29', name: 'Carolina Panthers' },
  { id: '3', name: 'Chicago Bears' },
  { id: '4', name: 'Cincinnati Bengals' },
  { id: '5', name: 'Cleveland Browns' },
  { id: '6', name: 'Dallas Cowboys' },
  { id: '7', name: 'Denver Broncos' },
  { id: '8', name: 'Detroit Lions' },
  { id: '9', name: 'Green Bay Packers' },
  { id: '34', name: 'Houston Texans' },
  { id: '11', name: 'Indianapolis Colts' },
  { id: '30', name: 'Jacksonville Jaguars' },
  { id: '12', name: 'Kansas City Chiefs' },
  { id: '13', name: 'Las Vegas Raiders' },
  { id: '24', name: 'Los Angeles Chargers' },
  { id: '14', name: 'Los Angeles Rams' },
  { id: '15', name: 'Miami Dolphins' },
  { id: '16', name: 'Minnesota Vikings' },
  { id: '17', name: 'New England Patriots' },
  { id: '18', name: 'New Orleans Saints' },
  { id: '19', name: 'New York Giants' },
  { id: '20', name: 'New York Jets' },
  { id: '21', name: 'Philadelphia Eagles' },
  { id: '23', name: 'Pittsburgh Steelers' },
  { id: '25', name: 'San Francisco 49ers' },
  { id: '26', name: 'Seattle Seahawks' },
  { id: '27', name: 'Tampa Bay Buccaneers' },
  { id: '10', name: 'Tennessee Titans' },
  { id: '28', name: 'Washington Commanders' },
]

/** Teams playing in the given games, by name; for college, where the list is huge. */
export function teamsIn(games: Game[]): { id: string; name: string }[] {
  const byId = new Map<string, string>()
  for (const g of games) for (const t of [g.home, g.away]) byId.set(t.id, t.name)
  return [...byId].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
}
