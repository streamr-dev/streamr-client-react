import { useContext, useEffect, useReducer, useRef, useState } from 'react'
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
    config: StreamrClientConfig = EMPTY_CONFIG,
    cacheKey?: string | number | undefined
): StreamrClient | undefined {
    const parentClient = useContext(ClientContext)

    const [client, setClient] = useState<undefined | StreamrClient>()

    const conf = useOpts(config)

    const lastAttemptAtRef = useRef(0)

    useEffect(() => {
        let mounted = true

        if (conf === EMPTY_CONFIG) {
            // Leaving `config` out means we're gonna use the provided client.
            return void setClient(undefined)
        }

        void (async () => {
            /**
             * Freeze new client creations for a max of 2s. Background: if each new
             * client instance fails to take off (gets destroyed immediately) we'd
             * normally end up in an endless loop of failed attempts.
             */
            const freezeMillis = Math.max(0, 2000 - (Date.now() - lastAttemptAtRef.current))

            if (freezeMillis) {
                await new Promise((resolve) => void setTimeout(resolve, freezeMillis))

                if (!mounted) {
                    return
                }
            }

            lastAttemptAtRef.current = Date.now()

            const newClient = await getNewClient(conf)

            if (newClient) {
                // @ts-expect-error `destroySignal` is private and there's no `onDestroy` on the client.
                newClient.destroySignal.onDestroy.listen(() => {
                    if (!mounted) {
                        return
                    }

                    /**
                     * Only reset the client if the current on is the one we remember. Otherwise
                     * we may be destroying valid instances. It'd be a no-no.
                     */
                    setClient((c) => (c === newClient ? void 0 : c))
                })
            }

            if (!mounted) {
                return
            }

            setClient(newClient)
        })()

        return () => {
            mounted = false
        }
    }, [conf, cacheKey])

    useEffect(() => () => void client?.destroy(), [client])

    return config === EMPTY_CONFIG ? parentClient : client
}
