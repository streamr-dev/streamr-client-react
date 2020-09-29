# Streamr-client-react ✨

React hooks and components for [`streamr-client`](https://github.com/streamr-dev/streamr-client-javascript).

## Installation

```
npm install streamr-client-react
```

## Usage

The following example shows how to easily inject a `StreamrClient` instance into your app and log
messages going through a selected stream.

```jsx
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

```jsx
const OhMyStreamr = () => {
    const client = useClient()

    client.publish('STREAM ID', {
        temperature: 25.4,
    })
}
```

Refer to [`streamr-client`](https://github.com/streamr-dev/streamr-client-javascript) for more options.
