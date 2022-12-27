import React, { type ReactNode, type ReactElement } from 'react'
import ClientContext from './ClientContext'
import type { StreamrClientConfig } from 'streamr-client'
import useClient from './useClient'

export interface Props extends StreamrClientConfig {
    children: ReactNode
}

export default function Provider({ children, ...props }: Props): ReactElement | null {
    const client = useClient(props)

    return <ClientContext.Provider value={client}>{children}</ClientContext.Provider>
}
