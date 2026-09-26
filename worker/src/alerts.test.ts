// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from 'vitest'
import fixture from '../../fixtures/espn-scoreboard.json'
import { subscribe, tick, unsubscribe, type Deps, type Storage, type Subscriber } from './alerts'

/** Durable Object storage, in memory. */
function memory(): Storage & { data: Map<string, unknown> } {
  const data = new Map<string, unknown>()
  return {
    data,
    get: async <T>(k: string) => data.get(k) as T | undefined,
    put: async (k, v) => void data.set(k, structuredClone(v)),
    delete: async (k) => data.delete(k),
    list: async <T>({ prefix }: { prefix: string }) =>
      new Map([...data].filter(([k]) => k.startsWith(prefix))) as Map<string, T>,
  }
}

const NOW = Date.parse('2026-09-20T20:00:00Z') // the fixture's moment: games live
/** The fixture, with Jacksonville (away at Denver, live) scoring a touchdown. */
const jaxTouchdown = () => {
  const json = structuredClone(fixture)
  const event = json.events.find((e) =>
    e.competitions[0]?.competitors.some((c) => c.team.abbreviation === 'JAX'),
  )
  const jax = event?.competitions[0]?.competitors.find((c) => c.team.abbreviation === 'JAX')
  if (!jax) throw new Error('no JAX')
  jax.score = String(Number(jax.score) + 7)
  return json
}
const JAX_ID = fixture.events
  .flatMap((e) => e.competitions[0]?.competitors ?? [])
  .find((c) => c.team.abbreviation === 'JAX')?.team.id as string

const subscriber = (endpoint: string, team: string | null = JAX_ID): Subscriber => ({
  subscription: { endpoint, keys: { p256dh: 'p', auth: 'a' } },
  prefs: {
    teams: { nfl: team, ncaaf: null },
    scores: true,
    kickoffFinal: true,
    close: false,
    upsets: false,
  },
})

let storage: ReturnType<typeof memory>
let deps: Deps
let espn: unknown
beforeEach(() => {
  storage = memory()
  espn = fixture
  deps = {
    storage,
    scoreboard: vi.fn(async () => espn),
    send: vi.fn(async () => 201),
    now: () => NOW,
  }
})

describe('alerts', () => {
  test("first look only remembers; a touchdown next minute alerts the team's fans", async () => {
    await subscribe(deps, subscriber('https://push.example/fan'))
    await subscribe(deps, subscriber('https://push.example/other', '999'))
    expect(await tick(deps)).toEqual({ looked: true, sent: 0 })
    espn = jaxTouchdown()
    expect(await tick(deps)).toEqual({ looked: true, sent: 1 })
    expect(deps.send).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: 'https://push.example/fan' }),
      expect.objectContaining({ kind: 'score', title: 'Touchdown, Jacksonville Jaguars' }),
    )
  })

  test('only fetches the leagues someone cares about', async () => {
    await subscribe(deps, subscriber('https://push.example/fan'))
    await tick(deps)
    expect(deps.scoreboard).toHaveBeenCalledTimes(1)
    expect(deps.scoreboard).toHaveBeenCalledWith('nfl', false)
  })

  test('with nothing live and the next kickoff far off, it waits instead of fetching', async () => {
    await subscribe(deps, subscriber('https://push.example/fan'))
    const json = structuredClone(fixture)
    for (const e of json.events) {
      e.status.type.state = 'pre'
      e.date = '2026-09-27T17:00:00Z' // a week later
    }
    espn = json
    await tick(deps)
    expect(await tick(deps)).toEqual({ looked: false, sent: 0 }) // an hour of quiet
    expect(deps.scoreboard).toHaveBeenCalledTimes(1)
  })

  test('a subscription the push service says is gone is removed', async () => {
    await subscribe(deps, subscriber('https://push.example/fan'))
    await tick(deps)
    deps.send = vi.fn(async () => 410)
    espn = jaxTouchdown()
    await tick(deps)
    expect((await storage.list({ prefix: 'sub:' })).size).toBe(0)
  })

  test('unsubscribe removes, and subscribing again updates instead of adding', async () => {
    await subscribe(deps, subscriber('https://push.example/fan'))
    await subscribe(deps, subscriber('https://push.example/fan', '1'))
    expect((await storage.list({ prefix: 'sub:' })).size).toBe(1)
    await unsubscribe(deps, 'https://push.example/fan')
    expect((await storage.list({ prefix: 'sub:' })).size).toBe(0)
  })

  test('a failed ESPN load looks again next minute and alerts nothing', async () => {
    await subscribe(deps, subscriber('https://push.example/fan'))
    deps.scoreboard = vi.fn(async () => {
      throw new Error('502')
    })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(await tick(deps)).toEqual({ looked: true, sent: 0 })
    expect(await storage.get('next')).toBe(NOW)
  })
})
