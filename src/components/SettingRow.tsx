import type { ReactNode } from 'react'

/** Row layout shared by every menu setting: name and hint on the left, the control on the right. */
export const ROW =
  'flex items-center gap-3 border-t border-slate-800 px-3.5 py-2.5 first:border-t-0'

/** The left side of a setting row. */
export function SettingText({ name, hint }: { name: string; hint: ReactNode }) {
  return (
    <span className="grid flex-1 gap-0.5 whitespace-nowrap">
      <span className="text-[12px] text-slate-100">{name}</span>
      <span className="text-[10.5px] text-slate-500">{hint}</span>
    </span>
  )
}
