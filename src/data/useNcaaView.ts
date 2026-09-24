import { usePersistedChoice } from '../lib/usePersistedChoice'
import { NCAA_VIEWS, type NcaaView } from './leagues'

/** Top 25 / All FBS, persisted in localStorage. Defaults to Top 25. */
export function useNcaaView() {
  return usePersistedChoice<NcaaView>('covertwo:ncaa-view', NCAA_VIEWS, 'top25')
}
