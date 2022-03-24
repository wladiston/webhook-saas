# Webhook for SaaS 💘

This project is intended to provide some useful utilities for implementing a webhook solution for your SaaS. This client can be used in *any* Node.js or TypeScript backend application.

## Features

- [x] Support for versioning
- [x] Multiple URLs
- [x] Sandbox and production environment
- [x] Support for subscribe to internal events
- [] Retry failed attempts

## Installing

```bash
npm i webhook-saas

# or using yarn
yarn add webhook-saas
```

## Usage

```tsx
import {WebhookClient} from 'webhook-sass'

// Initialize the webhooks
const webhooks = new WebhookClient({
  api_version: '2020-08-27',
  hooks: [
    {
      url: 'https://user-webhook1....',
      events: ['did_something'],
    },
    {
      url: 'https://user-webhook2....',
      events: ['something_else'],
    },
  ],
  mode: 'sandbox',
  secret: 'user-is-a-secret',
  name: 'EatingDots',
})

// add more as you wish...
webhooks.add(
  'https://afraid-catfish-7.hooks.n8n.cloud/webhook-test/59534d6e-d946-4803-8ea8-bda7c4a93682',
  ['did_something'],
)

webooks.$onDone((url, body) => {}

// trigger the event passing any data
webhooks.trigger('did_something', {
  name: 'John Doe',
  age: 42,
})
```

All requests will be called as a `POST` method passing the following headers

- `Content-Type: application/json`
- `X-Signature: <SIGNATURE>` or `X-[name]-Signature: <SIGNATURE>`
- `X-Environment: production`

and the body will be sent in the following format

```json
{
  "id": "8a54a77b-3f6c-448e-9543-a16dab096989",
  "created": 1648135876829,
  "idempotency_key": "d572e209-4292-4243-b53b-2c6bad7a8bfd",
  "api_version": "2020-08-27",
  "type": "event-triggered",
  "data": <DATA_SENT>
}
```

### Webhook Security

Webhook messages are signed so that your app can verify that the sender is the original sender. Webhooks requests contain an `X-Signature` header. The value of this field is a lowercased hexadecimal HMAC signature of the webhook HTTP request body, using the client secret as a key and SHA256 as the hash function.

Python Example

```
digester = hmac.new(secret, webhook_body, hashlib.sha256)
return digester.hexdigest()
```

Optionally you can use the helper functions to help you create secrets and validate the signature

```tsx
import {createSecret} from 'webhook-sass'

// useful if you want to generate a client secret 
const secret = createSecret()

...
//
import {verifySignature} from 'webhook-sass'

const valid = verifySignature(secret: string, signature: string, body: string)
```

## Endpoint example

```tsx
// This is your test secret API key.
const webhook = require('webhook-saas')
const endpointSecret = '...';
const express = require('express');
const app = express();

app.post('/webhook', express.raw({type: 'application/json'}), (request, response) => {
  let event = request.body;
  
  // Only verify the event if you have an endpoint secret defined.
  // Otherwise use the basic event deserialized with JSON.parse
  if (endpointSecret) {
    // Get the signature sent by Stripe
    const signature = request.headers['X-Signature'];
		const valid = webhook.verifySignature(
        endpointSecret,
        signature,
        request.body
      );

    if(!valid){
		try {
      console.log(`⚠️  Webhook signature verification failed.`, err.message);
      return response.sendStatus(400);
    }
  }

  // Handle the event
  switch (event.type) {
    case 'myevent.succeeded':
      const data = event.data;
      console.log(`myevent.succeeded was successful!`, data);
      break;
    default:
      // Unexpected event type
      console.log(`Unhandled event type ${event.type}.`);
  }

  // Return a 200 response to acknowledge receipt of the event
  response.send();
});

app.listen(4242, () => console.log('Running on port 4242'));
```

## Authors

- **Wlad Paiva** - [EatingDots](http://eatingdots.com)

## Acknowledgments

- Inspired by Stripe API
