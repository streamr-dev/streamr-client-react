import React, { createContext, useContext, FunctionComponent, useMemo, useEffect, useState, useRef, useReducer } from 'react'
import StreamrClient from 'streamr-client'
import eq from 'deep-equal'
import useIsMounted from './hooks/useIsMounted'

const ClientContext: React.Context<typeof StreamrClient> = createContext(null)

type Props = {
    children: string,
    autoConnect?: boolean,
    autoDisconnect?: boolean,
}

const Provider: FunctionComponent<Props> = ({
    children,
    autoConnect = true,
    autoDisconnect = false,
    ...props
}) => {
    const isMounted = useIsMounted()

    const [params, setParams] = useState({
        autoConnect,
        autoDisconnect,
        ...props
    })
    
    useEffect(() => {
        const nextParams = {
            autoConnect,
            autoDisconnect,
            ...props
        }

        setParams((current) => eq(current, nextParams) ? current : nextParams)
    }, [autoConnect, autoDisconnect, props])

    const [client, setClient] = useState<typeof StreamrClient>(null)

    const [clientNo, requestNewClient] = useReducer((x) => x + 1, 0)

    useEffect(() => {
        const client = new StreamrClient(params)

        let resetting = false

        const reset = (...args: any) => {
            if (resetting) {
                return
            }
            resetting = true

            client.connection.off('disconnecting', reset)
            client.connection.off('disconnected', reset)
            client.off('error', reset)

            client.ensureDisconnected()

            if (isMounted()) {
                requestNewClient()
            }
        }

        client.connection.once('disconnecting', reset)
        client.connection.once('disconnected', reset)
        client.once('error', reset)

        setClient(client)

        return () => {
            if (!resetting) {
                reset()
            }
        }

        // New clients are triggered by either changes in `params` or when explicitly requested
        // from the `reset` function, see `clientNo` and `requestNewClient` above.
    }, [clientNo, params, isMounted])

    return (
        <ClientContext.Provider value={client}>
            {children}
        </ClientContext.Provider>
    )
}

export const useClient = () => (
    useContext(ClientContext)
)

const defaultErrorHandler = (error: any) => {
    console.log(error)
}

export const useSubscription = (subscriptionParams: object, onMessage: (message: any) => void, onError?: (error: any) => void) => {
    const client = useClient()

    const onMessageRef = useRef(onMessage)

    useEffect(() => {
        onMessageRef.current = onMessage
    }, [onMessage])

    const onErrorRef = useRef(onError || defaultErrorHandler)

    useEffect(() => {
        onErrorRef.current = onError || defaultErrorHandler
    }, [onError])

    const [params, setParams] = useState(subscriptionParams)

    useEffect(() => {
        if (!eq(params, subscriptionParams)) {
            // Change current params only if – according to `eq` – they changed.
            setParams(subscriptionParams)
        }
    }, [subscriptionParams])

    useEffect(() => {
        if (!client) {
            return () => {
                // No client -> no unsubbing.
            }
        }

        const sub = (() => {
            try {
                return client.subscribe(params, (message: object) => {
                    onMessageRef.current(message)
                })
            } catch (e) {
                onErrorRef.current(e)
            }

            return null
        })()

        return () => {
            if (sub) {
                client.unsubscribe(sub)
            }
        }
    }, [client, params])
}

export default Provider
