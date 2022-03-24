import type { Response } from 'node-fetch';
export declare type Environment = 'sandbox' | 'production';
export declare type EventType = string;
export declare type Hook = {
    url: string;
    events?: EventType[];
};
export declare type Body = {
    id: string;
    type: EventType;
    idempotency_key: string;
    api_version: string;
    created: number;
    data?: unknown;
};
export declare type onDoneCallback = (url: string, body: Body, response: Response) => void | Promise<void>;
export declare type WebhooksProps = {
    /**
     * Version of the API
     */
    api_version: string;
    /**
     * Secret used to verify the webhooks
     * @default undefined
     * @example "this-is-a-secret"
     */
    secret: string;
    /**
     * Array of webhooks to send the events to
     * @default []
     */
    hooks?: Hook[];
    /**
     * Mode of which this webhooks instance is running in
     * @default "sandbox"
     */
    mode?: Environment;
    /**
     * Name of the webhooks instance to be sent in the request header
     * @default undefined
     * @example "EatingDots"
     *
     * It will be sent in the header as:
     * X-EatingDots-Signature: <signature>
     */
    name?: string;
};
/**
 * Utility to create a new secret
 * @param length Length of the secret
 * @returns
 */
export declare function createSecret(length?: number): string;
/**
 * Check if the signature is valid
 * @param secret secret used to verify the signature
 * @param signature signature to verify
 * @param body data to verify
 * @returns boolean
 */
export declare function verifySignature(secret: string, signature: string, body: string): boolean;
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
export declare class WebhookClient<Type extends EventType> {
    readonly hooks: Hook[];
    private secret;
    private name?;
    private mode;
    private api_version;
    private internalEvent;
    constructor({ api_version, hooks, name, secret, mode, }: WebhooksProps);
    /**
     * Send a POST to all webhooks
     * @param type event name to trigger
     * @param data data to send to the webhook
     * @returns Promise that resolves when all webhooks have been triggered
     */
    trigger(type: Type, data?: any): Promise<Response[]>;
    /**
     * Add a URL to the list of webhooks with their respective events
     * @param url url to add
     * @param events events that will trigger this url
     */
    add(url: string, events?: Type[]): void;
    /**
     * The $on() method allows you to subscribe to internal events. With those you can subscribe to listen what happen to the hook.
     * @param callback callback to execute when the hook is triggered
     */
    $onDone(callback: onDoneCallback): void;
    /**
     * Get the webhooks for a given event
     * @param event event name to get webhooks for
     * @returns
     */
    private getWebhooks;
    /**
     * Trigger a webhook
     * @param webhook
     * @param data
     * @returns
     */
    private post;
}
