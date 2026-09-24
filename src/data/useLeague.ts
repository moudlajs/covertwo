import { usePersistedChoice } from '../lib/usePersistedChoice'
import type { League } from './leagues'

const LEAGUE_IDS = ['nfl', 'ncaaf'] as const satisfies readonly League[]

/** NFL/NCAA, persisted in localStorage. Defaults to NFL. */
export function useLeague() {
  return usePersistedChoice<League>('covertwo:league', LEAGUE_IDS, 'nfl')
}
