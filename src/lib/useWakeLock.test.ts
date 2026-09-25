import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { useKeepAwake, useWakeLock } from './useWakeLock'

// A fake wake lock: tracks requests and lets the test drop locks like a hidden tab does.
let locks: { released: boolean; release: () => Promise<void> }[] = []
let visibility: DocumentVisibilityState = 'visible'
const request = vi.fn(async () => {
  const lock = {
    released: false,
    release: vi.fn(async () => {
      lock.released = true
    }),
  }
  locks.push(lock)
  return lock
})
const held = () => locks.filter((l) => !l.released).length
const setVisibility = (v: DocumentVisibilityState) => {
  visibility = v
  if (v === 'hidden') locks.forEach((l) => (l.released = true)) // the browser drops it
  document.dispatchEvent(new Event('visibilitychange'))
}

beforeEach(() => {
  locks = []
  visibility = 'visible'
  request.mockClear()
  vi.stubGlobal('navigator', { ...navigator, wakeLock: { request } })
  vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility)
  localStorage.clear()
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

const flush = () => act(async () => {})

test('holds the lock only while active', async () => {
  const { rerender } = renderHook(({ on }) => useWakeLock(on), { initialProps: { on: false } })
  await flush()
  expect(request).not.toHaveBeenCalled()
  rerender({ on: true })
  await flush()
  expect(held()).toBe(1)
  rerender({ on: false }) // games over
  await flush()
  expect(held()).toBe(0)
})

test('takes the lock again when the tab comes back', async () => {
  renderHook(() => useWakeLock(true))
  await flush()
  await act(async () => setVisibility('hidden'))
  expect(held()).toBe(0)
  await act(async () => setVisibility('visible'))
  expect(held()).toBe(1)
  expect(request).toHaveBeenCalledTimes(2)
})

test('back-to-back visibility events request only one lock', async () => {
  renderHook(() => useWakeLock(true))
  await act(async () => {
    document.dispatchEvent(new Event('visibilitychange'))
    document.dispatchEvent(new Event('visibilitychange'))
  })
  expect(request).toHaveBeenCalledTimes(1)
  expect(held()).toBe(1)
})

test('a refused request is fine', async () => {
  request.mockRejectedValueOnce(new Error('NotAllowedError'))
  renderHook(() => useWakeLock(true))
  await flush()
  expect(held()).toBe(0)
})

test('the setting is off by default and remembered', () => {
  const { result, unmount } = renderHook(() => useKeepAwake())
  expect(result.current[0]).toBe(false)
  act(() => result.current[1](true))
  unmount()
  expect(renderHook(() => useKeepAwake()).result.current[0]).toBe(true)
})
