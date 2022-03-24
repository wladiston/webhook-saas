import fetch from 'node-fetch'
import {beforeEach, expect, test, vi} from 'vitest'

import {createSecret, verifySignature, WebhookClient} from '../src'

vi.mock('node-fetch')

let webhooks: WebhookClient<'did_something' | 'something_else'>

beforeEach(() => {
  webhooks = new WebhookClient({
    api_version: '2020-08-27',
    secret: 'this-is-a-secret',
  })
  vi.resetAllMocks()
})

test('nothing should happen', () => {
  webhooks.trigger('did_something')
})

test('should trigger', async () => {
  const userHook = 'https://myhook.com'

  const data = {
    name: 'John Doe',
    age: 42,
  }

  webhooks.add(userHook, ['did_something'])
  await webhooks.trigger('did_something', data)

  expect(fetch).toHaveBeenCalled()
  expect(fetch).toHaveBeenCalledTimes(1)
  expect(fetch).toBeCalledWith(
    userHook,
    expect.objectContaining({
      body: expect.stringContaining(JSON.stringify(data)),
    }),
  )
})

test('should not trigger a different event', async () => {
  const userHook = 'https://myhook.com'

  webhooks.add(userHook, ['did_something'])
  await webhooks.trigger('something_else')

  expect(fetch).not.toHaveBeenCalled()
})

test('should send the correct headers', async () => {
  const secret = createSecret()
  const mode = 'production'
  const name = 'EatingDots'
  const url = 'https://localhost/webhook'
  const event = 'did_something'
  const data = {
    name: 'John Doe',
    age: 42,
  }

  webhooks = new WebhookClient({
    api_version: '2020-08-27',
    hooks: [{url, events: [event]}],
    secret,
    name,
    mode,
  })

  await webhooks.trigger('did_something', data)

  expect(fetch).toHaveBeenCalled()
  expect(fetch).toHaveBeenCalledTimes(1)
  expect(fetch).toBeCalledWith(
    url,
    expect.objectContaining({
      headers: expect.objectContaining({
        'X-Environment': mode,
        [`X-${name}-Signature`]: expect.stringMatching(/.+/),
      }),
    }),
  )

  // @ts-expect-error
  const fetched = fetch.mock.calls[0][1]
  const signature = fetched.headers[`X-${name}-Signature`]
  const {body} = fetched

  expect(verifySignature(secret, signature, body)).toBeTruthy()
})

test('should trigger onDone function', async () => {
  const mocked = vi.fn()
  const data = {name: 'John Doe'}
  const response = 'RESPONSE'
  const url = 'https://myhook.com'

  // @ts-expect-error
  fetch.mockResolvedValue(response)

  webhooks.$onDone(mocked)
  webhooks.add(url, ['did_something'])

  await webhooks.trigger('did_something', data)

  expect(mocked).toBeCalledWith(
    url,
    expect.objectContaining({
      data,
    }),
    response,
  )
})
