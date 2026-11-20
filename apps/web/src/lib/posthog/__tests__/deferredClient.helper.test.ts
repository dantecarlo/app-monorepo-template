import { expect, test, vi } from 'vitest'

import { createDeferredClient } from '@/lib/posthog/deferredClient.helper'

interface IProbeClient {
  receive: (value: number) => void
}

const LIMIT = 3

// A client whose load the test settles by hand.
const probe = () => {
  const client: IProbeClient = { receive: vi.fn() }
  const gate: { resolve?: (loaded: IProbeClient) => void } = {}
  const loading = new Promise<IProbeClient>((resolve) => {
    gate.resolve = resolve
  })
  return {
    client,
    deferred: createDeferredClient<IProbeClient>({ limit: LIMIT }),
    finish: () => gate.resolve?.(client),
    load: vi.fn(() => loading)
  }
}

const send =
  (value: number) =>
  (client: IProbeClient): void =>
    client.receive(value)

test('drops a call while nothing is loading', async () => {
  const { client, deferred } = probe()

  deferred.run(send(1))

  expect(client.receive).not.toHaveBeenCalled()
  expect(await deferred.settled()).toBeUndefined()
})

test('holds the calls made during the load and hands them over in order', async () => {
  const { client, deferred, finish, load } = probe()

  const started = deferred.start({ load })
  deferred.run(send(1))
  deferred.run(send(2))
  expect(client.receive).not.toHaveBeenCalled()
  finish()

  expect(await started).toBe(client)
  expect(vi.mocked(client.receive).mock.calls).toEqual([[1], [2]])
  deferred.run(send(3))
  expect(client.receive).toHaveBeenLastCalledWith(3)
})

test('runs each held call on its own when one throws', async () => {
  const { client, deferred, finish, load } = probe()

  const started = deferred.start({ load })
  deferred.run(send(1))
  deferred.run(() => {
    throw new Error('the SDK refused the call')
  })
  deferred.run(send(3))
  finish()

  expect(await started).toBe(client)
  expect(vi.mocked(client.receive).mock.calls).toEqual([[1], [3]])
  expect(await deferred.settled()).toBe(client)
})

test('drops the oldest held call when the queue is full', async () => {
  const { client, deferred, finish, load } = probe()

  const started = deferred.start({ load })
  ;[1, 2, 3, 4].forEach((value) => deferred.run(send(value)))
  finish()
  await started

  expect(vi.mocked(client.receive).mock.calls).toEqual([[2], [3], [4]])
})

test('starts one load however often it is started', async () => {
  const { client, deferred, finish, load } = probe()

  const first = deferred.start({ load })
  const second = deferred.start({ load })
  finish()

  expect(await first).toBe(client)
  expect(await second).toBe(client)
  expect(await deferred.start({ load })).toBe(client)
  expect(await deferred.settled()).toBe(client)
  expect(load).toHaveBeenCalledOnce()
})

test('drops the held calls and loads nothing when the load fails', async () => {
  const { client, deferred } = probe()
  const load = vi.fn(() => Promise.reject(new Error('chunk failed')))

  const started = deferred.start({ load })
  deferred.run(send(1))

  expect(await started).toBeUndefined()
  deferred.run(send(2))
  expect(client.receive).not.toHaveBeenCalled()
  expect(await deferred.settled()).toBeUndefined()
})

test('stop forgets the client and the held calls, during a load too', async () => {
  const { client, deferred, finish, load } = probe()

  const started = deferred.start({ load })
  deferred.run(send(1))
  const stopped = deferred.stop()
  finish()

  expect(await started).toBeUndefined()
  // Only the stop is handed the client the interrupted load brings.
  expect(await stopped).toBe(client)
  expect(await deferred.settled()).toBeUndefined()
  deferred.run(send(2))
  expect(client.receive).not.toHaveBeenCalled()
  expect(await deferred.start({ load })).toBe(client)
  expect(load).toHaveBeenCalledTimes(2)
})

test('stop hands over the loaded client, or none while nothing has loaded', async () => {
  const { client, deferred, finish, load } = probe()

  expect(await deferred.stop()).toBeUndefined()
  const started = deferred.start({ load })
  finish()
  await started

  expect(await deferred.stop()).toBe(client)
  expect(await deferred.settled()).toBeUndefined()
})
