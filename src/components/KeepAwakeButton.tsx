import { ICON_BUTTON, ICON_BUTTON_ON } from './iconButton'

/** ☕ in the header: keep the screen on while games are live. Amber while on. */
export function KeepAwakeButton({
  value,
  onChange,
}: {
  value: boolean
  onChange: (on: boolean) => void
}) {
  return (
    <button
      type="button"
      aria-pressed={value}
      aria-label="Keep screen on during live games"
      onClick={() => onChange(!value)}
      className={`${ICON_BUTTON} ${value ? ICON_BUTTON_ON : ''}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-[18px]"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 10h12v4a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" />
        <path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16" />
        <path d="M8 3c-.8 1 .8 2 0 3M12 3c-.8 1 .8 2 0 3" />
      </svg>
    </button>
  )
}
