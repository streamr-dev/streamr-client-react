import { useContext, useEffect, useReducer, useState } from 'react'
import type { StreamrClient, StreamrClientConfig } from 'streamr-client'
import ClientContext from './ClientContext'
import useOpts from './useOpts'

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

    const conf = useOpts(config)

    const [cacheKey, invalidate] = useReducer((x) => x + 1, 0)

    useEffect(() => {
        let mounted = true

        if (conf === EMPTY_CONFIG) {
            // Leaving `config` out means we're gonna use the provided client.
            return
        }

        async function fn() {
            const newClient = await getNewClient(conf)

            if (newClient) {
                // @ts-expect-error `destroySignal` is private and there's no `onDestroy` on the client.
                newClient.destroySignal.onDestroy.listen(() => {
                    invalidate()
                })
            }

            if (!mounted) {
                return
            }

            setClient(newClient)
        }

        fn()

        return () => {
            mounted = false
        }
    }, [conf, cacheKey])

    useEffect(
        () => () => {
            client?.destroy()
        },
        [client]
    )

    return config === EMPTY_CONFIG ? parentClient : client
}
