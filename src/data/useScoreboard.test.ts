import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import fixture from '../../fixtures/espn-scoreboard.json'
import { useScoreboard } from './useScoreboard'

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
