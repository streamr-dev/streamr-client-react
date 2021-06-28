# Streamr Client React ✨

React hooks and components for [`streamr-client`](https://github.com/streamr-dev/streamr-client-javascript).

## Installation

```
npm install streamr-client-react
```

## Usage

### Subscribing to a stream

The following example shows how to easily inject a `StreamrClient` instance into your app and log
messages going through a selected stream.

```jsx
import { useCallback } from 'react';
import Provider, { useSubscription } from 'streamr-client-react'

const OhMyStreamr = () => {
    const onMessage = useCallback((message) => {
        console.log(message)
    }, [])

    useSubscription({
        stream: 'STREAM ID',
        // For more options see
        // https://github.com/streamr-dev/streamr-client-javascript#subscription-options
    }, onMessage)
}

const App = () => {
    const streamrClientOptions = {
        // For options see
        // https://github.com/streamr-dev/streamr-client-javascript#client-options
    }

    return (
        <Provider {...streamrClientOptions}>
            <OhMyStreamr />
        </Provider>
    )
```

`useSubscription` is a wrapper around `client.subscribe` and is built using `useClient`
hook. Getting the client for arbitrary use is simple.

### Publishing to a stream

```jsx
import { useClient } from 'streamr-client-react';
const OhMyStreamr = () => {
    const client = useClient()

    client.publish('STREAM ID', {
        temperature: 25.4,
    })
}
```

### Authentication Options

Authenticating with an Ethereum private key:

```jsx
<Provider auth={{
    privateKey: 'your-private-key'
}}>
    {...}
</Provider>
```

Authenticating with an Ethereum private key contained in an Ethereum (web3) provider:

```jsx
<Provider auth={{
    ethereum: window.ethereum
}}>
    {...}
</Provider
```

Authenticating with a pre-existing session token, for internal use by the Streamr app

```jsx
<Provider auth={{
    sessionToken: 'session-token'
}}>
    {...}
</Provider
```

### Connecting

By default the client will automatically connect and disconnect as needed, ideally you should not need to manage connection state explicitly. Specifically, it will automatically connect when you publish or subscribe, and automatically disconnect once all subscriptions are removed and no messages were recently published. This behaviour can be disabled using the autoConnect & autoDisconnect options when creating a Provider instance.

```jsx
<Provider 
    auth={{
        privateKey: 'your-private-key'
    }}
    autoDisconnect={false}
    autoConnect={false}
>
    {...}
</Provider>
```

Refer to [`streamr-client`](https://github.com/streamr-dev/streamr-client-javascript) for more options.
