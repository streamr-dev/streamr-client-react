# Streamr-client-react ✨

React hooks and components for [`@streamr/sdk`](https://github.com/streamr-dev/network/tree/main/packages/client).

## Installation

Using `npm`, install the library, and save it to your `package.json` dependencies.

```
npm i streamr-client-react
```

The library relies on a collection of peer dependencies:

```
process ^0.11.10
react >=16.8.0
react-fast-compare ^3.2.0
@streamr/sdk >= 102.0.0
```

Make sure you install them, too!

## API

### Components

#### `Provider`

It holds its own `StreamrClient` instance and – by utilizing the [Context API](https://reactjs.org/docs/context.html) – makes it available to all its children components.

```typescript
import Provider from 'streamr-client-react'

function App() {
    return <Provider {...options}>You can use `useClient` here!</Provider>
}
```

---

#### `ClientContext`

If you wanna hack your way around the `useClient` hook for some wholesome reason and directly access the client instance provided by the `Provider` component this is where you start.

```typescript
import { useContext } from 'react'
import type { StreamrClient } from '@streamr/sdk'
import { ClientContext } from 'streamr-client-react'

function SqrtOfFoo() {
    const client: undefined | StreamrClient = useContext(ClientContext)

    return null
}
```

### Hooks

#### `useClient(config?: StreamrClientConfig)`

```tsx
import { useClient } from 'streamr-client-react'
```

If `config` is given, `useClient` gives you a new instance of the client. The hook uses [`react-fast-compare`](https://github.com/FormidableLabs/react-fast-compare) to avoid unreasonable creation of new instances.

If `config` is skipped, it's gonna return an instance provided by the `Provider` component (`undefined` by default).

See [Config.ts](https://github.com/streamr-dev/network/blob/main/packages/client/src/Config.ts) for more details on `StreamrClientConfig`.

---

#### `useSubscribe(streamId: string, options?: Options)`

```tsx
import { useSubscribe } from 'streamr-client-react'
```

It allows you to conveniently subscribe to streams.

```typescript
import type { ResendOptions, StreamMessage } from '@streamr/sdk'

interface Options {
    // Changing `cacheKey` will drop the old subscription and start a new one.
    cacheKey?: number | string
    // Set `disabled` to true to make it idle, or to make it drop the previous subscription
    // and then idle.
    disabled?: boolean
    // You can either skip undecoded messages (true), or treat them as other messages (false), and
    // handle their undecoded content on your own. Useful when you have to show "something".
    // Default: false
    ignoreUndecodedMessages?: boolean
    // A callback triggered after you're done with a subscription and with processing messages.
    onAfterFinish?: () => void
    // A callback triggered before subscribing.
    onBeforeStart?: () => void
    // A callback triggered when the client fails at subscribing.
    onError?: (e: any) => void
    // *The* on-message callback.
    onMessage?: (msg: StreamMessage) => void
    // A callback triggered when the client fails to decode a massage.
    onMessageError?: (e: any) => void
    // Resend instructions. `undefined` by default (= don't resend anything).
    resendOptions?: ResendOptions
}
```

`onAfterFinish`, `onBeforeStart`, `onError`, `onMessage`, and `onMessageError` are all kept as refs (see [`useRef`](https://reactjs.org/docs/hooks-reference.html#useref)) internally, and for that reason changing them does not trigger resubscribing. Additionally, we track changes to `resendOptions` using [`react-fast-compare`](https://github.com/FormidableLabs/react-fast-compare) to avoid excessive resubscribing.

See

-   [`client/src/subscribe/Resends.ts`](https://github.com/streamr-dev/network/blob/main/packages/client/src/subscribe/Resends.ts) for more details on `ResendOptions`.

---

#### `useResend(streamId: string, resendOptions: ResendOptions, options?: Options)`

```tsx
import { useResend } from 'streamr-client-react'
```

It allows you to resend historical messages without subscribing to the real-time messages.

```typescript
import type { ResendOptions, Message } from '@streamr/sdk'

interface Options {
    // Changing `cacheKey` will drop the old subscription and start a new one.
    cacheKey?: number | string
    // Set `disabled` to true to make it idle, or to make it drop the previous subscription
    // and then idle.
    disabled?: boolean
    // You can either skip undecoded messages (true), or treat them as other messages (false), and
    // handle their undecoded content on your own. Useful when you have to show "something".
    // Default is false.
    ignoreUndecodedMessages?: boolean
    // A callback triggered after you're done with a subscription and with processing messages.
    onAfterFinish?: () => void
    // A callback triggered before subscribing.
    onBeforeStart?: () => void
    // A callback triggered when the client fails at subscribing.
    onError?: (e: any) => void
    // *The* on-message callback.
    onMessage?: (msg: Message) => void
    // A callback triggered when the client fails to decode a massage.
    onMessageError?: (e: any) => void
}
```

See

-   [`client/src/subscribe/Resends.ts`](https://github.com/streamr-dev/network/blob/main/packages/client/src/subscribe/Resends.ts) for more details on `ResendOptions`.
-   [`client/src/Message.ts`](https://github.com/streamr-dev/network/blob/main/packages/client/src/Message.ts) for more details on `Message`.

### Utils

#### `subscribe(streamId: string, client: StreamrClient, options?: Options)`

```tsx
import { subscribe } from 'streamr-client-react'
```

Subscribes to a stream and returns an object with 2 asynchrounous methods: `next` and `abort`. Example:

```typescript
async function foo(streamId: string, client: StreamrClient) {
    const queue = subscribe(streamId, client)

    while (true) {
        const { value: msg, done } = await queue.next()

        if (msg) {
            // Do something with a message here.
        }

        if (done) {
            break
        }
    }

    // Use `queue.abort()` to unsubscribe.
}
```

Available options:

```typescript
interface Options {
    // You can either skip undecoded messages (true), or treat them as other messages (false), and
    // handle their undecoded content on your own. Useful when you have to show "something".
    // Default is false.
    ignoreUndecodedMessages?: boolean
    // A callback triggered when the client fails at subscribing.
    onError?: (e: any) => void
    // Resend instructions. `undefined` by default (= don't resend anything).
    onMessageError?: (e: any) => void
}
```

---

#### `resend(streamId: string, resendOptions: ResendOptions, streamrClient: StreamrClient, options?: Options)`

```tsx
import { resend } from 'streamr-client-react'
```

Subscribes to a stream of historical messages (only) and returns an object with 2 asynchrounous methods: `next` and `abort`. Example:

```typescript
async function foo(streamId: string, client: StreamrClient) {
    const queue = resend(streamId, { last: 10 }, client)

    while (true) {
        const { value: msg, done } = await queue.next()

        if (msg) {
            // Do something with a message here.
        }

        if (done) {
            break
        }
    }

    // Use `queue.abort()` to ignore further data.
}
```

`subscribe` and `resend` share the options.
