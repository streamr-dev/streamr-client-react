import React, { createContext, useContext, FunctionComponent, useMemo, useEffect, useState, useRef } from 'react'
import StreamrClient from 'streamr-client'
import eq from 'deep-equal'

const ClientContext: React.Context<typeof StreamrClient> = createContext(null)

type Props = {
    children: string,
    autoConnect?: boolean,
    autoDisconnect?: boolean,
}

export const Provider: FunctionComponent<Props> = ({
    children,
    autoConnect = true,
    autoDisconnect = false,
    ...props
}) => {
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

    const [client, setClient] = useState(null)

    useEffect(() => {
        console.log('SET CLIENT', params)

        const client = new StreamrClient(params)

        setClient(client)

        return () => {
            const disconnect = async () => {
                try {
                    await client.disconnect()
                } catch (_) { /* */ }
            }

            disconnect()
        }
    }, [params])

    return (
        <ClientContext.Provider value={client}>
            {children}
        </ClientContext.Provider>
    )
}

export const useClient = () => (
    useContext(ClientContext)
)

export const useSubscription = (subscriptionParams: object, onMessage: (message: any) => void, onError?: (error: any) => void) => {
    const client = useClient()

    const onMessageRef = useRef(onMessage)

    useEffect(() => {
        onMessageRef.current = onMessage
    }, [onMessage])

    const onErrorRef = useRef(onError)

    useEffect(() => {
        onErrorRef.current = onError
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
                (onErrorRef.current || (() => console.log(e)))(e)
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
