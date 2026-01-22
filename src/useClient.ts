import { useContext, useEffect, useState } from 'react'
import type { StreamrClient, StreamrClientConfig } from '@streamr/sdk'
import ClientContext from './ClientContext'
import useOpts from './useOpts'

const EMPTY_CONFIG = {}

const isSSR = typeof window === 'undefined'

async function getNewClient(config: StreamrClientConfig): Promise<StreamrClient | undefined> {
    if (config === EMPTY_CONFIG || isSSR) {
        return undefined
    }

    const { StreamrClient } = await import('@streamr/sdk')

    return new StreamrClient(config)
}

export default function useClient(
    config: StreamrClientConfig = EMPTY_CONFIG,
    cacheKey?: string | number | undefined
): StreamrClient | undefined {
    const parentClient = useContext(ClientContext)

    const [client, setClient] = useState<undefined | StreamrClient>()

    const conf = useOpts(config)

    useEffect(() => {
        let mounted = true

        if (conf === EMPTY_CONFIG) {
            // Leaving `config` out means we're gonna use the provided client.
            return void setClient(undefined)
        }

        void (async () => {
            const newClient = await getNewClient(conf)

            if (mounted) {
                return void setClient(newClient)
            }

            /**
             * Our newly created client goes to waste because the current
             * `useEffect` got unmounted in the process.
             */
            newClient?.destroy()
        })()

        return () => {
            mounted = false
        }
    }, [conf, cacheKey])

    useEffect(() => () => void client?.destroy(), [client])

    return config === EMPTY_CONFIG ? parentClient : client
}
