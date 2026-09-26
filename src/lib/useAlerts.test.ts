import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import * as push from './push'
import { useAlerts } from './useAlerts'

vi.mock('./push', async (original) => ({
  ...(await original<typeof import('./push')>()),
  pushState: vi.fn(async () => 'on'),
  sendTest: vi.fn(),
  sync: vi.fn(async () => {}),
}))

const favorites = { nfl: { id: '33', name: 'Baltimore Ravens' }, ncaaf: null }

beforeEach(() => {
  vi.mocked(push.sendTest).mockReset()
  vi.mocked(push.sync).mockClear()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

async function testWith(...results: (Awaited<ReturnType<typeof push.sendTest>> | Error)[]) {
  for (const r of results)
    vi.mocked(push.sendTest).mockImplementationOnce(async () => {
      if (r instanceof Error) throw r
      return r
    })
  const { result } = renderHook(() => useAlerts(favorites))
  await waitFor(() => expect(result.current.state).toBe('on'))
  await act(() => result.current.test())
  return result.current.testResult
}

test('sent', async () => {
  expect(await testWith('sent')).toBe('Sent. It should be on your lock screen in a moment.')
})

test('too soon', async () => {
  expect(await testWith('wait')).toBe('Just sent one. Try again in a few seconds.')
})

test('unknown to the server: registers again and retries once', async () => {
  expect(await testWith('gone', 'sent')).toMatch(/^Sent/)
  expect(push.sync).toHaveBeenCalled()
  expect(push.sendTest).toHaveBeenCalledTimes(2)
})

test('still unknown after the retry', async () => {
  expect(await testWith('gone', 'gone')).toMatch(/doesn't know this device/)
})

test('refused by the push service, with its status', async () => {
  expect(await testWith(403)).toBe(
    'The push service refused it (403). Turn alerts off and on again.',
  )
  expect(await testWith(0)).toMatch(/\(no answer\)/)
})

test('server unreachable', async () => {
  expect(await testWith(new Error('offline'))).toMatch(/Couldn't reach/)
})
