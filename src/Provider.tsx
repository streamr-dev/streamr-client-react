import React, { FunctionComponent, useEffect, useRef, useState } from 'react'
import eq from 'deep-equal'
import StreamrClient from 'streamr-client'
import ClientContext from './ClientContext'
import type { StreamrClientConfig } from 'streamr-client'

export type Props = {
    children: React.ReactNode,
} & StreamrClientConfig

const isSSR = typeof window !== 'undefined'
function createClient(options: StreamrClientConfig) {
    return isSSR ? null : new StreamrClient(options)
}

const ClientProvider: FunctionComponent<Props> = ({
    children,
    ...props
}) => {
    const lastProps = useRef(props)
    useEffect(() => {
        lastProps.current = props
    }, [props])
    console.log('RENDER')

    const propsChanged = !eq(lastProps.current, props)
    const [client, setClient] = useState(() => createClient(props))

    useEffect(() => {
        // update client on changed props
        if (propsChanged) {
            setClient(createClient(props))
        }
    }, [props, propsChanged])

    useEffect(() => () => {
        // destroy old client
        client?.destroy()
    }, [client])

    if (!isSSR && !client) { return null }

    return (
        <ClientContext.Provider value={client!}>
            {children}
        </ClientContext.Provider>
    )
}

export default ClientProvider
