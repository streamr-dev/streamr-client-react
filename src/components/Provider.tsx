import React, { FunctionComponent, useEffect, useReducer, useState } from 'react'
import eq from 'deep-equal'
import StreamrClient from 'streamr-client'
import useIsMounted from '../hooks/useIsMounted'
import ClientContext from '../contexts/Client'

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

export default Provider
