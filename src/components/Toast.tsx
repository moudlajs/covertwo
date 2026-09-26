import { useEffect, useState } from 'react'

/** How long a message stays up. */
export const TOAST_MS = 2200

/**
 * A one-line message saying what a tap just did, just above the footer (Shell
 * puts it inside the sticky footer, so it follows it on short and long pages). `message.id` changes with every new message, even a repeated one.
 */
export function Toast({ message }: { message: { text: string; id: number } | null }) {
  const [shown, setShown] = useState<number | null>(null)
  const [prevId, setPrevId] = useState<number | null>(null)
  if (message && message.id !== prevId) {
    setPrevId(message.id)
    setShown(message.id)
  }
  useEffect(() => {
    if (shown === null) return
    const id = setTimeout(() => setShown(null), TOAST_MS)
    return () => clearTimeout(id)
  }, [shown])
  const visible = message !== null && shown === message.id
  // The live region stays mounted so each message is announced. Polite live
  // region rather than role=status: the footer's status (offline, retrying)
  // stays the page's one status.
  return (
    <div
      aria-live="polite"
      data-testid="toast"
      className="pointer-events-none absolute inset-x-0 bottom-full mb-2 flex justify-center px-4 font-normal"
    >
      {visible && (
        <span className="rounded-md bg-slate-100 px-3 py-1.5 font-mono text-[11px] text-slate-950 shadow-lg">
          {message.text}
        </span>
      )}
    </div>
  )
}
