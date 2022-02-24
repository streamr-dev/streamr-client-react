import { useContext, useEffect, useRef, useState } from 'react'
import eq from 'deep-equal'
import { StreamrClient, StreamrClientConfig } from 'streamr-client'
import ClientContext from './ClientContext'

const EMPTY_CONFIG = {}

const isSSR = typeof window === 'undefined'

function getNewClient(config: StreamrClientConfig): StreamrClient | undefined {
    if (config === EMPTY_CONFIG || isSSR) {
        return undefined
    }

    return new StreamrClient(config)
}

export default function useClient(config: StreamrClientConfig = EMPTY_CONFIG): StreamrClient | undefined {
    const configRef = useRef(config)

    const parentClient = useContext(ClientContext)

    const [client, setClient] = useState(() => getNewClient(config))

    useEffect(() => {
        if (config === EMPTY_CONFIG) {
            // Leaving `config` out means we're gonna use the provided client.
            return
        }

        if (eq(configRef.current, config)) {
            // Configuration hasn't changed. We don't need a new StreamrClient instance.
            return
        }

        configRef.current = config

        setClient(getNewClient(config))
    }, [config])

    useEffect(() => () => {
        client?.destroy()
    }, [client])

    return client || parentClient
}
