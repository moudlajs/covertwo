import { usePersistedChoice } from '../lib/usePersistedChoice'
import type { TimeMode } from './format'

const MODES = ['eu', 'us'] as const satisfies readonly TimeMode[]

/** EU/US time mode, persisted in localStorage. Defaults to EU. */
export function useTimeMode() {
  return usePersistedChoice<TimeMode>('covertwo:time-mode', MODES, 'eu')
}
