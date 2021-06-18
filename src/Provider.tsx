import React, { FunctionComponent, useEffect, useMemo, useState } from 'react'
import eq from 'deep-equal'
import StreamrClient from 'streamr-client'
import ClientContext from './ClientContext'

type Props = {
    children: string,
    autoConnect?: boolean,
    autoDisconnect?: boolean,
}

const ClientProvider: FunctionComponent<Props> = ({
    children,
    autoConnect = true,
    autoDisconnect = false,
    ...props
}) => {
    const [params, setParams] = useState(() => ({
        autoConnect,
        autoDisconnect,
        ...props
    }))

    useEffect(() => {
        const nextParams = {
            autoConnect,
            autoDisconnect,
            ...props
        }

        setParams((current) => eq(current, nextParams) ? current : nextParams)
    }, [autoConnect, autoDisconnect, props])

    const client = useMemo<typeof StreamrClient>(() => (
        new StreamrClient(params)
    ), [params])

    useEffect(() => () => {
        client.disconnect()
    }, [client])

    return (
        <ClientContext.Provider value={client}>
            {children}
        </ClientContext.Provider>
    )
}

export default ClientProvider
