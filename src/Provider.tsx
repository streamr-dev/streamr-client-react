import React, { ReactElement } from 'react'
import ClientContext from './ClientContext'
import type { StreamrClientConfig } from 'streamr-client'
import useClient from './useClient'

export type Props = {
    children: React.ReactNode,
} & StreamrClientConfig

export default function ClientProvider({ children, ...props }: Props): ReactElement | null {
    const client = useClient(props)

    if (!client) {
        return null
    }

    return (
        <ClientContext.Provider value={client!}>
            {children}
        </ClientContext.Provider>
    )
}
