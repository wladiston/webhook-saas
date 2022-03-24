import * as crypto from 'crypto'
import fetch from 'node-fetch'
import {v4 as uuidv4} from 'uuid'

import type {Response} from 'node-fetch'

export type Environment = 'sandbox' | 'production'

export type EventType = string

export type Hook = {
  url: string
  events?: EventType[]
}

export type Body = {
  id: string
  type: EventType
  idempotency_key: string
  api_version: string
  created: number
  data?: unknown
}

export type onDoneCallback = (
  url: string,
  body: Body,
  response: Response,
) => void | Promise<void>

export type WebhooksProps = {
  /**
   * Version of the API
   */
  api_version: string

  /**
   * Secret used to verify the webhooks
   * @default undefined
   * @example "this-is-a-secret"
   */
  secret: string

  /**
   * Array of webhooks to send the events to
   * @default []
   */
  hooks?: Hook[]

  /**
   * Mode of which this webhooks instance is running in
   * @default "sandbox"
   */
  mode?: Environment

  /**
   * Name of the webhooks instance to be sent in the request header
   * @default undefined
   * @example "EatingDots"
   *
   * It will be sent in the header as:
   * X-EatingDots-Signature: <signature>
   */
  name?: string
}

/**
 * Utility to create a new secret
 * @param length Length of the secret
 * @returns
 */
export function createSecret(length = 32): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let secret = ''
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < length; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return secret
}

/**
 * Get the signature of the data
 * @param secret secret used to sign the data
 * @param body data to sign
 * @returns
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSignature(secret: string, body: string) {
  return crypto.createHmac('sha256', secret).update(body).digest('hex')
}

/**
 * Check if the signature is valid
 * @param secret secret used to verify the signature
 * @param signature signature to verify
 * @param body data to verify
 * @returns boolean
 */
export function verifySignature(
  secret: string,
  signature: string,
  body: string,
): boolean {
  const hash = getSignature(secret, body)
  return hash === signature
}

/**
 * Webhooks class
 * @class
 * @param {WebhooksProps} props
 * @example
 * const webhooks = new WebhookClient({
 *  api_version: '2020-08-27',
 *  hooks: [
 *   {
 *      url: "https://user-hook.com",
 *      events: ["did_something"],
 *   },
 *  ],
 *  mode: "sandbox",
 *  secret: "this-is-a-secret",
 *  name: "EatingDots",
 * });
 *
 * webhooks.add(
 *  "http://another-user-hook.com",
 *  ["something_else"],
 * );
 *
 * webhooks.trigger("did_something", {
 *  name: "John Doe",
 *  age: 42,
 * });
 */
export class WebhookClient<Type extends EventType> {
  readonly hooks: Hook[]

  private secret: string

  private name?: string

  private mode: Environment

  private api_version: string

  private internalEvent: onDoneCallback[]

  constructor({
    // eslint-disable-next-line camelcase
    api_version,
    hooks = [],
    name,
    secret,
    mode = 'sandbox',
  }: WebhooksProps) {
    // eslint-disable-next-line camelcase
    this.api_version = api_version
    this.hooks = hooks
    this.secret = secret
    this.mode = mode
    this.name = name
    this.internalEvent = []
  }

  /**
   * Send a POST to all webhooks
   * @param type event name to trigger
   * @param data data to send to the webhook
   * @returns Promise that resolves when all webhooks have been triggered
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public trigger(type: Type, data?: any) {
    const webhooks = this.getWebhooks(type)

    return Promise.all(
      webhooks.map(({url}) =>
        this.post(url, {
          idempotency_key: uuidv4(),
          api_version: this.api_version,
          type,
          data,
        }),
      ),
    )
  }

  /**
   * Add a URL to the list of webhooks with their respective events
   * @param url url to add
   * @param events events that will trigger this url
   */
  public add(url: string, events?: Type[]) {
    const hook: Hook = {
      url,
      events,
    }
    this.hooks.push(hook)
  }

  /**
   * The $on() method allows you to subscribe to internal events. With those you can subscribe to listen what happen to the hook.
   * @param callback callback to execute when the hook is triggered
   */
  public $onDone(callback: onDoneCallback) {
    this.internalEvent.push(callback)
  }

  /**
   * Get the webhooks for a given event
   * @param event event name to get webhooks for
   * @returns
   */
  private getWebhooks(event: Type): Hook[] {
    return this.hooks.filter(webhook => {
      if (webhook.events) {
        return webhook.events.includes(event)
      }
      return true
    })
  }

  /**
   * Trigger a webhook
   * @param webhook
   * @param data
   * @returns
   */
  private async post(url: string, data: Omit<Body, 'id' | 'created'>) {
    const hookData = {
      ...data,
      id: uuidv4(),
      created: Date.now(),
    }

    const body = JSON.stringify(hookData ?? {})
    const headers = {
      'Content-Type': 'application/json',
      'X-Environment': this.mode,
      [`X${this.name ? `-${this.name}` : ''}-Signature`]: getSignature(
        this.secret,
        body,
      ),
    }

    const options = {
      method: 'POST',
      headers,
      body,
    }

    const result = await fetch(url, options)

    await Promise.all(
      this.internalEvent.map(callback => callback(url, hookData, result)),
    )

    return result
  }
}
