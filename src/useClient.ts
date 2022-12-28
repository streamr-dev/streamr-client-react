import { useContext, useEffect, useRef, useState } from 'react'
import eq from 'deep-equal'
import type { StreamrClient, StreamrClientConfig } from 'streamr-client'
import ClientContext from './ClientContext'

const EMPTY_CONFIG = {}

const isSSR = typeof window === 'undefined'

async function getNewClient(config: StreamrClientConfig): Promise<StreamrClient | undefined> {
    if (config === EMPTY_CONFIG || isSSR) {
        return undefined
    }

    const StreamrClient = (await import('streamr-client')).default

    return new StreamrClient(config)
}

export default function useClient(
    config: StreamrClientConfig = EMPTY_CONFIG
): StreamrClient | undefined {
    const parentClient = useContext(ClientContext)

    const [client, setClient] = useState<undefined | StreamrClient>()

    const configRef = useRef<undefined | StreamrClientConfig>()

    useEffect(() => {
        let mounted = true

        if (config === EMPTY_CONFIG) {
            // Leaving `config` out means we're gonna use the provided client.
            return
        }

        if (eq(configRef.current, config)) {
            // Configuration hasn't changed. We don't need a new StreamrClient instance.
            return
        }

        configRef.current = config

        async function fn(cfg: StreamrClientConfig) {
            const newClient = await getNewClient(cfg)

            if (!mounted) {
                return
            }

            setClient(newClient)
        }

        fn(config)

        return () => {
            mounted = false
        }
    }, [config])

    useEffect(
        () => () => {
            client?.destroy()
        },
        [client]
    )

    return config === EMPTY_CONFIG ? parentClient : client
}
