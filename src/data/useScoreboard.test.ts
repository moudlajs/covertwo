import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import fixture from '../../fixtures/espn-scoreboard.json'
import { POLL_MS, useScoreboard } from './useScoreboard'

/** The fixture with every live game turned final. */
const allFinal = {
  ...fixture,
  events: fixture.events.map((e) =>
    e.status.type.state === 'in'
      ? { ...e, status: { ...e.status, type: { ...e.status.type, state: 'post' } } }
      : e,
  ),
}

const ok = () => Promise.resolve(new Response(JSON.stringify(fixture)))
let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  fetchMock = vi.fn(ok)
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

test('loads once on mount', async () => {
  const { result } = renderHook(() => useScoreboard())
  expect(result.current.status).toBe('loading')
  await waitFor(() => expect(result.current.status).toBe('ready'))
  expect(result.current.games).toHaveLength(16)
  expect(result.current.lastUpdated).toEqual(expect.any(Number))
  expect(fetchMock).toHaveBeenCalledTimes(1)
})

test('refetches when the window regains focus', async () => {
  const { result } = renderHook(() => useScoreboard())
  await waitFor(() => expect(result.current.status).toBe('ready'))
  act(() => {
    window.dispatchEvent(new Event('focus'))
  })
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
})

test('refetches when the tab becomes visible', async () => {
  const { result } = renderHook(() => useScoreboard())
  await waitFor(() => expect(result.current.status).toBe('ready'))
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
})

test('keeps previous games and logs context when a refetch fails', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})
  const { result } = renderHook(() => useScoreboard())
  await waitFor(() => expect(result.current.status).toBe('ready'))
  fetchMock.mockResolvedValueOnce(new Response('', { status: 503 }))
  act(() => {
    window.dispatchEvent(new Event('focus'))
  })
  await waitFor(() => expect(result.current.status).toBe('error'))
  expect(result.current.games).toHaveLength(16)
  expect(error).toHaveBeenCalledWith(
    '[scoreboard] load failed',
    expect.objectContaining({ url: expect.stringContaining('scoreboard'), status: 503 }),
  )
})

describe('live polling', () => {
  // Fake clock that still advances with real time, so waitFor keeps polling;
  // the 30s interval only fires when a test jumps the clock.
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  const tick = () =>
    act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_MS)
    })

  test('polls every 30s while a game is live', async () => {
    const { result } = renderHook(() => useScoreboard())
    await waitFor(() => expect(result.current.status).toBe('ready'))
    await tick()
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    await tick()
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3))
  })

  test('does not poll when no game is live', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(new Response(JSON.stringify(allFinal))))
    const { result } = renderHook(() => useScoreboard())
    await waitFor(() => expect(result.current.status).toBe('ready'))
    await tick()
    await tick()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  test('stops polling once the last live game ends', async () => {
    const { result } = renderHook(() => useScoreboard())
    await waitFor(() => expect(result.current.status).toBe('ready'))
    fetchMock.mockImplementation(() => Promise.resolve(new Response(JSON.stringify(allFinal))))
    await tick()
    await waitFor(() => expect(result.current.games.some((g) => g.state === 'in')).toBe(false))
    await tick()
    await tick()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  test('skips polls while the tab is hidden', async () => {
    const { result } = renderHook(() => useScoreboard())
    await waitFor(() => expect(result.current.status).toBe('ready'))
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    await tick()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  test('clears the interval on unmount', async () => {
    const { result, unmount } = renderHook(() => useScoreboard())
    await waitFor(() => expect(result.current.status).toBe('ready'))
    unmount()
    await tick()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
