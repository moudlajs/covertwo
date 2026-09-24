import { usePersistedChoice } from '../lib/usePersistedChoice'
import { CONFERENCE_CHOICES, type ConferenceChoice } from './leagues'

/** College conference filter, persisted in localStorage. Defaults to all. */
export function useConference() {
  return usePersistedChoice<ConferenceChoice>('covertwo:conference', CONFERENCE_CHOICES, 'all')
}
